import type {
    RuntimeContext,
    StepRunResult,
    ProfileRunResult,
    StepActionResult,
} from "./types";
import type {
    PersistedAutomationStep,
    PersistedStepRuntimePolicy,
    PersistedStepCondition,
    PersistedAssertionConfig,
    PersistedOutputMapping,
} from "../types/persisted-step";
import type { PersistedGameProfile } from "../types/persisted-profile";
import { dispatchStepByKind } from "./handlers";

/**
 * Internal control-flow errors used by the runtime policy layer.
 * These are not business errors; they are orchestration errors.
 */
class StepTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "StepTimeoutError";
    }
}

class StepCancelError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "StepCancelError";
    }
}

/**
 * Main Profile Execution Orchestrator.
 */
export async function runProfile(
    profile: PersistedGameProfile,
    context: RuntimeContext
): Promise<ProfileRunResult> {
    const startedAt = Date.now();

    context.emit({
        type: "run.started",
        runId: context.runId,
        profileId: profile.id,
        variables: { ...context.variables },
        timestamp: startedAt,
    });

    const stepResults: StepRunResult[] = [];
    let overallStatus: "completed" | "failed" | "cancelled" = "completed";
    let failedStepId: string | undefined;

    try {
        for (const step of profile.steps) {
            const result = await runStep(step, context);
            stepResults.push(result);

            if (result.status === "failed") {
                overallStatus = "failed";
                failedStepId = step.id;
                break;
            }

            if (result.status === "cancelled") {
                overallStatus = "cancelled";
                failedStepId = step.id;
                break;
            }
        }
    } catch (error: unknown) {
        overallStatus = "failed";
        const message =
            error instanceof Error ? error.message : "Unknown engine error";
        const stack = error instanceof Error ? error.stack : undefined;

        context.emit({
            type: "run.failed",
            runId: context.runId,
            error: { message, stack },
            failedStepId,
            timestamp: Date.now(),
        });
    }

    const finalResult: ProfileRunResult = {
        runId: context.runId,
        profileId: profile.id,
        status: overallStatus,
        startedAt,
        finishedAt: Date.now(),
        stepResults,
    };

    context.emit({
        type: "run.completed",
        runId: context.runId,
        result: finalResult,
        timestamp: finalResult.finishedAt,
    });

    return finalResult;
}

/**
 * Hardened 8-stage step execution pipeline.
 */
export async function runStep(
    step: PersistedAutomationStep,
    context: RuntimeContext
): Promise<StepRunResult> {
    const startedAt = Date.now();

    // 1. Condition Gate (First-Class Skip)
    const shouldRun = evaluateCondition(step.condition, context);
    if (!shouldRun) {
        context.emit({
            type: "step.skipped",
            runId: context.runId,
            stepId: step.id,
            condition: step.condition,
            timestamp: Date.now(),
        });

        return {
            stepId: step.id,
            status: "skipped",
            startedAt,
            finishedAt: Date.now(),
            attempts: 0,
        };
    }

    // 2. Abort Check (First-Class Cancel)
    if (context.signal.aborted) {
        context.emit({
            type: "step.cancelled",
            runId: context.runId,
            stepId: step.id,
            attempt: 0,
            timestamp: Date.now(),
        });

        return {
            stepId: step.id,
            status: "cancelled",
            startedAt,
            finishedAt: Date.now(),
            attempts: 0,
        };
    }

    // 3. Telemetry (Started)
    context.emit({
        type: "step.started",
        runId: context.runId,
        stepId: step.id,
        attempt: 1,
        timestamp: Date.now(),
    });

    // 4. Policy Wrapper (Retry + Timeout + Cancel)
    const { actionResult, attempts } = await executeWithPolicy(
        step.runtime,
        (signal) => dispatchStepByKind(step.id, step.config, context, signal),
        context,
        step.id
    );

    const durationMs = Date.now() - startedAt;

    // 5. Finalize Action State (Failure / Cancellation)
    if (!actionResult.ok) {
        const error =
            actionResult.error ?? {
                code: "STEP_FAILED",
                message: "Step execution failed.",
            };

        const isCancelled = error.code === "RUN_CANCELLED";

        if (isCancelled) {
            context.emit({
                type: "step.cancelled",
                runId: context.runId,
                stepId: step.id,
                attempt: attempts,
                timestamp: Date.now(),
            });
        } else {
            context.emit({
                type: "step.failed",
                runId: context.runId,
                stepId: step.id,
                attempt: attempts,
                error,
                durationMs,
                timestamp: Date.now(),
            });
        }

        return {
            stepId: step.id,
            status: isCancelled ? "cancelled" : "failed",
            startedAt,
            finishedAt: Date.now(),
            attempts,
            error,
        };
    }

    // 6. Assertion Engine (E1 stub)
    const assertionOk = await verifyAssertions(
        step.assertions,
        actionResult,
        context,
        step.id
    );

    if (!assertionOk) {
        const error = {
            code: "ASSERTION_FAILED",
            message: "Assertion failed.",
        };

        context.emit({
            type: "step.failed",
            runId: context.runId,
            stepId: step.id,
            attempt: attempts,
            error,
            durationMs,
            timestamp: Date.now(),
        });

        return {
            stepId: step.id,
            status: "failed",
            startedAt,
            finishedAt: Date.now(),
            attempts,
            error,
        };
    }

    // 7. Output Mapping
    const stepOutputs = resolveOutputs(step.outputMappings, actionResult, context);

    // 8. Success
    context.emit({
        type: "step.succeeded",
        runId: context.runId,
        stepId: step.id,
        attempt: attempts,
        result: actionResult,
        durationMs,
        timestamp: Date.now(),
    });

    return {
        stepId: step.id,
        status: "succeeded",
        startedAt,
        finishedAt: Date.now(),
        attempts,
        output: stepOutputs,
    };
}

/**
 * Centralized execution policy engine.
 * - No AbortSignal.reason
 * - No resolver mutation
 * - Timeout != Cancel
 */
async function executeWithPolicy(
    policy: PersistedStepRuntimePolicy,
    handler: (signal: AbortSignal) => Promise<StepActionResult>,
    context: RuntimeContext,
    stepId: string
): Promise<{ actionResult: StepActionResult; attempts: number }> {
    let lastResult: StepActionResult = {
        ok: false,
        error: { code: "NONE", message: "No execution" },
    };
    let attempts = 0;

    const retryCount = policy.retryCount ?? 0;
    const retryDelay = policy.retryDelayMs ?? 0;
    const timeoutMs = (policy.timeoutSec ?? 60) * 1000;

    while (attempts <= retryCount) {
        attempts++;

        if (context.signal.aborted) {
            return {
                actionResult: {
                    ok: false,
                    error: {
                        code: "RUN_CANCELLED",
                        message: "Run was cancelled by user.",
                    },
                },
                attempts,
            };
        }

        try {
            lastResult = await runAttemptWithTimeout(
                timeoutMs,
                context,
                (signal) => handler(signal)
            );

            if (lastResult.ok) {
                break;
            }

            context.logger.log(
                `Step ${stepId} attempt ${attempts} failed: ${lastResult.error?.message ?? "Unknown error"}`,
                "warn"
            );
        } catch (error: unknown) {
            if (error instanceof StepTimeoutError) {
                lastResult = {
                    ok: false,
                    error: { code: "STEP_TIMEOUT", message: error.message },
                };
                context.logger.log(`Step ${stepId} timed out.`, "error");
                break;
            }

            if (error instanceof StepCancelError) {
                lastResult = {
                    ok: false,
                    error: { code: "RUN_CANCELLED", message: error.message },
                };
                break;
            }

            const message =
                error instanceof Error ? error.message : "Inner policy execution error";

            lastResult = {
                ok: false,
                error: { code: "POLICY_ERROR", message },
            };
        }

        if (attempts <= retryCount && !lastResult.ok) {
            try {
                await waitWithAbort(retryDelay, context.signal);
            } catch (error: unknown) {
                if (error instanceof StepCancelError) {
                    return {
                        actionResult: {
                            ok: false,
                            error: {
                                code: "RUN_CANCELLED",
                                message: error.message,
                            },
                        },
                        attempts,
                    };
                }

                const message =
                    error instanceof Error
                        ? error.message
                        : "Retry delay interrupted unexpectedly";

                return {
                    actionResult: {
                        ok: false,
                        error: {
                            code: "POLICY_ERROR",
                            message,
                        },
                    },
                    attempts,
                };
            }
        }
    }

    return { actionResult: lastResult, attempts };
}

/**
 * Runs a single attempt with:
 * - linked global cancellation
 * - per-attempt timeout
 * - deterministic cleanup
 * - no AbortSignal.reason matching
 */
async function runAttemptWithTimeout(
    timeoutMs: number,
    context: RuntimeContext,
    handler: (signal: AbortSignal) => Promise<StepActionResult>
): Promise<StepActionResult> {
    const attemptController = new AbortController();

    let settled = false;

    const cleanupFns: Array<() => void> = [];

    const cleanup = (): void => {
        if (settled) return;
        settled = true;
        for (const fn of cleanupFns) fn();
    };

    const onGlobalAbort = (): void => {
        if (!attemptController.signal.aborted) {
            attemptController.abort();
        }
    };

    context.signal.addEventListener("abort", onGlobalAbort, { once: true });
    cleanupFns.push(() =>
        context.signal.removeEventListener("abort", onGlobalAbort)
    );

    const timer = setTimeout(() => {
        if (!attemptController.signal.aborted) {
            attemptController.abort();
        }
    }, timeoutMs);
    cleanupFns.push(() => clearTimeout(timer));

    const abortPromise = new Promise<never>((_, reject) => {
        const onAttemptAbort = (): void => {
            cleanup();

            if (context.signal.aborted) {
                reject(new StepCancelError("Run cancelled during attempt."));
            } else {
                reject(new StepTimeoutError(`Step timed out after ${timeoutMs}ms.`));
            }
        };

        attemptController.signal.addEventListener("abort", onAttemptAbort, {
            once: true,
        });
        cleanupFns.push(() =>
            attemptController.signal.removeEventListener("abort", onAttemptAbort)
        );
    });

    try {
        const result = await Promise.race([
            handler(attemptController.signal),
            abortPromise,
        ]);
        cleanup();
        return result;
    } catch (error) {
        cleanup();
        throw error;
    }
}

/**
 * Leak-proof abort-aware delay helper for retry backoff.
 */
async function waitWithAbort(
    delayMs: number,
    signal: AbortSignal
): Promise<void> {
    if (delayMs <= 0) {
        if (signal.aborted) {
            throw new StepCancelError("Cancelled during retry delay.");
        }
        return;
    }

    if (signal.aborted) {
        throw new StepCancelError("Cancelled during retry delay.");
    }

    await new Promise<void>((resolve, reject) => {
        const onAbort = (): void => {
            clearTimeout(delayTimer);
            signal.removeEventListener("abort", onAbort);
            reject(new StepCancelError("Cancelled during retry delay."));
        };

        const delayTimer = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, delayMs);

        signal.addEventListener("abort", onAbort, { once: true });
    });
}

/**
 * Condition evaluation using combined read scope.
 */
function evaluateCondition(
    condition: PersistedStepCondition | null | undefined,
    context: RuntimeContext
): boolean {
    if (!condition) return true;

    const scope = { ...context.variables, ...context.outputs };
    const sourceKind = condition.source.kind;
    let actual: unknown;

    if (sourceKind === "variable") {
        actual = scope[condition.source.name ?? ""];
    } else if (sourceKind === "state") {
        actual = scope[condition.source.key ?? ""];
    } else {
        return true;
    }

    const expected = condition.value;

    switch (condition.operator) {
        case "eq":
            return actual === expected;
        case "neq":
            return actual !== expected;
        case "exists":
            return actual !== undefined && actual !== null;
        case "not_exists":
            return actual === undefined || actual === null;
        case "contains":
            return (
                typeof actual === "string" &&
                typeof expected === "string" &&
                actual.includes(expected)
            );
        default:
            return true;
    }
}

/**
 * Output mapping resolution.
 */
function resolveOutputs(
    mappings: PersistedOutputMapping[] | undefined,
    result: StepActionResult,
    context: RuntimeContext
): Record<string, unknown> {
    const stepOutputs: Record<string, unknown> = {};

    if (!mappings || !result.output) {
        return stepOutputs;
    }

    for (const mapping of mappings) {
        const value = result.output[mapping.sourceKey];
        if (value !== undefined) {
            stepOutputs[mapping.targetVariableId] = value;
            context.outputs[mapping.targetVariableId] = value;
        }
    }

    return stepOutputs;
}

/**
 * Assertion verification.
 * E1 intentionally keeps this as a pass-through stub.
 */
async function verifyAssertions(
    assertions: PersistedAssertionConfig[] | undefined,
    _result: StepActionResult,
    _context: RuntimeContext,
    _stepId: string
): Promise<boolean> {
    if (!assertions || assertions.length === 0) {
        return true;
    }

    return true;
}