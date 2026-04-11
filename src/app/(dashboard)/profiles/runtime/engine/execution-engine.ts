import type { DeviceAdapter } from "../adapters/device-adapter";
import type { TimelineRecorder } from "../timeline/timeline-recorder";
import type { RuntimeStateSnapshot } from "../state/runtime-state";
import type {
    ScenarioDefinition,
    ExecutionContext,
} from "../scenario/scenario-types";
import type { StateDetector } from "./state-detector";
import type { TransitionResolver } from "./transition-resolver";
import type { ActionExecutor } from "./action-executor";
import type { ExecutionEngineConfig } from "./engine-config";
import type { DiagnosticCollector } from "../../diagnostics/diagnostic-collector";
import { captureScreenshotArtifact } from "../../diagnostics/artifact/screenshot-helper";
import {
    EngineAbortedError,
    EngineIdleLimitError,
    EngineIterationLimitError,
} from "./engine-errors";

export interface ExecutionEngineRunInput {
    adapter: DeviceAdapter;
    scenario: ScenarioDefinition;
    timeline: TimelineRecorder;
    variables?: Record<string, string>;
    signal?: AbortSignal;
    /**
     * Optional diagnostics collector.
     * When provided, detector and action producers emit structured
     * DiagnosticRecords in addition to timeline events.
     */
    diagnostics?: DiagnosticCollector;
}

export interface ExecutionEngineRunResult {
    ok: boolean;
    finalState?: RuntimeStateSnapshot;
    iterations: number;
    timelineEvents: number;
    reason?: string;
}

export class ExecutionEngine {
    constructor(
        private readonly stateDetectorFactory: (
            scenario: ScenarioDefinition,
        ) => StateDetector,
        private readonly transitionResolverFactory: (
            scenario: ScenarioDefinition,
        ) => TransitionResolver,
        private readonly actionExecutor: ActionExecutor,
        private readonly config: ExecutionEngineConfig,
    ) {}

    async run(
        input: ExecutionEngineRunInput,
    ): Promise<ExecutionEngineRunResult> {
        const ctx: ExecutionContext = {
            adapter: input.adapter,
            timeline: input.timeline,
            scenario: input.scenario,
            variables: input.variables ?? {},
            iteration: 0,
            signal: input.signal,
            diagnostics: input.diagnostics,
        };

        const stateDetector = this.stateDetectorFactory(input.scenario);
        const transitionResolver = this.transitionResolverFactory(
            input.scenario,
        );

        let idleIterations = 0;
        let lastStateId: string | null = null;
        let finalState: RuntimeStateSnapshot | undefined;

        ctx.timeline.record({
            type: "ENGINE_STARTED",
            timestamp: new Date().toISOString(),
            iteration: 0,
            message: `Scenario ${input.scenario.id} started`,
        });

        try {
            const maxIterations =
                input.scenario.maxIterations ?? this.config.maxIterations;
            const idleLimit =
                input.scenario.idleIterationLimit ??
                this.config.idleIterationLimit;

            while (ctx.iteration < maxIterations) {
                this.throwIfAborted(ctx);

                ctx.iteration += 1;

                ctx.timeline.record({
                    type: "ITERATION_STARTED",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    message: "Iteration started",
                });

                const state = await stateDetector.detect(ctx);
                finalState = state;

                ctx.timeline.record({
                    type: "STATE_DETECTED",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state,
                    message: `Detected state ${state.id}`,
                });

                const transition = await transitionResolver.resolve(ctx, state);

                if (!transition) {
                    idleIterations += 1;

                    ctx.timeline.record({
                        type: "STATE_UNCHANGED",
                        timestamp: new Date().toISOString(),
                        iteration: ctx.iteration,
                        state,
                        message: "No eligible transition found",
                        meta: { idleIterations },
                    });

                    if (idleIterations >= idleLimit) {
                        throw new EngineIdleLimitError(
                            `No progress for ${idleIterations} iterations`,
                        );
                    }

                    await ctx.adapter.wait(
                        this.config.iterationDelayMs,
                        ctx.signal,
                    );
                    lastStateId = state.id;
                    continue;
                }

                ctx.timeline.record({
                    type: "TRANSITION_SELECTED",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state,
                    transitionId: transition.id,
                    message: `Selected transition ${transition.id}`,
                });

                const action = await transition.buildAction(ctx, state);

                ctx.timeline.record({
                    type: "ACTION_BUILT",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state,
                    transitionId: transition.id,
                    actionId: action.id,
                    message: `Built action ${action.kind}`,
                });

                const result = await this.actionExecutor.execute(ctx, action);

                if (!result.ok) {
                    const evidence = await this.captureEvidence(
                        ctx,
                        "action_failed",
                    );

                    ctx.timeline.record({
                        type: "ACTION_FAILED",
                        timestamp: new Date().toISOString(),
                        iteration: ctx.iteration,
                        state,
                        transitionId: transition.id,
                        actionId: action.id,
                        message: result.message ?? "Action failed",
                        meta: {
                            ...(result.evidence ?? {}),
                            ...(evidence ?? {}),
                        },
                    });
                } else {
                    ctx.timeline.record({
                        type: "ACTION_EXECUTED",
                        timestamp: new Date().toISOString(),
                        iteration: ctx.iteration,
                        state,
                        transitionId: transition.id,
                        actionId: action.id,
                        message: result.message ?? "Action executed",
                        meta: result.evidence,
                    });
                }

                if (transition.verifyAfterRun) {
                    const verified = await transition.verifyAfterRun(
                        ctx,
                        state,
                        result,
                    );
                    if (!verified) {
                        idleIterations += 1;
                    } else {
                        idleIterations = 0;
                    }
                } else {
                    idleIterations =
                        state.id === lastStateId ? idleIterations + 1 : 0;
                }

                lastStateId = state.id;

                await ctx.adapter.wait(
                    this.config.iterationDelayMs,
                    ctx.signal,
                );
            }

            throw new EngineIterationLimitError(
                `Reached max iteration limit: ${this.config.maxIterations}`,
            );
        } catch (error) {
            if (error instanceof EngineAbortedError) {
                ctx.timeline.record({
                    type: "ENGINE_ABORTED",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state: finalState,
                    message: error.message,
                });

                return {
                    ok: false,
                    finalState,
                    iterations: ctx.iteration,
                    timelineEvents: ctx.timeline.getEvents().length,
                    reason: error.message,
                };
            }

            const evidence = await this.captureEvidence(ctx, "engine_failed");

            ctx.timeline.record({
                type: "ENGINE_FAILED",
                timestamp: new Date().toISOString(),
                iteration: ctx.iteration,
                state: finalState,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown engine failure",
                meta: evidence,
            });

            return {
                ok: false,
                finalState,
                iterations: ctx.iteration,
                timelineEvents: ctx.timeline.getEvents().length,
                reason:
                    error instanceof Error
                        ? error.message
                        : "Unknown engine failure",
            };
        } finally {
            ctx.timeline.record({
                type: "ENGINE_COMPLETED",
                timestamp: new Date().toISOString(),
                iteration: ctx.iteration,
                state: finalState,
                message: "Engine run completed",
            });
        }
    }

    private throwIfAborted(ctx: ExecutionContext): void {
        if (ctx.signal?.aborted) {
            throw new EngineAbortedError();
        }
    }

    /**
     * Captures a failure screenshot via the shared artifact helper.
     * Returns the artifact path on success, or a structured error object
     * on failure — same shape as before, for backward compatibility.
     */
    private async captureEvidence(
        ctx: ExecutionContext,
        reason: string,
    ): Promise<Record<string, unknown> | undefined> {
        if (!ctx.adapter.screenshot) {
            return undefined;
        }

        try {
            const screenshotPath = await captureScreenshotArtifact(ctx, {
                label: reason,
            });
            return screenshotPath ? { screenshotPath } : undefined;
        } catch (error) {
            return {
                screenshotError:
                    error instanceof Error
                        ? error.message
                        : "Unknown screenshot error",
            };
        }
    }
}
