import type { BrowserSession, RelativeClickResult } from "./session";
import type { ResolvedBrowserTarget } from "./resolver";

import { RuntimeTargetRef } from "../../actions/action-types";
import { DeviceAdapter, TargetPresenceResult } from "../device-adapter";

export class BrowserRuntimeAdapter implements DeviceAdapter {
    constructor(private readonly session: BrowserSession) {}

    async movePointer(
        xRatio: number,
        yRatio: number,
        signal?: AbortSignal,
    ): Promise<void> {
        if (!this.session.movePointer) {
            throw new Error("BrowserSession does not support movePointer");
        }

        await this.session.movePointer(xRatio, yRatio, signal);
    }

    async clickRelativePoint(
        target: RuntimeTargetRef,
        xRatio: number,
        yRatio: number,
        signal?: AbortSignal,
    ): Promise<RelativeClickResult> {
        const resolved = this.resolveRuntimeTarget(target);
        return await this.session.clickRelativePoint(
            resolved,
            xRatio,
            yRatio,
            signal,
        );
    }

    async click(target: RuntimeTargetRef, signal?: AbortSignal): Promise<void> {
        const resolved = this.resolveRuntimeTarget(target);
        await this.session.click(resolved, signal);
    }

    async clickPoint(
        x: number,
        y: number,
        signal?: AbortSignal,
    ): Promise<void> {
        if (!this.session.clickPoint) {
            throw new Error("BrowserSession does not support clickPoint");
        }

        await this.session.clickPoint(x, y, signal);
    }

    async clickAndAdoptNewPage(
        target: RuntimeTargetRef,
        signal?: AbortSignal,
    ): Promise<void> {
        const resolved = this.resolveRuntimeTarget(target);
        await this.session.clickAndAdoptNewPage(resolved, signal);
    }

    async type(
        target: RuntimeTargetRef,
        value: string,
        _options?: { clearBeforeType?: boolean },
        signal?: AbortSignal,
    ): Promise<void> {
        const resolved = this.resolveRuntimeTarget(target);
        await this.session.type(resolved, value, signal);
    }

    async focus(target: RuntimeTargetRef, signal?: AbortSignal): Promise<void> {
        const resolved = this.resolveRuntimeTarget(target);

        await this.session.focus(resolved, signal);
    }

    async pressKey(key: string, signal?: AbortSignal): Promise<void> {
        await this.session.pressKey(key, signal);
    }

    async wait(durationMs: number, signal?: AbortSignal): Promise<void> {
        if (signal?.aborted) {
            throw new Error("Aborted");
        }

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(resolve, durationMs);

            if (signal) {
                signal.addEventListener(
                    "abort",
                    () => {
                        clearTimeout(timeout);
                        reject(new Error("Aborted"));
                    },
                    { once: true },
                );
            }
        });
    }

    async queryTarget(
        target: RuntimeTargetRef,
        signal?: AbortSignal,
    ): Promise<TargetPresenceResult> {
        const resolved = this.resolveRuntimeTarget(target);

        const result = await this.session.query(resolved, signal);

        return {
            found: result.found,
            visible: result.visible,
            enabled: result.enabled,
            value: result.value ?? null,
            text: result.text ?? null,
            meta: result.meta,
        };
    }

    async navigate(url: string, signal?: AbortSignal): Promise<void> {
        await this.session.goto(url, signal);
    }

    async screenshot(signal?: AbortSignal): Promise<Buffer> {
        const base64 = await this.session.captureScreenshot(signal);
        return Buffer.from(base64, "base64");
    }
    // async screenshot(signal?: AbortSignal): Promise<string> {
    //     return this.session.captureScreenshot(signal);
    // }

    private resolveRuntimeTarget(
        target: RuntimeTargetRef,
    ): ResolvedBrowserTarget {
        if (target.kind !== "dom" && target.kind !== "canvas") {
            throw new Error(
                `UNSUPPORTED_RUNTIME_TARGET: Browser runtime adapter only supports dom/canvas. Got: ${target.kind}`,
            );
        }

        const selector = target.locator?.trim();
        if (!selector) {
            throw new Error(
                `INVALID_RUNTIME_TARGET: ${target.id} does not provide a locator`,
            );
        }

        return {
            strategy: target.strategy ?? "css",
            selector,
        };
    }
}
