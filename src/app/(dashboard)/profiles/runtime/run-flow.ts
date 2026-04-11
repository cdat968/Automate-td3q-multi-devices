import { AutomationStep } from "../types/automation-step";
import { ExecutionContext } from "../types/execution-context";
import { FlowExecutionResult, StepExecutionResult } from "../types/execution-result";
import { DeviceAdapter } from "../adapters/device-adapter";
import { runStep } from "./run-step";

/**
 * Minimal Flow Runner skeleton (Block B4).
 * Orchestrates sequential execution of steps through runStep.
 * Stops immediately on the first fatal failure.
 */
export async function runFlow(
    steps: AutomationStep[],
    context: ExecutionContext,
    adapter: DeviceAdapter
): Promise<FlowExecutionResult> {
    context.onEvent?.({ kind: "flow_started", runId: context.runId, profileId: context.profileId, timestamp: Date.now() });
    
    const results: StepExecutionResult[] = [];
    let completedSteps = 0;
    let failedStepId: string | undefined = undefined;
    let overallOk = true;

    for (const step of steps) {
        const result = await runStep(step, context, adapter);
        results.push(result);

        if (result.ok) {
            completedSteps++;
        } else {
            overallOk = false;
            failedStepId = result.stepId ?? step.id;
            break;
        }
    }

    const flowResult: FlowExecutionResult = {
        runId: context.runId,
        ok: overallOk,
        totalSteps: steps.length,
        completedSteps,
        failedStepId,
        results,
    };

    context.onEvent?.({ kind: "flow_finished", runId: context.runId, result: flowResult, timestamp: Date.now() });

    return flowResult;
}
