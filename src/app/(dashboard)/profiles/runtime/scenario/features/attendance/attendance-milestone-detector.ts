import type { ExecutionContext } from "../../scenario-types";
import type { DiagnosticOverlayMeta } from "../../../../diagnostics/diagnostic-types";
import { AttendanceConfig } from "./attendance-config";
import {
    MILESTONE_SLOT_ROIS,
    milestoneDetectors,
    type MilestoneDetectorResult,
} from "./attendance-detectors";
import { decodePng } from "./attendance-vision";

function getOverlayShapeLabel(shape: DiagnosticOverlayMeta["shapes"][number]) {
    if ("label" in shape) {
        return shape.label;
    }

    if (shape.type === "text") {
        return shape.text;
    }

    return undefined;
}

export const attendanceMilestoneClaimableDetector = {
    async detect(ctx: ExecutionContext) {
        const results: Array<{
            index: number;
            result: MilestoneDetectorResult;
        }> = [];

        const DAYS = AttendanceConfig.milestone.days;

        for (let i = 0; i < milestoneDetectors.length; i++) {
            const detector = milestoneDetectors[i];
            const res = await detector.detect(ctx);

            console.log("[MILESTONE][SLOT_CHECK]", {
                slotIndex: i,
                day: DAYS[i],
                matched: res?.matched ?? false,
                confidence:
                    typeof res?.confidence === "number"
                        ? Number(res.confidence.toFixed(3))
                        : null,
                message: res?.message ?? null,
                matchBox: res?.matchBox ?? null,
                meta: res?.meta ?? null,
            });

            results.push({
                index: i,
                result: res,
            });
        }

        const matchedSlots = results
            .filter((r) => r.result?.matched)
            .map((r) => ({
                slotIndex: r.index,
                confidence:
                    typeof r.result?.confidence === "number"
                        ? Number(r.result.confidence.toFixed(3))
                        : null,
                message: r.result?.message ?? null,
                matchBox: r.result?.matchBox ?? null,
            }));

        console.log("[MILESTONE][SCAN_SUMMARY]", {
            anyMatch: matchedSlots.length > 0,
            matchedSlots,
        });

        const matched = results.find((r) => r.result && r.result.matched);

        let debugOverlay: DiagnosticOverlayMeta | undefined = undefined;

        const overlayScreenshotPath = results.find(
            (r) => r.result?.screenshotPath,
        )?.result?.screenshotPath;

        const overlayAttachments = results.flatMap(
            (r) => r.result?.attachments ?? [],
        );

        if (ctx.adapter.screenshot && overlayScreenshotPath) {
            try {
                const raw = await ctx.adapter.screenshot(ctx.signal);
                const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
                const { width, height } = decodePng(buffer);

                const shapes: DiagnosticOverlayMeta["shapes"] = [];

                const milestoneBarRoi = AttendanceConfig.milestone.barRoi;

                const barX = Math.round(milestoneBarRoi.xRatio * width);
                const barY = Math.round(milestoneBarRoi.yRatio * height);
                const barW = Math.round(milestoneBarRoi.widthRatio * width);
                const barH = Math.round(milestoneBarRoi.heightRatio * height);

                shapes.push({
                    type: "box",
                    x: barX,
                    y: barY,
                    width: barW,
                    height: barH,
                    color: "blue",
                    label: "milestone-bar-roi",
                    lineWidth: 3,
                });

                for (let i = 0; i < MILESTONE_SLOT_ROIS.length; i++) {
                    const roi = MILESTONE_SLOT_ROIS[i];
                    const slotResult = results[i]?.result;

                    const x = Math.round(roi.xRatio * width);
                    const y = Math.round(roi.yRatio * height);
                    const w = Math.round(roi.widthRatio * width);
                    const h = Math.round(roi.heightRatio * height);

                    shapes.push({
                        type: "box",
                        x,
                        y,
                        width: w,
                        height: h,
                        color: slotResult?.matched ? "green" : "red",
                        label: `slot #${i} (${DAYS[i]})`,
                        lineWidth: slotResult?.matched ? 4 : 2,
                    });

                    if (slotResult?.matchBox) {
                        shapes.push({
                            type: "box",
                            x: slotResult.matchBox.x,
                            y: slotResult.matchBox.y,
                            width: slotResult.matchBox.width,
                            height: slotResult.matchBox.height,
                            color: "yellow",
                            label: `match #${i}`,
                            lineWidth: 3,
                        });
                    }
                }

                if (matched?.result?.matchBox) {
                    const mb = matched.result.matchBox;
                    const clickX = Math.round(mb.x + mb.width / 2);
                    const clickY = Math.round(mb.y + mb.height / 2);

                    shapes.push({
                        type: "point",
                        x: clickX,
                        y: clickY,
                        color: "red",
                        label: "click-point",
                    });
                }

                debugOverlay = {
                    purpose: "debug_view",
                    screenshotPath: overlayScreenshotPath,
                    shapes,
                    renderNote: matched
                        ? `milestone-wrapper: selected slot ${matched.index}`
                        : "milestone-wrapper: no slot matched",
                };
            } catch (error) {
                console.warn("[MILESTONE][OVERLAY_BUILD_FAILED]", error);
            }
        }

        if (!matched) {
            console.log("[MILESTONE][NO_MATCH] full scan zero match");

            console.log("[MILESTONE][RETURN_OVERLAYS]", {
                matched: false,
                hasScreenshotPath: !!overlayScreenshotPath,
                attachmentsCount: overlayAttachments.length,
                overlaysCount: debugOverlay ? 1 : 0,
                shapeCount: debugOverlay?.shapes?.length ?? 0,
                labels:
                    debugOverlay?.shapes
                        ?.map(getOverlayShapeLabel)
                        .filter((label): label is string => Boolean(label)) ??
                    [],
            });

            return {
                matched: false,
                message: "NO MILESTONE READY",
                confidence: 0,
                attachments: overlayAttachments,
                overlays: debugOverlay ? [debugOverlay] : [],
                meta: {
                    detectorId: "attendance-milestone-claimable-wrapper",
                    matchedSlots,
                    checkedSlots: results.length,
                },
            };
        }

        const selected = matched.result;

        console.log("[MILESTONE][SELECTED]", {
            slotIndex: matched.index,
            day: DAYS[matched.index],
            confidence:
                typeof selected.confidence === "number"
                    ? Number(selected.confidence.toFixed(3))
                    : null,
            matchBox: selected.matchBox ?? null,
            message: selected.message ?? null,
        });

        return {
            matched: true,
            confidence: selected.confidence,
            screenshotPath: selected.screenshotPath,
            attachments: [
                ...(selected.attachments ?? []),
                ...overlayAttachments,
            ],
            overlays: [
                ...(selected.overlays ?? []),
                ...(debugOverlay ? [debugOverlay] : []),
            ],
            message: `MILESTONE READY: slot ${matched.index} day ${DAYS[matched.index]}`,
            meta: {
                detectorId: "attendance-milestone-claimable-wrapper",
                selectedSlot: matched.index,
                selectedDay: DAYS[matched.index],
                matchedSlots,
                selectedMeta: selected.meta ?? null,
            },
            matchBox: selected.matchBox,
        };
    },
};
