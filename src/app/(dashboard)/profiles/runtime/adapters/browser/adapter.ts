import type {
    DeviceAdapter,
    StepActionResult
} from "../../types";
import type {
    PersistedAutomationTarget,
    PersistedDetectionConfig
} from "../../../types/persisted-step";
import { BrowserTargetResolver } from "./resolver";
import type { BrowserSession } from "./session";

/**
 * BrowserDeviceAdapter implements the DeviceAdapter interface,
 * delegating high-level execution tasks to a BrowserSession and TargetResolver.
 * 
 * It ensures platform-agnostic commands from the engine are properly
 * translated into browser-driver-specific actions.
 */
export class BrowserDeviceAdapter implements DeviceAdapter {
    private readonly resolver: BrowserTargetResolver;

    constructor(private readonly session: BrowserSession) {
        this.resolver = new BrowserTargetResolver();
    }

    /**
     * Translates a high-level tap command into a browser click.
     */
    async tap(
        stepId: string,
        target: PersistedAutomationTarget,
        detection?: PersistedDetectionConfig,
        options?: { signal?: AbortSignal }
    ): Promise<StepActionResult> {
        const resolved = this.resolveTarget(target);
        await this.session.click(resolved, options?.signal);
        return { ok: true };
    }

    /**
     * Translates a high-level input command into a browser type.
     */
    async input(
        stepId: string,
        target: PersistedAutomationTarget,
        value: string,
        detection?: PersistedDetectionConfig,
        options?: { signal?: AbortSignal }
    ): Promise<StepActionResult> {
        const resolved = this.resolveTarget(target);
        await this.session.type(resolved, value, options?.signal);
        return { ok: true };
    }

    /**
     * Translates a high-level wait command into a browser wait.
     */
    async wait(
        stepId: string,
        target: PersistedAutomationTarget,
        state: "visible" | "hidden" | "presence",
        detection?: PersistedDetectionConfig,
        options?: { signal?: AbortSignal }
    ): Promise<StepActionResult> {
        const resolved = this.resolveTarget(target);
        await this.session.waitFor(resolved, state, options?.signal);
        return { ok: true };
    }

    /**
     * Implements URL navigation as an adapter capability.
     */
    async navigate(
        stepId: string,
        url: string,
        options?: { signal?: AbortSignal }
    ): Promise<StepActionResult> {
        await this.session.goto(url, options?.signal);
        return { ok: true };
    }

    /**
     * Captures a screenshot from the current browser page.
     */
    async screenshot(options?: { signal?: AbortSignal }): Promise<string> {
        return this.session.captureScreenshot(options?.signal);
    }

    /**
     * Internal helper to resolve targets with structured error context.
     */
    private resolveTarget(target: PersistedAutomationTarget) {
        return this.resolver.resolve(target);
    }
}
