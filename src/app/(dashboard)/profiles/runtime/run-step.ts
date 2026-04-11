import { 
    AutomationStep, 
    StepConfig,
    DomClickStepConfig,
    DomTypeStepConfig,
    VisualClickStepConfig,
    VisualTypeStepConfig,
    WaitDomStepConfig,
    WaitVisualStepConfig,
    WaitTabStepConfig,
    DelayStepConfig,
    NavigateStepConfig
} from "../types/automation-step";
import { ExecutionContext } from "../types/execution-context";
import { StepExecutionResult, StepOutputData, StepEvidence } from "../types/execution-result";
import { DeviceAdapter } from "../adapters/device-adapter";
import { validateStepForRuntime } from "./validation";

/**
 * Specialized error for automation runtime issues.
 */
class RuntimeExecutionError extends Error {
    constructor(public message: string, public code: string = "EXECUTION_ERROR") {
        super(message);
        this.name = "RuntimeExecutionError";
    }
}

/**
 * Executes a single AutomationStep and returns a structured result.
 */
export async function runStep(
    step: AutomationStep,
    context: ExecutionContext,
    adapter: DeviceAdapter
): Promise<StepExecutionResult> {
    const startedAt = Date.now();
    context.onEvent?.({ kind: "step_started", stepId: step.id, timestamp: startedAt });

    // Runtime-aware validation check before execution
    const validation = validateStepForRuntime(step);
    if (!validation.valid) {
        return finalizeStepResult(step, false, startedAt, {
            status: "failed",
            message: validation.message,
            errorCode: validation.code,
        }, context);
    }

    try {
        const output = await executeStepConfig(step.config, adapter, step);
        return finalizeStepResult(step, true, startedAt, { status: "success", output }, context);
    } catch (error: unknown) {
        let message = "Unknown execution error";
        let errorCode = "EXECUTION_ERROR";

        if (error instanceof RuntimeExecutionError) {
            message = error.message;
            errorCode = error.code;
        } else if (error instanceof Error) {
            message = error.message;
        }
        
        return finalizeStepResult(step, false, startedAt, {
            status: "failed",
            message,
            errorCode,
        }, context);
    }
}

/**
 * Internal dispatcher for specialized step kind execution.
 */
async function executeStepConfig(
    config: StepConfig, 
    adapter: DeviceAdapter,
    step: AutomationStep
): Promise<StepOutputData | undefined> {
    switch (config.kind) {
        case "navigation":
            return executeNavigation(config, adapter);
        case "dom_click":
        case "dom_type":
            return executeDomAction(config, adapter);
        case "visual_click":
        case "visual_type":
            return executeVisualAction(config, adapter);
        case "wait_dom":
            return executeWaitDom(config, adapter);
        case "wait_visual":
            return executeWaitVisual(config, adapter, step.runtime.timeoutSec);
        case "wait_tab":
            return executeWaitTab(config, adapter);
        case "delay":
            return executeDelay(config, adapter);
        case "assertion":
        case "tab_management":
        case "loop":
        case "branch":
            throw new RuntimeExecutionError(
                `Step kind "${config.kind}" is not yet implemented in the current runtime`,
                "NOT_IMPLEMENTED"
            );
        default: {
            const _exhaustiveCheck: never = config;
            throw new RuntimeExecutionError(
                `Unsupported step config variant: ${JSON.stringify(_exhaustiveCheck)}`,
                "UNSUPPORTED_STEP_KIND"
            );
        }
    }
}

async function executeNavigation(config: NavigateStepConfig, adapter: DeviceAdapter): Promise<undefined> {
    // Mock simulation for Dry Run: Log to message
    // In a real environment, this might call adapter.navigate(config.url)
    if (adapter.emitLog) {
        adapter.emitLog(`Navigating to: ${config.url}`);
    }
    return undefined;
}

async function executeDomAction(
    config: DomClickStepConfig | DomTypeStepConfig, 
    adapter: DeviceAdapter
): Promise<undefined> {
    if (config.kind === "dom_click") {
        await adapter.click(config.target);
    } else {
        await adapter.input(config.target, config.value);
    }
    return undefined;
}

async function executeVisualAction(
    config: VisualClickStepConfig | VisualTypeStepConfig, 
    adapter: DeviceAdapter
): Promise<StepOutputData | undefined> {
    if (config.kind === "visual_click") {
        await adapter.click(config.target);
    } else {
        await adapter.input(config.target, config.value);
    }
    return undefined;
}

async function executeWaitDom(config: WaitDomStepConfig, adapter: DeviceAdapter): Promise<undefined> {
    // Basic polling for DOM state
    const isPresent = await adapter.detect(config.target, { timeoutMs: 5000 });
    if (config.state === "visible" && !isPresent) {
        throw new RuntimeExecutionError(`DOM target "${config.target.selector}" not visible`, "WAIT_TIMEOUT");
    }
    if (config.state === "hidden" && isPresent) {
        throw new RuntimeExecutionError(`DOM target "${config.target.selector}" still visible`, "WAIT_TIMEOUT");
    }
    return undefined;
}

async function executeWaitVisual(
    config: WaitVisualStepConfig, 
    adapter: DeviceAdapter,
    timeoutSec: number
): Promise<StepOutputData | undefined> {
    const isPresent = await adapter.detect(config.target, {
        timeoutMs: timeoutSec * 1000,
    });
    
    if (config.state === "visible" && !isPresent) {
        throw new RuntimeExecutionError(`Visual target not detected within ${timeoutSec}s`, "WAIT_TIMEOUT");
    }
    if (config.state === "hidden" && isPresent) {
        throw new RuntimeExecutionError(`Visual target still detected after ${timeoutSec}s`, "WAIT_TIMEOUT");
    }
    return undefined;
}

async function executeWaitTab(config: WaitTabStepConfig, adapter: DeviceAdapter): Promise<undefined> {
    // Mock simulation for Dry Run (Phase C requirement)
    // To be replaced with real tab registry polling in production
    await adapter.wait(400); // 300-500ms delay
    return undefined;
}

async function executeDelay(config: DelayStepConfig, adapter: DeviceAdapter): Promise<undefined> {
    await adapter.wait(config.durationMs);
    return undefined;
}

function finalizeStepResult(
    step: AutomationStep,
    ok: boolean,
    startedAt: number,
    params: Partial<StepExecutionResult>,
    context: ExecutionContext
): StepExecutionResult {
    const finishedAt = Date.now();
    const result: StepExecutionResult = {
        stepId: step.id,
        ok,
        status: params.status || (ok ? "success" : "failed"),
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
        message: params.message,
        errorCode: params.errorCode,
        output: params.output,
        evidence: ok ? undefined : { screenshotPath: "/evidence/failure.png" }, // Placeholder
    };
    
    context.onEvent?.({ kind: "step_finished", stepId: step.id, result, timestamp: finishedAt });
    return result;
}
