import {
    cropRoiFromScreenshot,
    matchTemplateMultiScale,
} from "./template-matcher";
import { captureScreenshotArtifact } from "../../diagnostics/artifact/screenshot-helper";
import { buildDetectorMatchOverlays } from "../../diagnostics/diagnostic-overlay-builders";
import { StateDetectionResult } from "../../diagnostics/diagnostic-types";
import { writeBufferArtifact } from "../../diagnostics/artifact/artifact-writer";
import { buildArtifactPath } from "../../diagnostics/artifact/artifact-path";
import type { DiagnosticAttachment } from "../../diagnostics/diagnostic-types";
import type { ExecutionContext } from "../scenario/scenario-types";

export interface TemplateMatchDetectorConfig {
    detectorId: string;
    template: Buffer;

    screenshotLabel?: string;
    overlayLabel?: string;

    threshold?: number;
    scales?: readonly number[];

    roi?: {
        xRatio: number;
        yRatio: number;
        widthRatio: number;
        heightRatio: number;
    };

    shouldRun?: (ctx: ExecutionContext) => boolean | Promise<boolean>;

    skipReason?: string | ((ctx: ExecutionContext) => string | Promise<string>);

    buildMessage?: (args: { matched: boolean; score: number }) => string;

    buildMeta?: (args: {
        matched: boolean;
        score: number;
        ctx: ExecutionContext;
    }) => Record<string, unknown>;
}

async function resolveSkipReason(
    ctx: ExecutionContext,
    skipReason?: TemplateMatchDetectorConfig["skipReason"],
): Promise<string> {
    if (!skipReason) {
        return "detector_skipped_by_context_gate";
    }

    return typeof skipReason === "function"
        ? await skipReason(ctx)
        : skipReason;
}

type DetectorScoreBand = "high" | "near_threshold" | "low";

function resolveScoreBand(score: number, threshold: number): DetectorScoreBand {
    if (score >= threshold + 0.08) {
        return "high";
    }

    if (score >= threshold - 0.03) {
        return "near_threshold";
    }

    return "low";
}

function buildDetectorRunId(detectorId: string, ctx: ExecutionContext): string {
    return `${detectorId}_iter${ctx.iteration}_${Date.now().toString(36)}`;
}

export function createTemplateMatchDetector(
    config: TemplateMatchDetectorConfig,
) {
    async function detect(
        ctx: ExecutionContext,
    ): Promise<StateDetectionResult> {
        if (config.shouldRun) {
            const allowed = await config.shouldRun(ctx);

            if (!allowed) {
                return {
                    matched: false,
                    message: await resolveSkipReason(ctx, config.skipReason),
                    meta: {
                        skipped: true,
                        detectorId: config.detectorId,
                    },
                };
            }
        }

        const detectorRunId = buildDetectorRunId(config.detectorId, ctx);

        if (!ctx.adapter.screenshot) {
            return {
                matched: false,
                message: "screenshot_not_supported",
                meta: {
                    skipped: false,
                    detectorId: config.detectorId,
                },
            };
        }

        const raw = await ctx.adapter.screenshot(ctx.signal);
        const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);

        const thresholdUsed = config.threshold ?? 0.83;

        const result = matchTemplateMultiScale(buffer, config.template, {
            roi: config.roi,
            threshold: config.threshold,
            scales: config.scales ? [...config.scales] : undefined,
        });

        const scoreBand = resolveScoreBand(result.score, thresholdUsed);
        const distanceToThreshold = Number(
            (result.score - thresholdUsed).toFixed(4),
        );

        const screenshotPath = await captureScreenshotArtifact(ctx, {
            label: config.screenshotLabel ?? config.detectorId,
        });

        const attachments: DiagnosticAttachment[] = [];

        if (screenshotPath) {
            attachments.push({
                role: "screenshot_raw",
                path: screenshotPath,
                description: `detector screenshot for ${config.detectorId}`,
            });
        }

        let roiArtifactPath: string | undefined;

        if (config.roi) {
            const roiBuffer = cropRoiFromScreenshot(buffer, config.roi);
            const timestamp = new Date()
                .toISOString()
                .replace(/:/g, "-")
                .replace(/\./g, "-");

            roiArtifactPath = buildArtifactPath({
                scenarioId: ctx.scenario.id,
                timestamp,
                label: `${config.screenshotLabel ?? config.detectorId}_roi`,
                iteration: ctx.iteration,
                extension: "png",
            });

            await writeBufferArtifact(roiArtifactPath, roiBuffer);

            attachments.push({
                role: "screenshot_roi",
                path: roiArtifactPath,
                description: `roi crop for ${config.detectorId}`,
            });
        }

        const matchBox = result.location
            ? {
                  x: result.location.x,
                  y: result.location.y,
                  width: result.location.width ?? 0,
                  height: result.location.height ?? 0,
              }
            : undefined;

        const overlays = buildDetectorMatchOverlays({
            screenshotPath,
            matchBox,
            score: result.score,
            label: config.overlayLabel ?? config.detectorId,
        });

        if (screenshotPath && result.roiRect) {
            overlays.push({
                purpose: "debug_view",
                screenshotPath,
                shapes: [
                    {
                        type: "box",
                        x: result.roiRect.x,
                        y: result.roiRect.y,
                        width: result.roiRect.width,
                        height: result.roiRect.height,
                        color: "blue",
                        label: "detector-roi",
                        lineWidth: 6,
                    },
                    ...(matchBox
                        ? [
                              {
                                  type: "box" as const,
                                  x: matchBox.x,
                                  y: matchBox.y,
                                  width: matchBox.width,
                                  height: matchBox.height,
                                  color: "green" as const,
                                  label:
                                      config.overlayLabel ?? config.detectorId,
                                  lineWidth: 5,
                              },
                          ]
                        : []),
                ],
                renderNote: "roi + match view",
            });
        }

        return {
            matched: result.matched,
            confidence: result.score,
            matchBox,
            screenshotPath,
            attachments,
            overlays,
            message:
                config.buildMessage?.({
                    matched: result.matched,
                    score: result.score,
                }) ??
                `${config.detectorId} => ${
                    result.matched ? "MATCH" : "MISS"
                } (${result.score.toFixed(3)})`,
            meta: {
                detectorId: config.detectorId,
                detectorRunId,
                rawScore: result.score,
                thresholdUsed,
                scoreBand,
                distanceToThreshold,
                ...(config.buildMeta?.({
                    matched: result.matched,
                    score: result.score,
                    ctx,
                }) ?? {}),
            },
        };
    }

    return {
        detect,
    };
}
