import path from "path";
import { renderOverlayImage } from "../../diagnostics/overlay/overlay-renderer";
import { buildDetectorMatchOverlays } from "../../diagnostics/diagnostic-overlay-builders";
import type { DiagnosticAttachment } from "../../diagnostics/diagnostic-types";
import type {
    ExecutionContext,
    StateDetectionRule,
} from "../scenario/scenario-types";
import type { RuntimeStateSnapshot } from "../state/runtime-state";
import type { StateDetectionResult } from "../../diagnostics/diagnostic-types";
import {
    emitDetectorDiagnostic,
    emitDetectorError,
} from "../../diagnostics/diagnostic-helpers";

export interface StateDetector {
    detect(ctx: ExecutionContext): Promise<RuntimeStateSnapshot>;
}

export class RuleBasedStateDetector implements StateDetector {
    constructor(private readonly rules: StateDetectionRule[]) {}

    async detect(ctx: ExecutionContext): Promise<RuntimeStateSnapshot> {
        for (const rule of this.rules) {
            try {
                const detectRaw = await rule.detect(ctx);
                const result = this.normalizeResult(detectRaw);

                // Diagnostics: structured record for collector consumers
                // if (ctx.diagnostics) {
                //     const attachments = [...(result.attachments ?? [])];

                //     if (result.screenshotPath) {
                //         attachments.push({
                //             role: "screenshot_raw",
                //             path: result.screenshotPath,
                //             description: `detector screenshot for rule ${rule.id}`,
                //         });
                //     }

                //     emitDetectorDiagnostic({
                //         collector: ctx.diagnostics,
                //         scenarioId: ctx.scenario.id,
                //         iteration: ctx.iteration,
                //         detectorRuleId: rule.id,
                //         targetState: rule.state,
                //         matched: result.matched,
                //         message: result.message,
                //         score: result.confidence ?? rule.confidence,
                //         matchBox: result.matchBox,
                //         meta: result.meta,
                //         attachments,
                //         overlays: result.overlays,
                //     });
                // }
                if (ctx.diagnostics) {
                    const overlays =
                        result.overlays && result.overlays.length > 0
                            ? result.overlays
                            : buildDetectorMatchOverlays({
                                  screenshotPath: result.screenshotPath,
                                  matchBox: result.matchBox,
                                  score: result.confidence ?? rule.confidence,
                                  label: rule.id,
                              });

                    const attachments: DiagnosticAttachment[] = [
                        ...(result.attachments ?? []),
                    ];

                    if (result.screenshotPath) {
                        attachments.push({
                            role: "screenshot_raw",
                            path: result.screenshotPath,
                            description: `detector screenshot for rule ${rule.id}`,
                        });
                    }

                    const annotatedAttachments =
                        await this.renderDetectorAnnotatedArtifacts({
                            screenshotPath: result.screenshotPath,
                            overlays,
                            scenarioId: ctx.scenario.id,
                            iteration: ctx.iteration,
                            detectorRuleId: rule.id,
                            targetState: rule.state,
                        });

                    attachments.push(...annotatedAttachments);

                    emitDetectorDiagnostic({
                        collector: ctx.diagnostics,
                        scenarioId: ctx.scenario.id,
                        iteration: ctx.iteration,
                        detectorRuleId: rule.id,
                        targetState: rule.state,
                        matched: result.matched,
                        message: result.message,
                        score: result.confidence ?? rule.confidence,
                        matchBox: result.matchBox,
                        meta: result.meta,
                        attachments,
                        overlays,
                    });
                }
                if (result.matched) {
                    return {
                        id: rule.state,
                        confidence: result.confidence ?? rule.confidence ?? 1.0,
                        meta: {
                            detectionRuleId: rule.id,
                            ...(rule.meta ?? {}),
                            ...(result.meta ?? {}),
                            matchBox: result.matchBox,
                        },
                    };
                }
            } catch (error) {
                // Timeline: engine-flow level error (kept for existing consumers)
                ctx.timeline.record({
                    type: "STATE_RULE_ERROR",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state: { id: "UNKNOWN", confidence: 0 },
                    message:
                        error instanceof Error ? error.message : String(error),
                    meta: {
                        detectionRuleId: rule.id,
                        targetState: rule.state,
                    },
                });

                // Diagnostics: structured record for collector consumers
                if (ctx.diagnostics) {
                    emitDetectorError({
                        collector: ctx.diagnostics,
                        scenarioId: ctx.scenario.id,
                        iteration: ctx.iteration,
                        detectorRuleId: rule.id,
                        targetState: rule.state,
                        error,
                    });
                }
            }
        }

        return {
            id: "UNKNOWN",
            confidence: 0,
        };
    }

    private normalizeResult(
        raw: boolean | StateDetectionResult,
    ): StateDetectionResult {
        if (typeof raw === "boolean") {
            return { matched: raw };
        }
        return raw;
    }

    // private async renderDetectorAnnotatedArtifacts(params: {
    //     screenshotPath?: string;
    //     overlays: Array<{
    //         purpose: string;
    //         screenshotPath?: string;
    //         shapes: any[];
    //         renderNote?: string;
    //     }>;
    //     scenarioId: string;
    //     iteration: number;
    //     detectorRuleId: string;
    //     targetState: string;
    // }): Promise<DiagnosticAttachment[]> {
    //     const attachments: DiagnosticAttachment[] = [];

    //     if (!params.screenshotPath) {
    //         return attachments;
    //     }

    //     for (const overlay of params.overlays) {
    //         if (!overlay.screenshotPath || overlay.shapes.length === 0) {
    //             continue;
    //         }

    //         const ext = path.extname(overlay.screenshotPath);
    //         const base = path.basename(overlay.screenshotPath, ext);
    //         const dir = path.dirname(overlay.screenshotPath);
    //         const outputPath = path.join(
    //             dir,
    //             `${base}_${overlay.purpose}_annotated${ext}`,
    //         );

    //         await renderOverlayImage({
    //             screenshotPath: overlay.screenshotPath,
    //             outputPath,
    //             payload: {
    //                 meta: {
    //                     scenarioId: params.scenarioId,
    //                     iteration: params.iteration,
    //                     detector: params.detectorRuleId,
    //                     state: params.targetState,
    //                     note: overlay.renderNote ?? overlay.purpose,
    //                 },
    //                 shapes: overlay.shapes,
    //             },
    //         });

    //         attachments.push({
    //             role: "screenshot_annotated",
    //             path: outputPath,
    //             description: `detector annotated (${overlay.purpose}) for ${params.detectorRuleId}`,
    //         });
    //     }

    //     return attachments;
    // }
    private async renderDetectorAnnotatedArtifacts(params: {
        screenshotPath?: string;
        overlays: Array<{
            purpose: string;
            screenshotPath?: string;
            shapes: any[];
            renderNote?: string;
        }>;
        scenarioId: string;
        iteration: number;
        detectorRuleId: string;
        targetState: string;
    }): Promise<DiagnosticAttachment[]> {
        const attachments: DiagnosticAttachment[] = [];

        if (!params.screenshotPath) {
            return attachments;
        }

        for (let index = 0; index < params.overlays.length; index++) {
            const overlay = params.overlays[index];

            if (!overlay.screenshotPath || overlay.shapes.length === 0) {
                continue;
            }

            const ext = path.extname(overlay.screenshotPath);
            const base = path.basename(overlay.screenshotPath, ext);
            const dir = path.dirname(overlay.screenshotPath);
            const outputPath = path.join(
                dir,
                `${base}_${overlay.purpose}_${index}_annotated${ext}`,
            );

            await renderOverlayImage({
                screenshotPath: overlay.screenshotPath,
                outputPath,
                payload: {
                    meta: {
                        scenarioId: params.scenarioId,
                        iteration: params.iteration,
                        detector: params.detectorRuleId,
                        state: params.targetState,
                        note:
                            overlay.renderNote ?? `${overlay.purpose}#${index}`,
                    },
                    shapes: overlay.shapes,
                },
            });

            attachments.push({
                role: "screenshot_annotated",
                path: outputPath,
                description: `detector annotated (${overlay.purpose}#${index}) for ${params.detectorRuleId}`,
            });
        }

        return attachments;
    }
}
