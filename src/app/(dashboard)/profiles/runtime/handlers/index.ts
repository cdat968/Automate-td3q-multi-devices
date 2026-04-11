import type {
    RuntimeContext,
    StepActionResult
} from "../types";
import type {
    PersistedAutomationTarget,
    PersistedDetectionConfig,
    PersistedStepConfig
} from "../../types/persisted-step";
import { abortableDelay } from "../utils/abort";

/**
 * Policy-blind step handlers.
 * Dispatching logic is now 100% type-safe without 'any' casts.
 */

export async function handleTap(
    stepId: string,
    target: PersistedAutomationTarget,
    detection: PersistedDetectionConfig | undefined,
    context: RuntimeContext,
    signal: AbortSignal
): Promise<StepActionResult> {
    context.logger.log(`Tapping target: ${target.kind}`, "info");
    return await context.adapter.tap(stepId, target, detection, { signal });
}

export async function handleInput(
    stepId: string,
    target: PersistedAutomationTarget,
    value: string,
    detection: PersistedDetectionConfig | undefined,
    context: RuntimeContext,
    signal: AbortSignal
): Promise<StepActionResult> {
    context.logger.log(`Inputting value to target: ${target.kind}`, "info");
    return await context.adapter.input(stepId, target, value, detection, { signal });
}

export async function handleWait(
    stepId: string,
    target: PersistedAutomationTarget,
    state: "visible" | "hidden" | "presence",
    detection: PersistedDetectionConfig | undefined,
    context: RuntimeContext,
    signal: AbortSignal
): Promise<StepActionResult> {
    context.logger.log(`Waiting for ${state} on target: ${target.kind}`, "info");
    return await context.adapter.wait(stepId, target, state, detection, { signal });
}

export async function handleNavigation(
    stepId: string,
    url: string,
    context: RuntimeContext,
    signal: AbortSignal
): Promise<StepActionResult> {
    context.logger.log(`Navigating to URL: ${url}`, "info");
    return await context.adapter.navigate(stepId, url, { signal });
}

/**
 * Dispatcher for step kinds.
 */
export async function dispatchStepByKind(
    stepId: string,
    config: PersistedStepConfig,
    context: RuntimeContext,
    signal: AbortSignal
): Promise<StepActionResult> {
    switch (config.kind) {
        case "dom_click":
            return await handleTap(stepId, config.target, undefined, context, signal);

        case "visual_click":
            return await handleTap(stepId, config.target, config.detection, context, signal);

        case "dom_type":
            return await handleInput(stepId, config.target, config.value, undefined, context, signal);

        case "visual_type":
            return await handleInput(stepId, config.target, config.value, config.detection, context, signal);

        case "wait_dom":
            return await handleWait(stepId, config.target, config.state, undefined, context, signal);

        case "wait_visual":
            return await handleWait(stepId, config.target, config.state, config.detection, context, signal);

        case "delay":
            await abortableDelay(config.durationMs, signal);
            return { ok: true, meta: { action: "delay", durationMs: config.durationMs } };

        case "navigation":
            return await handleNavigation(stepId, config.url, context, signal);

        default:
            return {
                ok: false,
                error: {
                    code: "UNSUPPORTED_STEP_KIND",
                    message: `Step kind "${config.kind}" is not yet implemented in E1.`
                }
            };
    }
}
