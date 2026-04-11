import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { ResolvedBrowserTarget } from "./resolver";
import { throwIfAborted } from "../../utils/abort";
import { BrowserSession } from "./session";

/**
 * Real browser session backed by Playwright Chromium.
 * Implements the BrowserSession contract for real local execution.
 */
export class RealBrowserSession implements BrowserSession {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private readonly headless: boolean;

    constructor(options?: { headless?: boolean }) {
        this.headless = options?.headless ?? true;
    }

    /**
     * Expose the internal Playwright page for assertions in verification scripts.
     * This is acceptable for contained, internal use cases as per architectural guardrails.
     */
    public getPage(): Page | null {
        return this.page;
    }

    private async ensurePage(): Promise<Page> {
        if (!this.browser) {
            this.browser = await chromium.launch({ headless: this.headless });
            this.context = await this.browser.newContext();
            this.page = await this.context.newPage();
        }
        return this.page!;
    }

    async goto(url: string, signal?: AbortSignal): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensurePage();

        // Pass signal to playwright if possible, but throwIfAborted is mandatory first
        await page.goto(url, { waitUntil: "domcontentloaded" });
    }

    async click(target: ResolvedBrowserTarget, signal?: AbortSignal): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensurePage();
        await page.click(target.selector);
    }

    async type(target: ResolvedBrowserTarget, value: string, signal?: AbortSignal): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensurePage();
        // fill() is clearer for automation than type() as it clears the field first
        await page.fill(target.selector, value);
    }

    async waitFor(
        target: ResolvedBrowserTarget,
        state: "visible" | "hidden" | "presence",
        signal?: AbortSignal
    ): Promise<void> {
        throwIfAborted(signal);
        const page = await this.ensurePage();

        const playwrightState = state === "presence" ? "attached" : state;
        await page.waitForSelector(target.selector, { state: playwrightState });
    }

    async captureScreenshot(signal?: AbortSignal): Promise<string> {
        throwIfAborted(signal);
        const page = await this.ensurePage();
        const buffer = await page.screenshot();
        return buffer.toString("base64");
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
            console.log("[RealBrowserSession] Browser closed.");
        }
    }
}
