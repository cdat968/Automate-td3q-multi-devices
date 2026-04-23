import type { ResolvedBrowserTarget } from "./resolver";
import { throwIfAborted } from "../../utils/abort";

export interface BrowserQueryResult {
    found: boolean;
    visible?: boolean;
    enabled?: boolean;
    value?: string | null;
    text?: string | null;
    meta?: Record<string, unknown>;
}

export interface RelativeClickResult {
    targetSelector: string;
    x: number;
    y: number;
    xRatio: number;
    yRatio: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface BrowserSession {
    goto(url: string, signal?: AbortSignal): Promise<void>;

    click(target: ResolvedBrowserTarget, signal?: AbortSignal): Promise<void>;

    clickPoint?(x: number, y: number, signal?: AbortSignal): Promise<void>;
    movePointer?(x: number, y: number, signal?: AbortSignal): Promise<void>;

    type(
        target: ResolvedBrowserTarget,
        value: string,
        signal?: AbortSignal,
    ): Promise<void>;

    waitFor(
        target: ResolvedBrowserTarget,
        state: "visible" | "hidden" | "presence",
        signal?: AbortSignal,
    ): Promise<void>;

    captureScreenshot(signal?: AbortSignal): Promise<string>;

    close(): Promise<void>;

    // 🔥 ADD FULL SUPPORT
    focus(target: ResolvedBrowserTarget, signal?: AbortSignal): Promise<void>;

    pressKey(key: string, signal?: AbortSignal): Promise<void>;

    query(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<BrowserQueryResult>;

    clickAndAdoptNewPage(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<void>;

    clickRelativePoint(
        target: ResolvedBrowserTarget,
        xRatio: number,
        yRatio: number,
        signal?: AbortSignal,
    ): Promise<RelativeClickResult>;
}

export class NodeBrowserSession implements BrowserSession {
    async goto(url: string, signal?: AbortSignal): Promise<void> {
        throwIfAborted(signal);
        // Implementation would use driver.goto(...)
        console.log(`[BrowserSession] Navigating to: ${url}`);
    }

    async clickAndAdoptNewPage(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        console.log(
            `[BrowserSession] Clicking and adopting new page: ${target.selector} (${target.strategy})`,
        );
    }

    async movePointer(
        x: number,
        y: number,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        console.log(`[BrowserSession] Moving pointer to: (${x}, ${y})`);
    }

    async click(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        // Implementation would use driver.click(target.selector)
        console.log(
            `[BrowserSession] Clicking element: ${target.selector} (${target.strategy})`,
        );
    }

    async type(
        target: ResolvedBrowserTarget,
        value: string,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        // Implementation would use driver.type(target.selector, value)
        console.log(
            `[BrowserSession] Typing "${value}" into: ${target.selector}`,
        );
    }

    async waitFor(
        target: ResolvedBrowserTarget,
        state: "visible" | "hidden" | "presence",
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        // Implementation would use driver.waitForSelector(...)
        console.log(
            `[BrowserSession] Waiting for ${state} on: ${target.selector}`,
        );
    }

    async captureScreenshot(signal?: AbortSignal): Promise<string> {
        throwIfAborted(signal);
        // Implementation would use driver.screenshot()
        return "base64_screenshot_data";
    }

    async focus(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<void> {
        throwIfAborted(signal);
        console.log(
            `[BrowserSession] Focusing element: ${target.selector} (${target.strategy})`,
        );
    }

    async pressKey(key: string, signal?: AbortSignal): Promise<void> {
        throwIfAborted(signal);
        console.log(`[BrowserSession] Pressing key: ${key}`);
    }

    async query(
        target: ResolvedBrowserTarget,
        signal?: AbortSignal,
    ): Promise<BrowserQueryResult> {
        throwIfAborted(signal);
        console.log(
            `[BrowserSession] Querying element: ${target.selector} (${target.strategy})`,
        );

        return {
            found: false,
            visible: false,
            enabled: false,
            value: null,
            text: null,
            meta: {
                selector: target.selector,
                strategy: target.strategy,
            },
        };
    }

    async clickRelativePoint(
        target: ResolvedBrowserTarget,
        xRatio: number,
        yRatio: number,
        signal?: AbortSignal,
    ): Promise<RelativeClickResult> {
        throwIfAborted(signal);

        console.log(
            `[BrowserSession] Clicking relative point (${xRatio}, ${yRatio}) on: ${target.selector}`,
        );

        return {
            targetSelector: target.selector,
            x: NaN,
            y: NaN,
            xRatio,
            yRatio,
            boundingBox: {
                x: NaN,
                y: NaN,
                width: NaN,
                height: NaN,
            },
        };
    }

    async close(): Promise<void> {
        console.log("[BrowserSession] Closing session.");
    }
}
