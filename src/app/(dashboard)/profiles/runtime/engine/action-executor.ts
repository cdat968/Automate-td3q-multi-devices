import path from "path";
import type {
    RuntimeAction,
    ActionExecutionResult,
    ClickRelativePointAction,
    ClickFromDetectionAction,
    MoveRelativePointAction,
} from "../actions/action-types";
import type { ExecutionContext } from "../scenario/scenario-types";
import { captureScreenshotArtifact } from "../../diagnostics/artifact/screenshot-helper";
import {
    createClickOverlayArtifacts,
    createRelativeClickOverlayArtifacts,
} from "../actions/click-relative-point";
import {
    emitActionDiagnostic,
    buildRelativeClickOverlay,
} from "../../diagnostics/diagnostic-helpers";
import type {
    DiagnosticAttachment,
    DiagnosticOverlayMeta,
} from "../../diagnostics/diagnostic-types";
import { renderOverlayImage } from "../../diagnostics/overlay/overlay-renderer";

export interface ActionExecutor {
    execute(
        ctx: ExecutionContext,
        action: RuntimeAction,
    ): Promise<ActionExecutionResult>;
}

function isValidRatio(value: number): boolean {
    return Number.isFinite(value) && value >= 0 && value <= 1;
}

function getBoxCenter(box: {
    x: number;
    y: number;
    width: number;
    height: number;
}): { x: number; y: number } {
    return {
        x: Math.round(box.x + box.width / 2),
        y: Math.round(box.y + box.height / 2),
    };
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
        case "CLICK_FROM_DETECTION":
            return action.label ?? action.id;
        case "WAIT":
        case "PRESS_KEY":
        case "COMPOSITE":
        case "MOVE_RELATIVE_POINT":
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
                case "CLICK_FROM_DETECTION":
                    result = await this.executeClickFromDetection(ctx, action);
                    break;
                case "MOVE_RELATIVE_POINT":
                    result = await this.executeMoveRelativePoint(ctx, action);
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

    private async executeMoveRelativePoint(
        ctx: ExecutionContext,
        action: MoveRelativePointAction,
    ): Promise<ActionExecutionResult> {
        if (!ctx.adapter.movePointer) {
            throw new Error("Adapter does not support movePointer");
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

        const moveEvidence = await ctx.adapter.movePointer(
            action.xRatio,
            action.yRatio,
            ctx.signal,
        );

        const evidence: Record<string, unknown> = {
            actionKind: action.kind,
            xRatio: action.xRatio,
            yRatio: action.yRatio,
            move: moveEvidence,
        };

        return {
            ok: true,
            message: `Moved pointer to relative point (${action.xRatio}, ${action.yRatio})`,
            evidence,
        };
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

        return {
            ok: true,
            message: `Clicked relative point (${action.xRatio}, ${action.yRatio}) on ${action.target.id}`,
            evidence,
            attachments,
            overlays,
        };
    }

    private async renderDetectionOverlayArtifacts(params: {
        overlays?: DiagnosticOverlayMeta[];
        scenarioId: string;
        iteration: number;
        detectorLabel: string;
    }): Promise<DiagnosticAttachment[]> {
        const attachments: DiagnosticAttachment[] = [];

        if (!params.overlays || params.overlays.length === 0) {
            return attachments;
        }

        for (const overlay of params.overlays) {
            if (!overlay.screenshotPath || overlay.shapes.length === 0) {
                continue;
            }

            const ext = path.extname(overlay.screenshotPath);
            const base = path.basename(overlay.screenshotPath, ext);
            const dir = path.dirname(overlay.screenshotPath);

            const outputPath = path.join(
                dir,
                `${base}_${overlay.purpose}_annotated${ext}`,
            );

            await renderOverlayImage({
                screenshotPath: overlay.screenshotPath,
                outputPath,
                payload: {
                    meta: {
                        scenarioId: params.scenarioId,
                        iteration: params.iteration,
                        detector: params.detectorLabel,
                        note: overlay.renderNote ?? overlay.purpose,
                    },
                    shapes: overlay.shapes,
                },
            });

            attachments.push({
                role: "screenshot_annotated",
                path: outputPath,
                description: `detector annotated (${overlay.purpose}) for ${params.detectorLabel}`,
            });
        }

        return attachments;
    }

    private async executeClickFromDetection(
        ctx: ExecutionContext,
        action: ClickFromDetectionAction,
    ): Promise<ActionExecutionResult> {
        if (!ctx.adapter.clickPoint) {
            throw new Error("Adapter does not support clickPoint");
        }

        const detection = await action.detectTarget(ctx);

        if (!detection.matched || !detection.matchBox) {
            if (action.id === "click-attendance-hotspot" && ctx.setVariable) {
                const currentRetry = Number.parseInt(
                    ctx.variables.ATTENDANCE_RETRY_COUNT ?? "0",
                    10,
                );
                const nextRetry = Number.isFinite(currentRetry)
                    ? currentRetry + 1
                    : 1;

                ctx.setVariable("ATTENDANCE_RETRY_COUNT", String(nextRetry));
                ctx.setVariable(
                    "ATTENDANCE_LAST_FAILURE_KIND",
                    "attendance_icon_not_found",
                );
                ctx.setVariable(
                    "ATTENDANCE_LAST_FAILURE_MESSAGE",
                    detection.message ?? "attendance_icon_not_found",
                );
                ctx.setVariable(
                    "ATTENDANCE_LAST_FAILURE_AT_ITERATION",
                    String(ctx.iteration),
                );

                // prevent stale verify state from previous attempts
                ctx.setVariable("ATTENDANCE_VERIFY_ARMED", "false");
                ctx.setVariable("ATTENDANCE_VERIFY_ARMED_AT_ITERATION", "");
                ctx.setVariable("ATTENDANCE_VERIFY_DEADLINE_ITERATION", "");
            }

            return {
                ok: false,
                message:
                    detection.message ??
                    `Detection target not found for action ${action.id}`,
                evidence: {
                    actionKind: action.kind,
                    detectionMatched: detection.matched,
                    detectionMeta: detection.meta,
                    correlation: {
                        sourceDetectorId: detection.meta?.detectorId,
                        sourceDetectorRunId: detection.meta?.detectorRunId,
                        retryAttempt: detection.meta?.retryAttempt,
                        clickIteration: ctx.iteration,
                    },
                },
                attachments: detection.attachments,
                overlays: detection.overlays,
            };
        }

        const clickPoint = getBoxCenter(detection.matchBox);

        const screenshotBefore = action.screenshotBefore
            ? await captureScreenshotArtifact(ctx, {
                  label: `${action.id}_before_click_from_detection`,
              })
            : undefined;

        await ctx.adapter.clickPoint(clickPoint.x, clickPoint.y, ctx.signal);

        // Arm attendance verification only after the attendance hotspot click succeeds.
        if (action.id === "click-attendance-hotspot" && ctx.setVariable) {
            const verifyWindowIterations = Number.parseInt(
                ctx.variables.ATTENDANCE_VERIFY_WINDOW_ITERATIONS ?? "2",
                10,
            );
            const safeVerifyWindow = Number.isFinite(verifyWindowIterations)
                ? verifyWindowIterations
                : 2;

            ctx.setVariable("ATTENDANCE_VERIFY_ARMED", "true");
            ctx.setVariable(
                "ATTENDANCE_VERIFY_ARMED_AT_ITERATION",
                String(ctx.iteration),
            );
            ctx.setVariable(
                "ATTENDANCE_VERIFY_DEADLINE_ITERATION",
                String(ctx.iteration + safeVerifyWindow),
            );

            ctx.setVariable(
                "ATTENDANCE_LAST_CLICK_AT_ITERATION",
                String(ctx.iteration),
            );

            if (typeof detection.meta?.detectorRunId === "string") {
                ctx.setVariable(
                    "ATTENDANCE_LAST_CLICK_SOURCE_DETECTOR_RUN_ID",
                    detection.meta.detectorRunId,
                );
            }

            if (
                detection.meta?.retryAttempt !== undefined &&
                detection.meta?.retryAttempt !== null
            ) {
                ctx.setVariable(
                    "ATTENDANCE_LAST_CLICK_RETRY_ATTEMPT",
                    String(detection.meta.retryAttempt),
                );
            }

            // clear stale failure after a successful click
            ctx.setVariable("ATTENDANCE_LAST_FAILURE_KIND", "");
            ctx.setVariable("ATTENDANCE_LAST_FAILURE_MESSAGE", "");
            ctx.setVariable("ATTENDANCE_LAST_FAILURE_AT_ITERATION", "");
        }

        const screenshotAfter = action.screenshotAfter
            ? await captureScreenshotArtifact(ctx, {
                  label: `${action.id}_after_click_from_detection`,
              })
            : undefined;

        // ── Render annotated overlays for CLICK_FROM_DETECTION ────────────────
        let beforeAnnotatedPath: string | undefined;
        let afterAnnotatedPath: string | undefined;

        try {
            const overlayArtifacts = await createClickOverlayArtifacts({
                scenarioId: ctx.scenario.id,
                iteration: ctx.iteration,
                actionId: action.id,
                actionKind: action.kind,
                rect: detection.matchBox
                    ? {
                          x: detection.matchBox.x,
                          y: detection.matchBox.y,
                          width: detection.matchBox.width,
                          height: detection.matchBox.height,
                      }
                    : undefined,
                clickPoint,
                beforeRawPath: screenshotBefore,
                afterRawPath: screenshotAfter,
                beforeNote: "before click from detection",
                afterNote: "after click from detection",
                targetLabel: "detected-target",
                clickLabel: "click-center",
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
                        error instanceof Error ? error.message : String(error),
                    actionId: action.id,
                    actionKind: action.kind,
                },
            });
        }

        const attachments: DiagnosticAttachment[] = [
            ...(detection.attachments ?? []),
        ];
        const overlays: DiagnosticOverlayMeta[] = [
            ...(detection.overlays ?? []),
        ];

        const detectorLabel =
            typeof detection.meta?.detectorId === "string"
                ? detection.meta.detectorId
                : (action.label ?? action.id);

        const detectorOverlayAttachments =
            await this.renderDetectionOverlayArtifacts({
                overlays: detection.overlays,
                scenarioId: ctx.scenario.id,
                iteration: ctx.iteration,
                detectorLabel,
            });

        attachments.push(...detectorOverlayAttachments);

        if (screenshotBefore) {
            attachments.push({
                role: "screenshot_raw",
                path: screenshotBefore,
                description: "before click-from-detection (raw)",
            });
        }

        if (screenshotAfter) {
            attachments.push({
                role: "screenshot_raw",
                path: screenshotAfter,
                description: "after click-from-detection (raw)",
            });
        }

        if (beforeAnnotatedPath) {
            attachments.push({
                role: "screenshot_annotated",
                path: beforeAnnotatedPath,
                description: "before click-from-detection (annotated)",
            });
        }

        if (afterAnnotatedPath) {
            attachments.push({
                role: "screenshot_annotated",
                path: afterAnnotatedPath,
                description: "after click-from-detection (annotated)",
            });
        }

        if (screenshotBefore) {
            overlays.push({
                purpose: "before_action",
                screenshotPath: screenshotBefore,
                shapes: [
                    {
                        type: "box",
                        x: detection.matchBox.x,
                        y: detection.matchBox.y,
                        width: detection.matchBox.width,
                        height: detection.matchBox.height,
                        color: "yellow",
                        label: "detected-target",
                        lineWidth: 3,
                    },
                    {
                        type: "point",
                        x: clickPoint.x,
                        y: clickPoint.y,
                        color: "red",
                        label: "click-center",
                        radius: 6,
                    },
                ],
                renderNote: "before click from detection",
            });
        }

        if (screenshotAfter) {
            overlays.push({
                purpose: "after_action",
                screenshotPath: screenshotAfter,
                shapes: [
                    {
                        type: "box",
                        x: detection.matchBox.x,
                        y: detection.matchBox.y,
                        width: detection.matchBox.width,
                        height: detection.matchBox.height,
                        color: "yellow",
                        label: "detected-target",
                        lineWidth: 3,
                    },
                    {
                        type: "point",
                        x: clickPoint.x,
                        y: clickPoint.y,
                        color: "red",
                        label: "click-center",
                        radius: 6,
                    },
                ],
                renderNote: "after click from detection",
            });
        }

        return {
            ok: true,
            message: `Clicked detection target center at (${clickPoint.x}, ${clickPoint.y})`,
            evidence: {
                actionKind: action.kind,
                detectionMatched: detection.matched,
                confidence: detection.confidence,
                matchBox: detection.matchBox,
                clickPoint,
                detectionMeta: detection.meta,
                correlation: {
                    sourceDetectorId: detection.meta?.detectorId,
                    sourceDetectorRunId: detection.meta?.detectorRunId,
                    retryAttempt: detection.meta?.retryAttempt,
                    clickIteration: ctx.iteration,
                },
                screenshotBefore,
                screenshotAfter,
            },
            attachments,
            overlays,
        };
    }
}
