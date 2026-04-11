import type { PersistedAutomationTarget } from "../../../types/persisted-step";

export type ResolvedBrowserTarget = {
    strategy: "css" | "xpath";
    selector: string;
};

export class BrowserTargetResolver {
    /**
     * Maps a PersistedAutomationTarget to a precise browser-ready shape.
     * Enforces validation and strategy selection rules.
     */
    resolve(target: PersistedAutomationTarget): ResolvedBrowserTarget {
        if (target.kind !== "dom") {
            throw new Error(`UNSUPPORTED_TARGET_KIND: Only DOM targets are supported in E2.1. Got: ${target.kind}`);
        }

        const selector = target.selector?.trim();
        
        if (!selector) {
            throw new Error("INVALID_SELECTOR: Selector must be a non-empty string.");
        }

        return {
            strategy: target.useXpath ? "xpath" : "css",
            selector
        };
    }
}
