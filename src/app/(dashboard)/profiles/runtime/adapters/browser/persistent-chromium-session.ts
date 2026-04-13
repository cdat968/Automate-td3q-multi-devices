import { chromium, type BrowserContext, type Page } from "playwright";
import type { ResolvedBrowserTarget } from "./resolver";
import { throwIfAborted } from "../../utils/abort";
import {
    BrowserSession,
    BrowserQueryResult,
    RelativeClickResult,
} from "./session";

function assertRatio(name: string, value: number): void {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error(
            `INVALID_RELATIVE_RATIO: ${name} must be a finite number in [0..1], got ${value}`,
        );
    }
}

/**
 * Persistent browser session backed by Playwright Chromium.
 * Uses launchPersistentContext() to maintain browser state (cookies, storage, etc.).
 * Supports extension injection (e.g., Ruffle) for real-world target automation.
 */
export class PersistentChromiumSession implements BrowserSession {
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    constructor(
        private readonly options: {
            userDataDir: string;
            extensionPath?: string;
            headless?: boolean;
            slowMo?: number;
        },
    ) {}

    /**
     * Expose the internal Playwright page for assertions in verification scripts.
     */
    public getPage(): Page | null {
        return this.page;
    }

    /**
     * Expose the browser context for tab-waiting or other context-level events.
     */
    public getContext(): BrowserContext | null {
        return this.context;
    }

    private async ensureContext(): Promise<Page> {
        if (!this.context) {
            console.log(
                `[PersistentChromiumSession] Launching with profile at: ${this.options.userDataDir}`,
            );

            const launchArgs = [
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox", // Often required for extension loading in some server environments
                "--hide-crash-restore-bubble",
                "--start-maximized",
            ];

            if (this.options.extensionPath) {
                console.log(
                    `[PersistentChromiumSession] Injecting extension from: ${this.options.extensionPath}`,
                );
                launchArgs.push(
                    `--disable-extensions-except=${this.options.extensionPath}`,
                    `--load-extension=${this.options.extensionPath}`,
                );
            }

            this.context = await chromium.launchPersistentContext(
                this.options.userDataDir,
                {
                    headless: this.options.headless ?? true,
                    slowMo: this.options.slowMo ?? 0,
                    args: launchArgs,
                    viewport: null,
                    // viewport: { width: 1280, height: 720 },
                },
            );

            // Persistent contexts usually have at least one page opened by default
            const pages = this.context.pages();
            this.page =
                pages.length > 0 ? pages[0] : await this.context.newPage();

            console.log(
                "[PersistentChromiumSession] Persistent context and page acquired.",
            );
        }
        return this.page!;
    }

    async goto(url: string, signal?: AbortSignal): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensureContext();
        await page.goto(url, { waitUntil: "domcontentloaded" });
    }

    async clickAndAdoptNewPage(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensureContext();
        const context = this.context!;

        const popupPromise = context.waitForEvent("page");

        await page.click(target.selector);

        const newPage = await popupPromise;
        await newPage.waitForLoadState("domcontentloaded");

        console.log(
            "[PersistentChromiumSession] New tab detected -> switched active page.",
        );
        this.page = newPage;
    }

    async click(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensureContext();
        await page.click(target.selector);
    }

    async clickPoint(
        x: number,
        y: number,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensureContext();
        const dpr = await this.getDevicePixelRatio();

        const cssX = x / dpr;
        const cssY = y / dpr;

        console.log(
            `[PersistentChromiumSession] Absolute click at image=(${x}, ${y}) css=(${cssX.toFixed(1)}, ${cssY.toFixed(1)}) dpr=${dpr}`,
        );

        await page.mouse.click(cssX, cssY);
    }

    async type(
        target: ResolvedBrowserTarget,
        value: string,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensureContext();
        await page.fill(target.selector, value);
    }

    async waitFor(
        target: ResolvedBrowserTarget,
        state: "visible" | "hidden" | "presence",
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensureContext();

        const playwrightState = state === "presence" ? "attached" : state;
        await page.waitForSelector(target.selector, { state: playwrightState });
    }

    async captureScreenshot(signal?: AbortSignal): Promise<string> {
        throwIfAborted(signal);
        const page = await this.ensureContext();
        const buffer = await page.screenshot();
        return buffer.toString("base64");
    }

    async close(): Promise<void> {
        if (this.context) {
            await this.context.close();
            this.context = null;
            this.page = null;
            console.log(
                "[PersistentChromiumSession] Persistent context closed.",
            );
        }
    }

    async query(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<BrowserQueryResult> {
        throwIfAborted(signal);
        const page = await this.ensureContext();

        const locator = page.locator(target.selector);
        const count = await locator.count();

        if (count === 0) {
            return { found: false };
        }

        const first = locator.first();

        const visible = await first.isVisible().catch(() => false);
        const enabled = await first.isEnabled().catch(() => false);

        let value: string | null = null;
        try {
            value = await first.inputValue();
        } catch {}

        let text: string | null = null;
        try {
            text = await first.textContent();
        } catch {}

        return {
            found: true,
            visible,
            enabled,
            value,
            text,
        };
    }

    async focus(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensureContext();
        await page.focus(target.selector);
    }

    async pressKey(key: string, signal?: AbortSignal): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensureContext();
        await page.keyboard.press(key);
    }

    // async clickRelativePoint(
    //     target: ResolvedBrowserTarget,
    //     xRatio: number,
    //     yRatio: number,
    //     signal?: AbortSignal,
    // ): Promise<RelativeClickResult> {
    //     throwIfAborted(signal);

    //     const page = await this.ensureContext();
    //     const locator = page.locator(target.selector).first();

    //     const box = await locator.boundingBox();
    //     if (!box) {
    //         throw new Error(
    //             `RELATIVE_CLICK_FAILED: could not resolve bounding box for ${target.selector}`,
    //         );
    //     }

    //     const x = box.x + box.width * xRatio;
    //     const y = box.y + box.height * yRatio;

    //     console.log(
    //         `[PersistentChromiumSession] Relative click on ${target.selector} at (${x.toFixed(1)}, ${y.toFixed(1)}) from ratios (${xRatio}, ${yRatio})`,
    //     );

    //     await page.mouse.click(x, y);
    // }
    async clickRelativePoint(
        target: ResolvedBrowserTarget,
        xRatio: number,
        yRatio: number,
        signal?: AbortSignal,
    ): Promise<RelativeClickResult> {
        throwIfAborted(signal);
        assertRatio("xRatio", xRatio);
        assertRatio("yRatio", yRatio);

        const page = await this.ensureContext();
        const locator = page.locator(target.selector).first();

        const count = await page.locator(target.selector).count();
        if (count === 0) {
            throw new Error(
                `RELATIVE_CLICK_FAILED: target not found for selector ${target.selector}`,
            );
        }

        const visible = await locator.isVisible().catch(() => false);
        if (!visible) {
            throw new Error(
                `RELATIVE_CLICK_FAILED: target exists but is not visible for selector ${target.selector}`,
            );
        }

        const box = await locator.boundingBox();
        if (!box) {
            throw new Error(
                `RELATIVE_CLICK_FAILED: could not resolve bounding box for ${target.selector}`,
            );
        }

        const x = box.x + box.width * xRatio;
        const y = box.y + box.height * yRatio;

        console.log(
            `[PersistentChromiumSession] Relative click on ${target.selector} at (${x.toFixed(1)}, ${y.toFixed(1)}) from ratios (${xRatio}, ${yRatio})`,
        );

        await page.mouse.click(x, y);

        return {
            targetSelector: target.selector,
            x,
            y,
            xRatio,
            yRatio,
            boundingBox: {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
            },
        };
    }

    private async getDevicePixelRatio(): Promise<number> {
        const page = await this.ensureContext();
        return await page.evaluate(() => window.devicePixelRatio || 1);
    }
}
