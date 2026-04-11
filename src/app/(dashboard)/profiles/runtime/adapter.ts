import type {
    DeviceAdapter,
    StepActionResult,
} from "./types";
import type {
    PersistedAutomationTarget,
    PersistedDetectionConfig,
} from "../types/persisted-step";

/**
 * Mock Device Adapter for E1 Runtime Foundation.
 * Used for deterministic verification of engine behaviors.
 */
export interface MockScenario {
    failOnStepId?: string;
    timeoutOnStepId?: string;
    errorOnStepId?: string;
    waitMs?: number;
    customOutputs?: Record<string, Record<string, unknown>>; // stepId -> { key: value }
}

export class MockDeviceAdapter implements DeviceAdapter {
    public calls: { method: string; stepId: string; args: unknown[] }[] = [];
    private readonly scenario: MockScenario;

    constructor(scenario: MockScenario = {}) {
        this.scenario = scenario;
    }

    private async simulate(
        stepId: string,
        signal?: AbortSignal
    ): Promise<StepActionResult> {
        if (this.scenario.waitMs) {
            await this.delay(this.scenario.waitMs, signal);
        }

        if (this.scenario.timeoutOnStepId === stepId) {
            await this.waitUntilAborted(signal);
        }

        if (
            this.scenario.failOnStepId === stepId ||
            this.scenario.errorOnStepId === stepId
        ) {
            return {
                ok: false,
                error: {
                    code: "MOCK_FAILURE",
                    message: `Mock failure triggered for step: ${stepId}`,
                },
            };
        }

        const output = this.scenario.customOutputs?.[stepId];

        return {
            ok: true,
            output,
            meta: {
                mock: true,
                stepId,
                timestamp: Date.now(),
            },
        };
    }

    private async delay(ms: number, signal?: AbortSignal): Promise<void> {
        if (signal?.aborted) {
            throw signal.reason ?? new Error("ABORTED");
        }

        await new Promise<void>((resolve, reject) => {
            const onAbort = (): void => {
                clearTimeout(timer);
                signal?.removeEventListener("abort", onAbort);
                reject(signal?.reason ?? new Error("ABORTED"));
            };

            const timer = setTimeout(() => {
                signal?.removeEventListener("abort", onAbort);
                resolve();
            }, ms);

            signal?.addEventListener("abort", onAbort, { once: true });
        });
    }

    /**
     * Simulates a long-running action that only stops when the engine aborts it
     * (for example due to timeout or explicit cancellation).
     */
    private async waitUntilAborted(signal?: AbortSignal): Promise<never> {
        if (signal?.aborted) {
            throw signal.reason ?? new Error("ABORTED");
        }

        return await new Promise<never>((_, reject) => {
            const onAbort = (): void => {
                signal?.removeEventListener("abort", onAbort);
                reject(signal?.reason ?? new Error("ABORTED"));
            };

            signal?.addEventListener("abort", onAbort, { once: true });
        });
    }

    async tap(
        stepId: string,
        target: PersistedAutomationTarget,
        detection?: PersistedDetectionConfig,
        options?: { signal?: AbortSignal }
    ): Promise<StepActionResult> {
        this.calls.push({
            method: "tap",
            stepId,
            args: [target, detection],
        });

        return this.simulate(stepId, options?.signal);
    }

    async input(
        stepId: string,
        target: PersistedAutomationTarget,
        value: string,
        detection?: PersistedDetectionConfig,
        options?: { signal?: AbortSignal }
    ): Promise<StepActionResult> {
        this.calls.push({
            method: "input",
            stepId,
            args: [target, value, detection],
        });

        return this.simulate(stepId, options?.signal);
    }

    async wait(
        stepId: string,
        target: PersistedAutomationTarget,
        state: "visible" | "hidden" | "presence",
        detection?: PersistedDetectionConfig,
        options?: { signal?: AbortSignal }
    ): Promise<StepActionResult> {
        this.calls.push({
            method: "wait",
            stepId,
            args: [target, state, detection],
        });

        return this.simulate(stepId, options?.signal);
    }

    async navigate(
        stepId: string,
        url: string,
        options?: { signal?: AbortSignal }
    ): Promise<StepActionResult> {
        this.calls.push({
            method: "navigate",
            stepId,
            args: [url],
        });

        return this.simulate(stepId, options?.signal);
    }

    async screenshot(options?: { signal?: AbortSignal }): Promise<string> {
        this.calls.push({
            method: "screenshot",
            stepId: "global",
            args: [],
        });

        if (options?.signal?.aborted) {
            throw new Error("ABORTED");
        }

        return "data:image/png;base64,mock_screenshot";
    }
}