import type {
    RuntimeAction,
    ActionExecutionResult,
    ClickRelativePointAction,
} from "../actions/action-types";
import type { ExecutionContext } from "../scenario/scenario-types";
import { captureScreenshotArtifact } from "../../diagnostics/artifact/screenshot-helper";
import { createRelativeClickOverlayArtifacts } from "../actions/click-relative-point";
import {
    emitActionDiagnostic,
    buildRelativeClickOverlay,
} from "../../diagnostics/diagnostic-helpers";
import type {
    DiagnosticAttachment,
    DiagnosticOverlayMeta,
} from "../../diagnostics/diagnostic-types";

export interface ActionExecutor {
    execute(
        ctx: ExecutionContext,
        action: RuntimeAction,
    ): Promise<ActionExecutionResult>;
}

function isValidRatio(value: number): boolean {
    return Number.isFinite(value) && value >= 0 && value <= 1;
}

function extractTargetId(action: RuntimeAction): string | undefined {
    switch (action.kind) {
        case "CLICK":
        case "CLICK_AND_ADOPT_NEW_PAGE":
        case "TYPE":
        case "FOCUS":
        case "ASSERT_TARGET":
        case "CLICK_RELATIVE_POINT":
            return action.target.id;

        case "WAIT":
        case "PRESS_KEY":
        case "COMPOSITE":
        case "NOOP":
            return undefined;

        default: {
            const exhaustiveCheck: never = action;
            return exhaustiveCheck;
        }
    }
}

export class AdapterBackedActionExecutor implements ActionExecutor {
    async execute(
        ctx: ExecutionContext,
        action: RuntimeAction,
    ): Promise<ActionExecutionResult> {
        let result: ActionExecutionResult;

        try {
            switch (action.kind) {
                case "NOOP":
                    result = { ok: true, message: "No operation" };
                    break;

                case "WAIT":
                    await ctx.adapter.wait(action.durationMs, ctx.signal);
                    result = {
                        ok: true,
                        message: `Waited ${action.durationMs}ms`,
                    };
                    break;

                case "CLICK":
                    await ctx.adapter.click(action.target, ctx.signal);
                    result = {
                        ok: true,
                        message: `Clicked ${action.target.id}`,
                    };
                    break;

                case "CLICK_AND_ADOPT_NEW_PAGE":
                    if (!ctx.adapter.clickAndAdoptNewPage) {
                        throw new Error(
                            "Adapter does not support clickAndAdoptNewPage",
                        );
                    }

                    await ctx.adapter.clickAndAdoptNewPage(
                        action.target,
                        ctx.signal,
                    );
                    result = {
                        ok: true,
                        message: `Clicked ${action.target.id} and adopted new page`,
                    };
                    break;

                case "TYPE":
                    await ctx.adapter.type(
                        action.target,
                        action.value,
                        { clearBeforeType: action.clearBeforeType },
                        ctx.signal,
                    );
                    result = {
                        ok: true,
                        message: `Typed into ${action.target.id}`,
                    };
                    break;

                case "FOCUS":
                    await ctx.adapter.focus(action.target, ctx.signal);
                    result = {
                        ok: true,
                        message: `Focused ${action.target.id}`,
                    };
                    break;

                case "PRESS_KEY":
                    await ctx.adapter.pressKey(action.key, ctx.signal);
                    result = { ok: true, message: `Pressed key ${action.key}` };
                    break;

                case "ASSERT_TARGET": {
                    const target = await ctx.adapter.queryTarget(
                        action.target,
                        ctx.signal,
                    );
                    result = {
                        ok: target.found,
                        message: target.found
                            ? `Target ${action.target.id} found`
                            : `Target ${action.target.id} not found`,
                        evidence: target.meta,
                    };
                    break;
                }

                case "COMPOSITE": {
                    const childResults: Array<Record<string, unknown>> = [];

                    for (const childAction of action.actions) {
                        const childResult = await this.execute(
                            ctx,
                            childAction,
                        );

                        childResults.push({
                            actionId: childAction.id,
                            actionKind: childAction.kind,
                            ok: childResult.ok,
                            message: childResult.message,
                            evidence: childResult.evidence,
                        });

                        if (!childResult.ok) {
                            result = {
                                ok: false,
                                message: childResult.message,
                                evidence: {
                                    compositeActionId: action.id,
                                    childResults,
                                },
                            };
                            break;
                        }
                    }

                    if (!result!) {
                        result = {
                            ok: true,
                            message: `Composite action ${action.id} completed`,
                            evidence: {
                                compositeActionId: action.id,
                                childResults,
                            },
                        };
                    }
                    break;
                }

                case "CLICK_RELATIVE_POINT":
                    result = await this.executeClickRelativePoint(ctx, action);
                    break;

                default: {
                    const exhaustiveCheck: never = action;
                    throw new Error(
                        `Unhandled action kind: ${JSON.stringify(exhaustiveCheck)}`,
                    );
                }
            }
        } catch (error) {
            result = {
                ok: false,
                message: error instanceof Error ? error.message : String(error),
            };
        }

        // ── Generic Diagnostic Emission ───────────────────────────────────────
        // Emits a record for every action except NOOP.
        // Handlers (like ClickRelativePoint) enrich the result with overlays/attachments.
        if (ctx.diagnostics && action.kind !== "NOOP") {
            emitActionDiagnostic({
                collector: ctx.diagnostics,
                scenarioId: ctx.scenario.id,
                iteration: ctx.iteration,
                actionId: action.id,
                actionKind: action.kind,
                ok: result.ok,
                message: result.message,
                targetId: extractTargetId(action),
                evidence: result.evidence,
                attachments: result.attachments,
                overlays: result.overlays,
            });
        }

        return result;
    }

    private async executeClickRelativePoint(
        ctx: ExecutionContext,
        action: ClickRelativePointAction,
    ): Promise<ActionExecutionResult> {
        if (!ctx.adapter.clickRelativePoint) {
            throw new Error("Adapter does not support clickRelativePoint");
        }

        if (!isValidRatio(action.xRatio)) {
            throw new Error(
                `INVALID_RELATIVE_RATIO: xRatio must be in [0..1], got ${action.xRatio}`,
            );
        }

        if (!isValidRatio(action.yRatio)) {
            throw new Error(
                `INVALID_RELATIVE_RATIO: yRatio must be in [0..1], got ${action.yRatio}`,
            );
        }

        const targetState = await ctx.adapter.queryTarget(
            action.target,
            ctx.signal,
        );

        // ── Early exit: target not found ────────────────────────────────────────
        if (!targetState.found) {
            return {
                ok: false,
                message: `Relative click target ${action.target.id} not found`,
                evidence: {
                    actionKind: action.kind,
                    targetId: action.target.id,
                    xRatio: action.xRatio,
                    yRatio: action.yRatio,
                },
            };
        }

        // ── Early exit: target not visible ──────────────────────────────────────
        const requireVisible = action.requireVisible ?? true;
        if (requireVisible && targetState.visible !== true) {
            return {
                ok: false,
                message: `Relative click target ${action.target.id} is not visible`,
                evidence: {
                    actionKind: action.kind,
                    targetId: action.target.id,
                    xRatio: action.xRatio,
                    yRatio: action.yRatio,
                    visible: targetState.visible ?? false,
                },
            };
        }

        // ── Capture before screenshot ────────────────────────────────────────────
        const screenshotBefore = action.screenshotBefore
            ? await captureScreenshotArtifact(ctx, {
                  label: `${action.id}_before_click_relative_point`,
              })
            : undefined;

        // ── Execute click ────────────────────────────────────────────────────────
        const clickEvidence = await ctx.adapter.clickRelativePoint(
            action.target,
            action.xRatio,
            action.yRatio,
            ctx.signal,
        );

        // ── Capture after screenshot ─────────────────────────────────────────────
        const screenshotAfter = action.screenshotAfter
            ? await captureScreenshotArtifact(ctx, {
                  label: `${action.id}_after_click_relative_point`,
              })
            : undefined;

        // ── Render annotated overlays (existing helper — kept as-is) ─────────────
        let beforeAnnotatedPath: string | undefined;
        let afterAnnotatedPath: string | undefined;

        if (screenshotBefore || screenshotAfter) {
            try {
                const overlayArtifacts =
                    await createRelativeClickOverlayArtifacts({
                        scenarioId: ctx.scenario.id,
                        iteration: ctx.iteration,
                        actionId: action.id,
                        actionKind: action.kind,
                        targetStateMeta: targetState.meta,
                        clickEvidence,
                        xRatio: action.xRatio,
                        yRatio: action.yRatio,
                        beforeRawPath: screenshotBefore,
                        afterRawPath: screenshotAfter,
                    });

                beforeAnnotatedPath = overlayArtifacts.beforeAnnotatedPath;
                afterAnnotatedPath = overlayArtifacts.afterAnnotatedPath;
            } catch (error) {
                ctx.timeline.record({
                    type: "ACTION_EXECUTION_FAILED",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state: { id: "UNKNOWN", confidence: 0 },
                    message: `Overlay render failed for ${action.id}`,
                    meta: {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        actionId: action.id,
                        actionKind: action.kind,
                    },
                });
            }
        }

        const evidence: Record<string, unknown> = {
            actionKind: action.kind,
            targetId: action.target.id,
            xRatio: action.xRatio,
            yRatio: action.yRatio,
            requireVisible,
            targetPresence: {
                found: targetState.found,
                visible: targetState.visible,
                enabled: targetState.enabled,
            },
            click: clickEvidence,
            screenshotBefore,
            screenshotAfter,
            beforeAnnotatedPath,
            afterAnnotatedPath,
        };

        // ── Build diagnostic metadata to return ──────────────────────────────────
        const attachments: DiagnosticAttachment[] = [];
        const overlays: DiagnosticOverlayMeta[] = [];

        if (screenshotBefore) {
            attachments.push({
                role: "screenshot_raw",
                path: screenshotBefore,
                description: "before click (raw)",
            });
        }
        if (beforeAnnotatedPath) {
            attachments.push({
                role: "screenshot_annotated",
                path: beforeAnnotatedPath,
                description: "before click (annotated)",
            });
        }
        if (screenshotAfter) {
            attachments.push({
                role: "screenshot_raw",
                path: screenshotAfter,
                description: "after click (raw)",
            });
        }
        if (afterAnnotatedPath) {
            attachments.push({
                role: "screenshot_annotated",
                path: afterAnnotatedPath,
                description: "after click (annotated)",
            });
        }

        // Build deferred overlay metadata
        const rect = clickEvidence?.boundingBox
            ? {
                  x: clickEvidence.boundingBox.x,
                  y: clickEvidence.boundingBox.y,
                  width: clickEvidence.boundingBox.width,
                  height: clickEvidence.boundingBox.height,
              }
            : undefined;

        const clickPoint = { x: clickEvidence.x, y: clickEvidence.y };

        const overlayBefore = buildRelativeClickOverlay({
            purpose: "before_action",
            screenshotPath: screenshotBefore,
            rect,
            clickPoint,
            note: "before click",
        });

        if (overlayBefore) {
            overlays.push(overlayBefore);
        }

        const overlayAfter = buildRelativeClickOverlay({
            purpose: "after_action",
            screenshotPath: screenshotAfter,
            rect,
            clickPoint,
            note: "after click",
        });

        if (overlayAfter) {
            overlays.push(overlayAfter);
        }

        // Arm attendance verification only after the attendance hotspot click succeeds.
        if (action.id === "click-attendance-hotspot" && ctx.setVariable) {
            ctx.setVariable("ATTENDANCE_VERIFY_ARMED", "true");
            ctx.setVariable(
                "ATTENDANCE_VERIFY_ARMED_AT_ITERATION",
                String(ctx.iteration),
            );
        }

        return {
            ok: true,
            message: `Clicked relative point (${action.xRatio}, ${action.yRatio}) on ${action.target.id}`,
            evidence,
            attachments,
            overlays,
        };
    }
}
