import type { ExecutionContext, ScenarioDefinition } from "../scenario-types";
import type { RuntimeTargetRef } from "../../actions/action-types";
import { templates } from "../../vision/templates";
import { createTemplateMatchDetector } from "../../vision/create-template-match-detector";
import { cropRoiFromScreenshot } from "../../vision/template-matcher";
import { matchTemplateMultiScale } from "../../vision/template-matcher";
import { PNG } from "pngjs";
import {
    DiagnosticAttachment,
    DiagnosticOverlayMeta,
} from "../../../diagnostics/diagnostic-types";

const attendanceTomorrowReceiveTemplate = (
    templates as typeof templates & {
        attendanceTomorrowReceive?: Buffer;
    }
).attendanceTomorrowReceive;

const targets = {
    emailInput: {
        id: "login.email",
        kind: "dom",
        locator: "input[type='text'], input[name='email']",
    } satisfies RuntimeTargetRef,

    passwordInput: {
        id: "login.password",
        kind: "dom",
        locator: "input[type='password']",
    } satisfies RuntimeTargetRef,

    submitButton: {
        id: "login.submit",
        kind: "dom",
        locator: "input[type='submit']",
    } satisfies RuntimeTargetRef,

    playButton: {
        id: "dashboard.play",
        kind: "dom",
        locator: "a.dl-play",
    } satisfies RuntimeTargetRef,

    serverListItem: {
        id: "dashboard.server.listItem",
        kind: "dom",
        locator: "a[href*='server=']",
    } satisfies RuntimeTargetRef,

    server7Item: {
        id: "dashboard.server.7",
        kind: "dom",
        locator: "a[href*='server=7']",
    } satisfies RuntimeTargetRef,

    openInNewTab: {
        id: "warning.openInNewTab",
        kind: "dom",
        locator: "a:has-text('Mở trong thẻ mới')",
    } satisfies RuntimeTargetRef,

    rufflePlayer: {
        id: "game.rufflePlayer",
        kind: "dom",
        locator: "ruffle-player#player",
    } satisfies RuntimeTargetRef,

    gameHost: {
        id: "game.host",
        kind: "dom",
        locator: "ruffle-player#player",
    } satisfies RuntimeTargetRef,

    attendancePopupClose: {
        id: "attendance.popup.close",
        kind: "dom",
        locator: "", // chỉ dùng nếu về sau bạn xác nhận close button là DOM thật
    } satisfies RuntimeTargetRef,
};

const attendanceIconDetector = createTemplateMatchDetector({
    detectorId: "attendance-icon",
    template: templates.attendanceIcon,
    screenshotLabel: "detect_attendance_icon",
    overlayLabel: "attendance-icon",
    threshold: 0.75,
    scales: [0.85, 0.9, 1.0, 1.1],
    roi: {
        xRatio: 0.68,
        yRatio: 0.08,
        widthRatio: 0.22,
        heightRatio: 0.22,
    },
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE ICON => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
});

const attendancePopupVerifyDetector = createTemplateMatchDetector({
    detectorId: "attendance-popup-verify",
    template: templates.attendanceHeader,
    screenshotLabel: "detect_attendance_popup_open",
    overlayLabel: "attendance-popup-verify",
    shouldRun: (ctx) => ctx.variables.ATTENDANCE_VERIFY_ARMED === "true",
    skipReason: "attendance_verify_not_armed",
    roi: {
        xRatio: 0.44,
        yRatio: 0.12,
        widthRatio: 0.32,
        heightRatio: 0.14,
    },
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE POPUP VERIFY => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
    buildMeta: ({ ctx, matched }) => ({
        armed: true,
        armedAtIteration: ctx.variables.ATTENDANCE_VERIFY_ARMED_AT_ITERATION,
        retryAttempt: Number(ctx.variables.ATTENDANCE_RETRY_COUNT ?? "0"),
        sourceClickIteration: Number(
            ctx.variables.ATTENDANCE_LAST_CLICK_AT_ITERATION ?? "0",
        ),
        sourceDetectorRunId:
            ctx.variables.ATTENDANCE_LAST_CLICK_SOURCE_DETECTOR_RUN_ID,
        sourceRetryAttempt: Number(
            ctx.variables.ATTENDANCE_LAST_CLICK_RETRY_ATTEMPT ?? "0",
        ),
        verifyDeadlineIteration: Number(
            ctx.variables.ATTENDANCE_VERIFY_DEADLINE_ITERATION ?? "0",
        ),
        verifyMatched: matched,
    }),
});

const attendancePopupAnchorDetector = createTemplateMatchDetector({
    detectorId: "attendance-popup-anchor",
    template: templates.attendanceHeader,
    screenshotLabel: "detect_attendance_popup_anchor",
    overlayLabel: "attendance-popup-anchor",
    roi: {
        xRatio: 0.44,
        yRatio: 0.12,
        widthRatio: 0.32,
        heightRatio: 0.14,
    },
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE POPUP ANCHOR => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
});

const baseTemplateDetector = createTemplateMatchDetector({
    detectorId: "attendance-today-claimable-template",
    template: templates.attendanceTodayClaimable,
    screenshotLabel: "detect_attendance_today_claimable",
});

const attendanceTodayClaimableDetector = {
    async detect(ctx: ExecutionContext) {
        const classified = await classifyAttendanceTodayCell(ctx);

        return {
            matched: classified.state === "READY",
            confidence:
                classified.state === "READY"
                    ? Math.max(
                          Number(classified.meta.cyanRatio ?? 0),
                          Number(classified.meta.tomorrowScore ?? 0),
                      )
                    : 0,
            screenshotPath: classified.screenshotPath,
            attachments: classified.attachments,
            overlays: [
                ...(classified.overlays ?? []),
                ...buildAttendanceSemanticDebugOverlay(classified),
            ],
            message: `ATTENDANCE TODAY READY => ${
                classified.state === "READY" ? "MATCH" : "MISS"
            } (${classified.reason})`,
            meta: {
                detectorId: "attendance-today-claimable-classifier",
                classificationState: classified.state,
                classificationReason: classified.reason,
                ...classified.meta,
            },
            matchBox: classified.matchBox,
        };
    },
};

const attendanceTodayDoneDetector = {
    async detect(ctx: ExecutionContext) {
        const classified = await classifyAttendanceTodayCell(ctx);

        console.log(
            `[ATTENDANCE][TODAY_DONE] state=${classified.state} reason=${classified.reason} tickMatched=${classified.meta.tickMatched} tickScore=${classified.meta.tickScore} tomorrowScore=${classified.meta.tomorrowScore} cyanRatio=${classified.meta.cyanRatio}`,
        );

        return {
            matched: classified.state === "DONE",
            confidence:
                classified.state === "DONE"
                    ? Math.max(
                          Number(classified.meta.tickScore ?? 0),
                          Number(classified.meta.tomorrowScore ?? 0),
                      )
                    : 0,
            screenshotPath: classified.screenshotPath,
            attachments: classified.attachments,
            overlays: [
                ...(classified.overlays ?? []),
                ...buildAttendanceSemanticDebugOverlay(classified),
            ],
            message: `ATTENDANCE TODAY DONE => ${
                classified.state === "DONE" ? "MATCH" : "MISS"
            } (${classified.reason})`,
            meta: {
                detectorId: "attendance-today-done-classifier",
                classificationState: classified.state,
                classificationReason: classified.reason,
                ...classified.meta,
            },
            matchBox: classified.matchBox,
        };
    },
};

const MILESTONE_SLOT_ROIS = [
    { xRatio: 0.36, yRatio: 0.866, widthRatio: 0.048, heightRatio: 0.0946 }, // 2-day
    // { xRatio: 0.45, yRatio: 0.862, widthRatio: 0.049, heightRatio: 0.096 }, // 5-day v-1
    { xRatio: 0.45, yRatio: 0.862, widthRatio: 0.049, heightRatio: 0.0965 }, // 5-day
    { xRatio: 0.555, yRatio: 0.866, widthRatio: 0.048, heightRatio: 0.095 }, // 10-day
    { xRatio: 0.66, yRatio: 0.866, widthRatio: 0.048, heightRatio: 0.095 }, // 20-day
    { xRatio: 0.76, yRatio: 0.866, widthRatio: 0.048, heightRatio: 0.095 }, // 30-day
];

const milestoneDetectors = [
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-2",
        template: templates.attendanceMilestone2,
        roi: MILESTONE_SLOT_ROIS[0],
    }),
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-5",
        template: templates.attendanceMilestone5,
        roi: MILESTONE_SLOT_ROIS[1],
    }),
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-10",
        template: templates.attendanceMilestone10,
        roi: MILESTONE_SLOT_ROIS[2],
    }),
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-20",
        template: templates.attendanceMilestone20,
        roi: MILESTONE_SLOT_ROIS[3],
    }),
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-30",
        template: templates.attendanceMilestone30,
        roi: MILESTONE_SLOT_ROIS[4],
    }),
];

const MILESTONE_TEMPLATES = [
    templates.attendanceMilestone2,
    templates.attendanceMilestone5,
    templates.attendanceMilestone10,
    templates.attendanceMilestone20,
    templates.attendanceMilestone30,
] as const;

const attendanceMilestoneClaimableDetector = {
    async detect(ctx: ExecutionContext) {
        const results: Array<{
            index: number;
            result: any;
        }> = [];

        const DAYS = [2, 5, 10, 20, 30] as const;

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

        // --- build one full-screen debug overlay like classifyAttendanceTodayCell
        let debugOverlay: DiagnosticOverlayMeta | undefined = undefined;

        const overlayScreenshotPath = results.find(
            (r) => r.result?.screenshotPath,
        )?.result?.screenshotPath;

        const overlayAttachments = results.flatMap(
            (r) => r.result?.attachments ?? [],
        );

        if (ctx.adapter.screenshot && overlayScreenshotPath) {
            console.log(11111111);
            try {
                const raw = await ctx.adapter.screenshot(ctx.signal);
                const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
                const { width, height } = decodePng(buffer);

                const shapes: DiagnosticOverlayMeta["shapes"] = [];

                // full milestone bar roi
                const barX = Math.round(0.362 * width);
                const barY = Math.round(0.857 * height);
                const barW = Math.round(0.448 * width);
                const barH = Math.round(0.11 * height);

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

                // 5 slot roi boxes
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

                // selected click point
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

            return {
                matched: false,
                message: "NO MILESTONE READY",
                screenshotPath: overlayScreenshotPath,
                attachments: overlayAttachments,
                overlays: debugOverlay ? [debugOverlay] : undefined,
                meta: {
                    detectorId: "attendance-milestone-claimable",
                    all: results,
                },
            };
        }

        console.log("[MILESTONE][SELECT]", {
            slotIndex: matched.index,
            result: matched.result,
        });

        console.log("[MILESTONE][OVERLAY_CHECK]", {
            hasOverlay: !!debugOverlay,
            shapesCount: debugOverlay?.shapes?.length,
        });

        return {
            ...matched.result,
            screenshotPath:
                matched.result?.screenshotPath ?? overlayScreenshotPath,
            attachments: [
                ...(matched.result?.attachments ?? []),
                ...overlayAttachments.filter(
                    (a) =>
                        !(matched.result?.attachments ?? []).some(
                            (existing) =>
                                existing.path === a.path &&
                                existing.role === a.role,
                        ),
                ),
            ],
            overlays: [
                ...(matched.result?.overlays ?? []),
                ...(debugOverlay ? [debugOverlay] : []),
            ],
            meta: {
                ...matched.result.meta,
                slotIndex: matched.index,
                all: results,
            },
        };
    },
};

// const attendanceMilestoneClaimableDetector = {
//     async detect(ctx: ExecutionContext) {
//         if (!ctx.adapter.screenshot) {
//             return {
//                 matched: false,
//                 message: "screenshot_not_supported",
//                 meta: {
//                     detectorId: "attendance-milestone-claimable",
//                 },
//             };
//         }

//         const raw = await ctx.adapter.screenshot(ctx.signal);
//         const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
//         const { width, height } = decodePng(buffer);

//         const results: Array<{
//             index: number;
//             roi: {
//                 xRatio: number;
//                 yRatio: number;
//                 widthRatio: number;
//                 heightRatio: number;
//             };
//             matched: boolean;
//             score: number;
//             location?: {
//                 x: number;
//                 y: number;
//                 width: number;
//                 height: number;
//             };
//             roiRect?: {
//                 x: number;
//                 y: number;
//                 width: number;
//                 height: number;
//             };
//         }> = [];

//         for (let i = 0; i < MILESTONE_SLOT_ROIS.length; i++) {
//             const roi = MILESTONE_SLOT_ROIS[i];
//             const template = MILESTONE_TEMPLATES[i];

//             const result = matchTemplateMultiScale(buffer, template, {
//                 roi,
//                 threshold: 0.7,
//                 scales: [0.9, 1.0, 1.1],
//             });

//             results.push({
//                 index: i,
//                 roi,
//                 matched: result.matched,
//                 score: result.score,
//                 location: result.location,
//                 roiRect: result.roiRect,
//             });
//         }

//         const leftmost = results.find((r) => r.matched);

//         const shapes: DiagnosticOverlayMeta["shapes"] = [];

//         const barX = Math.round(0.33 * width);
//         const barY = Math.round(0.8 * height);
//         const barW = Math.round(0.44 * width);
//         const barH = Math.round(0.14 * height);

//         shapes.push({
//             type: "box",
//             x: barX,
//             y: barY,
//             width: barW,
//             height: barH,
//             color: "blue",
//             label: "milestone-bar",
//             lineWidth: 2,
//         });

//         for (const r of results) {
//             const slotX = Math.round(r.roi.xRatio * width);
//             const slotY = Math.round(r.roi.yRatio * height);
//             const slotW = Math.round(r.roi.widthRatio * width);
//             const slotH = Math.round(r.roi.heightRatio * height);

//             shapes.push({
//                 type: "box",
//                 x: slotX,
//                 y: slotY,
//                 width: slotW,
//                 height: slotH,
//                 color: r.matched ? "green" : "red",
//                 label: `slot-${r.index} (${r.score.toFixed(2)})`,
//                 lineWidth: r.matched ? 3 : 1,
//             });

//             if (r.location) {
//                 shapes.push({
//                     type: "box",
//                     x: r.location.x,
//                     y: r.location.y,
//                     width: r.location.width,
//                     height: r.location.height,
//                     color: "yellow",
//                     label: `match-${r.index}`,
//                     lineWidth: 2,
//                 });
//             }
//         }

//         if (!leftmost) {
//             return {
//                 matched: false,
//                 message: "NO MILESTONE READY",
//                 overlays: [
//                     {
//                         purpose: "debug_view" as const,
//                         shapes,
//                         renderNote: "milestone scanner: none ready",
//                     },
//                 ],
//                 meta: {
//                     detectorId: "attendance-milestone-claimable",
//                     allSlots: results,
//                 },
//             };
//         }

//         const slotIndex = leftmost.index;
//         const slotBox = {
//             x: Math.round(leftmost.roi.xRatio * width),
//             y: Math.round(leftmost.roi.yRatio * height),
//             width: Math.round(leftmost.roi.widthRatio * width),
//             height: Math.round(leftmost.roi.heightRatio * height),
//         };

//         const clickPoint = leftmost.location
//             ? {
//                   x: Math.round(
//                       leftmost.location.x + leftmost.location.width / 2,
//                   ),
//                   y: Math.round(
//                       leftmost.location.y + leftmost.location.height / 2,
//                   ),
//               }
//             : {
//                   x: Math.round(slotBox.x + slotBox.width / 2),
//                   y: Math.round(slotBox.y + slotBox.height / 2),
//               };

//         const matchBox = leftmost.location
//             ? {
//                   x: leftmost.location.x,
//                   y: leftmost.location.y,
//                   width: leftmost.location.width,
//                   height: leftmost.location.height,
//               }
//             : {
//                   x: slotBox.x,
//                   y: slotBox.y,
//                   width: slotBox.width,
//                   height: slotBox.height,
//               };

//         return {
//             matched: true,
//             confidence: leftmost.score,
//             matchBox,
//             message: `MILESTONE SLOT ${slotIndex} READY`,
//             overlays: [
//                 {
//                     purpose: "debug_view" as const,
//                     shapes,
//                     renderNote: `milestone scanner: slot ${slotIndex} prioritized`,
//                 },
//             ],
//             meta: {
//                 detectorId: "attendance-milestone-claimable",
//                 slotIndex,
//                 slotBox,
//                 matchBox,
//                 clickPoint,
//                 score: leftmost.score,
//                 allSlots: results,
//             },
//         };
//     },
// };

const attendancePopupCloseButtonDetector = createTemplateMatchDetector({
    detectorId: "attendance-popup-close-button",
    template: templates.attendanceClose,
    screenshotLabel: "detect_attendance_popup_close_button",
    overlayLabel: "attendance-popup-close-button",
    roi: {
        xRatio: 0.65,
        yRatio: 0.02,
        widthRatio: 0.3,
        heightRatio: 0.25,
    },
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE POPUP CLOSE BUTTON => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
});

const attendanceDailyRewardPopupDetector = createTemplateMatchDetector({
    detectorId: "attendance-daily-reward-popup",
    template: templates.headerPopupWard,
    screenshotLabel: "detect_attendance_daily_reward_popup",
    overlayLabel: "attendance-daily-reward-popup",
    roi: {
        xRatio: 0.43,
        yRatio: 0.33,
        widthRatio: 0.15,
        heightRatio: 0.1,
    },
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE DAILY REWARD POPUP => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
});

const attendanceDailyRewardPopupCloseDetector = createTemplateMatchDetector({
    detectorId: "attendance-daily-reward-popup-close-button",
    template: templates.closeButtonReward,
    screenshotLabel: "detect_attendance_daily_reward_popup_close",
    overlayLabel: "attendance-daily-reward-popup-close",
    roi: {
        xRatio: 0.63,
        yRatio: 0.28,
        widthRatio: 0.08,
        heightRatio: 0.15,
    },
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE DAILY REWARD CLOSE BUTTON => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
});

function isCyanLike(r: number, g: number, b: number): boolean {
    return g > 120 && b > 120 && r < 100 && Math.abs(g - b) < 80;
}

function decodePng(buffer: Buffer) {
    const png = PNG.sync.read(buffer);

    return {
        data: png.data, // RGBA
        width: png.width,
        height: png.height,
    };
}

function computeCyanRatioFromBuffer(buffer: Buffer): number {
    const { data, width, height } = decodePng(buffer);

    let match = 0;
    let total = 0;

    for (let i = 0; i < data.length; i += 4 * 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (isCyanLike(r, g, b)) {
            match++;
        }
        total++;
    }

    return total > 0 ? match / total : 0;
}

type GridCellBox = {
    x: number;
    y: number;
    width: number;
    height: number;
    row: number;
    col: number;
    index: number;
};

type AttendanceTodayCellScanResult = {
    found: boolean;
    bestCell?: GridCellBox;
    bestRatio: number;
    cellRatios: Array<{
        index: number;
        row: number;
        col: number;
        ratio: number;
    }>;
};

const ATTENDANCE_GRID_COLS = 6;
const ATTENDANCE_GRID_ROWS = 5;
const ATTENDANCE_CELL_MATCH_THRESHOLD = 0.12;
const ATTENDANCE_CELL_WINNER_MARGIN = 0.05;

type PixelBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

function clampBoxToBounds(
    box: PixelBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    const x = Math.max(0, Math.min(box.x, screenshotWidth - 1));
    const y = Math.max(0, Math.min(box.y, screenshotHeight - 1));
    const width = Math.max(1, Math.min(box.width, screenshotWidth - x));
    const height = Math.max(1, Math.min(box.height, screenshotHeight - y));

    return { x, y, width, height };
}

function cropAbsoluteRectFromScreenshot(
    screenshotBuffer: Buffer,
    rect: PixelBox,
): Buffer {
    const { data, width, height } = decodePng(screenshotBuffer);
    const safe = clampBoxToBounds(rect, width, height);

    const png = new PNG({ width: safe.width, height: safe.height });

    for (let yy = 0; yy < safe.height; yy++) {
        for (let xx = 0; xx < safe.width; xx++) {
            const srcX = safe.x + xx;
            const srcY = safe.y + yy;

            const srcIdx = (srcY * width + srcX) * 4;
            const dstIdx = (yy * safe.width + xx) * 4;

            png.data[dstIdx] = data[srcIdx];
            png.data[dstIdx + 1] = data[srcIdx + 1];
            png.data[dstIdx + 2] = data[srcIdx + 2];
            png.data[dstIdx + 3] = data[srcIdx + 3];
        }
    }

    return PNG.sync.write(png);
}

function resolveAttendanceGridBoxFromPopupHeader(
    headerBox: PixelBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    /**
     * popup-relative grid ROI
     * Tune tại đây nếu cần, không còn hardcode theo full-screen nữa.
     */
    const gridBox = {
        x: Math.round(headerBox.x - headerBox.width * 0.95),
        y: Math.round(headerBox.y + headerBox.height * 3.08),
        width: Math.round(headerBox.width * 2.9),
        height: Math.round(headerBox.height * 11),
    };

    return clampBoxToBounds(gridBox, screenshotWidth, screenshotHeight);
}

function buildAttendanceGridCellsFromGridBox(gridBox: PixelBox): GridCellBox[] {
    const baseCellWidth = Math.floor(gridBox.width / ATTENDANCE_GRID_COLS);
    const baseCellHeight = Math.floor(gridBox.height / ATTENDANCE_GRID_ROWS);

    const cells: GridCellBox[] = [];

    for (let row = 0; row < ATTENDANCE_GRID_ROWS; row++) {
        for (let col = 0; col < ATTENDANCE_GRID_COLS; col++) {
            const x = gridBox.x + col * baseCellWidth;
            const y = gridBox.y + row * baseCellHeight;

            const width =
                col === ATTENDANCE_GRID_COLS - 1
                    ? gridBox.x + gridBox.width - x
                    : baseCellWidth;

            const height =
                row === ATTENDANCE_GRID_ROWS - 1
                    ? gridBox.y + gridBox.height - y
                    : baseCellHeight;

            cells.push({
                x,
                y,
                width,
                height,
                row,
                col,
                index: row * ATTENDANCE_GRID_COLS + col,
            });
        }
    }

    return cells;
}

function buildInnerCellBox(
    cell: GridCellBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    return clampBoxToBounds(
        {
            x: cell.x + Math.floor(cell.width * 0.66),
            y: cell.y + Math.floor(cell.height * 0.26),
            width: Math.max(1, Math.floor(cell.width * 0.26)),
            height: Math.max(1, Math.floor(cell.height * 0.36)),
        },
        screenshotWidth,
        screenshotHeight,
    );
}

function scanAttendanceGridFromPopupHeader(
    screenshotBuffer: Buffer,
    headerBox: PixelBox,
) {
    const { width, height } = decodePng(screenshotBuffer);

    const gridBox = resolveAttendanceGridBoxFromPopupHeader(
        headerBox,
        width,
        height,
    );

    const cells = buildAttendanceGridCellsFromGridBox(gridBox);

    let bestRatio = 0;
    let secondBestRatio = 0;
    let bestCell: GridCellBox | undefined;

    const cellRatios = cells.map((cell) => {
        const innerBox = buildInnerCellBox(cell, width, height);
        const innerBuffer = cropAbsoluteRectFromScreenshot(
            screenshotBuffer,
            innerBox,
        );
        const ratio = computeCyanRatioFromBuffer(innerBuffer);

        if (ratio > bestRatio) {
            secondBestRatio = bestRatio;
            bestRatio = ratio;
            bestCell = cell;
        } else if (ratio > secondBestRatio) {
            secondBestRatio = ratio;
        }

        return {
            index: cell.index,
            row: cell.row,
            col: cell.col,
            ratio: Number(ratio.toFixed(4)),
        };
    });

    const winnerMargin = Number((bestRatio - secondBestRatio).toFixed(4));
    const found =
        bestRatio >= ATTENDANCE_CELL_MATCH_THRESHOLD &&
        winnerMargin >= ATTENDANCE_CELL_WINNER_MARGIN;

    return {
        found,
        gridBox,
        cells,
        bestCell,
        bestRatio: Number(bestRatio.toFixed(4)),
        secondBestRatio: Number(secondBestRatio.toFixed(4)),
        winnerMargin,
        cellRatios,
    };
}

type AttendanceDailyCellState = "READY" | "DONE" | "UNKNOWN";

type AttendanceDailyCellClassification = {
    state: AttendanceDailyCellState;
    reason: string;
    screenshotPath?: string;
    attachments?: DiagnosticAttachment[];
    overlays?: DiagnosticOverlayMeta[];
    meta: {
        todayCellIndex?: number;
        todayCellSource?: "tomorrow_previous_cell" | "best_cell_fallback";
        tomorrowCellIndex?: number;
        cyanRatio?: number;
        tickMatched?: boolean;
        tickScore?: number;
        tomorrowMatched?: boolean;
        tomorrowScore?: number;
        gridBestRatio?: number;
        bestCellIndex?: number;
        templateMatched?: boolean;
        todayCellBox?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        tomorrowCellBox?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        tickBox?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        tomorrowMarkerBox?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    };
    matchBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};

function pixelBoxToRatioRoi(
    box: PixelBox,
    screenshotWidth: number,
    screenshotHeight: number,
) {
    return {
        xRatio: box.x / screenshotWidth,
        yRatio: box.y / screenshotHeight,
        widthRatio: box.width / screenshotWidth,
        heightRatio: box.height / screenshotHeight,
    };
}

function buildTomorrowMarkerBox(
    cell: GridCellBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    return clampBoxToBounds(
        {
            x: cell.x + Math.floor(cell.width * 0.31),
            y: cell.y + Math.floor(cell.height * 0.72),
            width: Math.max(1, Math.floor(cell.width * 0.72)),
            height: Math.max(1, Math.floor(cell.height * 0.25)),
        },
        screenshotWidth,
        screenshotHeight,
    );
}

function buildTickCheckBox(
    cell: GridCellBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    /**
     * Tick xanh thường nằm ở nửa trái / phía trên của cell.
     */
    return clampBoxToBounds(
        {
            x: cell.x + Math.floor(cell.width * 0.28),
            y: cell.y + Math.floor(cell.height * 0.3),
            width: Math.max(1, Math.floor(cell.width * 0.4)),
            height: Math.max(1, Math.floor(cell.height * 0.66)),
        },
        screenshotWidth,
        screenshotHeight,
    );
}

function matchTemplateInPixelBox(
    screenshotBuffer: Buffer,
    templateBuffer: Buffer,
    screenshotWidth: number,
    screenshotHeight: number,
    box: PixelBox,
    threshold: number,
    scales: number[],
) {
    return matchTemplateMultiScale(screenshotBuffer, templateBuffer, {
        roi: pixelBoxToRatioRoi(box, screenshotWidth, screenshotHeight),
        threshold,
        scales,
    });
}

async function classifyAttendanceTodayCell(
    ctx: ExecutionContext,
): Promise<AttendanceDailyCellClassification> {
    const templateResult = await baseTemplateDetector.detect(ctx);

    const popup = await attendancePopupAnchorDetector.detect(ctx);

    const screenshotPath =
        templateResult.screenshotPath ?? popup.screenshotPath;

    if (!popup.matched || !popup.matchBox) {
        return {
            state: "UNKNOWN",
            reason: "popup_anchor_not_matched",
            screenshotPath: templateResult.screenshotPath,
            attachments: templateResult.attachments,
            overlays: templateResult.overlays,
            meta: {
                templateMatched: templateResult.matched,
            },
            matchBox: templateResult.matchBox,
        };
    }

    const raw = await ctx.adapter.screenshot?.(ctx.signal);
    if (!raw) {
        return {
            state: "UNKNOWN",
            reason: "no_screenshot",
            screenshotPath: templateResult.screenshotPath,
            attachments: templateResult.attachments,
            overlays: templateResult.overlays,
            meta: {
                templateMatched: templateResult.matched,
            },
            matchBox: templateResult.matchBox,
        };
    }

    const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    const { width, height } = decodePng(buffer);

    const scan = scanAttendanceGridFromPopupHeader(buffer, popup.matchBox);

    const ATTENDANCE_TODAY_BEST_CELL_FALLBACK_THRESHOLD = 0.06;

    console.log(
        "[ATTENDANCE][CLASSIFY_START]",
        JSON.stringify({
            screenshotPath,
            screenshotWidth: width,
            screenshotHeight: height,
            popupMatchBox: popup.matchBox,
            scanGridBox: scan.gridBox,
            bestCellIndex: scan.bestCell?.index,
            bestRatio: Number(scan.bestRatio.toFixed(4)),
            totalCells: scan.cells.length,
        }),
    );

    // gridOverlay moved below after todayCell is resolved

    let tomorrowCell: GridCellBox | undefined;
    let tomorrowScore = -1;
    let matchedTomorrowMarkerBox: PixelBox | undefined;

    const tomorrowOverlayShapes: DiagnosticOverlayMeta["shapes"] = [];
    if (attendanceTomorrowReceiveTemplate) {
        for (const cell of scan.cells) {
            const tomorrowBox = buildTomorrowMarkerBox(cell, width, height);
            tomorrowOverlayShapes.push({
                type: "box",
                x: tomorrowBox.x,
                y: tomorrowBox.y,
                width: tomorrowBox.width,
                height: tomorrowBox.height,
                color: "red",
                label: `tomorrow-roi #${cell.index}`,
                lineWidth: 4,
            });
            const result = matchTemplateInPixelBox(
                buffer,
                attendanceTomorrowReceiveTemplate,
                width,
                height,
                tomorrowBox,
                0.72,
                [0.9, 1.0, 1.1],
            );

            if (result.score > tomorrowScore) {
                tomorrowScore = result.score;
            }

            console.log(
                "[ATTENDANCE][TOMORROW_CHECK]",
                JSON.stringify({
                    cellIndex: cell.index,
                    matched: result.matched,
                    score: Number(result.score.toFixed(4)),
                    threshold: 0.72,
                    tomorrowBox,
                }),
            );

            if (result.matched) {
                tomorrowOverlayShapes.push({
                    type: "box",
                    x: tomorrowBox.x,
                    y: tomorrowBox.y,
                    width: tomorrowBox.width,
                    height: tomorrowBox.height,
                    color: "red",
                    label: `tomorrow-match #${cell.index} score=${result.score.toFixed(3)}`,
                    lineWidth: 3,
                });
                tomorrowCell = cell;
                matchedTomorrowMarkerBox = tomorrowBox;
                console.log(
                    "[ATTENDANCE][TOMORROW_FOUND]",
                    JSON.stringify({
                        tomorrowCellIndex: cell.index,
                        score: Number(result.score.toFixed(4)),
                        tomorrowBox,
                    }),
                );
                break;
            }
        }
    }

    console.log(
        "[ATTENDANCE][TOMORROW_SUMMARY]",
        JSON.stringify({
            bestTomorrowScore: Number(tomorrowScore.toFixed(4)),
            threshold: 0.72,
            found: tomorrowCell ? true : false,
            tomorrowCellIndex: tomorrowCell?.index ?? null,
        }),
    );

    let todayCell: GridCellBox | undefined;
    let cyanRatio = 0;
    let tickMatched = false;
    let tickScore = 0;
    let tickBox: PixelBox | undefined;

    if (tomorrowCell && tomorrowCell.index > 0) {
        todayCell = scan.cells[tomorrowCell.index - 1];
    }

    // let todayCellSource:
    //     | "tomorrow_previous_cell"
    //     | "best_cell_fallback"
    //     | undefined;

    // if (tomorrowCell && tomorrowCell.index > 0) {
    //     todayCell = scan.cells[tomorrowCell.index - 1];
    //     todayCellSource = "tomorrow_previous_cell";
    // } else if (
    //     !tomorrowCell &&
    //     templateResult.matched &&
    //     scan.bestCell &&
    //     scan.bestRatio >= ATTENDANCE_TODAY_BEST_CELL_FALLBACK_THRESHOLD
    // ) {
    //     todayCell = scan.bestCell;
    //     todayCellSource = "best_cell_fallback";
    // }

    console.log(
        "[ATTENDANCE][CELL_RESOLUTION]",
        JSON.stringify({
            todayCellIndex: todayCell?.index ?? null,
            // todayCellSource: todayCellSource ?? null,
            tomorrowCellIndex: tomorrowCell?.index ?? null,
            bestCellIndex: scan.bestCell?.index ?? null,
            bestRatio: Number(scan.bestRatio.toFixed(4)),
            totalCells: scan.cells.length,
            scanGridBox: scan.gridBox,
            popupMatchBox: popup.matchBox,
        }),
    );

    const checkinOverlayShapes: DiagnosticOverlayMeta["shapes"] = [];
    const ticketOverlayShapes: DiagnosticOverlayMeta["shapes"] = [];

    if (todayCell) {
        const todayInner = buildInnerCellBox(todayCell, width, height);
        checkinOverlayShapes.push({
            type: "box",
            x: todayInner.x,
            y: todayInner.y,
            width: todayInner.width,
            height: todayInner.height,
            color: "red",
            label: `checkin-roi`,
            lineWidth: 4,
        });
        const todayInnerBuffer = cropAbsoluteRectFromScreenshot(
            buffer,
            todayInner,
        );
        cyanRatio = computeCyanRatioFromBuffer(todayInnerBuffer);

        console.log(
            "[ATTENDANCE][TODAY_CELL_READY_FOR_TICK]",
            JSON.stringify({
                todayCellIndex: todayCell.index,
                todayCellBox: {
                    x: todayCell.x,
                    y: todayCell.y,
                    width: todayCell.width,
                    height: todayCell.height,
                },
                tickBox: buildTickCheckBox(todayCell, width, height),
                cyanRatio: Number(cyanRatio.toFixed(4)),
                enteringTickEvaluation: true,
            }),
        );

        tickBox = buildTickCheckBox(todayCell, width, height);
        ticketOverlayShapes.push({
            type: "box",
            x: tickBox.x,
            y: tickBox.y,
            width: tickBox.width,
            height: tickBox.height,
            color: "orange",
            label: `ticket-roi`,
            lineWidth: 6,
        });
        const tickResult = matchTemplateInPixelBox(
            buffer,
            templates.attendanceTodayChecked,
            width,
            height,
            tickBox,
            0.35,
            [0.85, 0.95, 1.0, 1.1],
        );

        tickMatched = tickResult.matched;
        tickScore = tickResult.score;

        console.log(
            "[ATTENDANCE][TICK_CHECK]",
            JSON.stringify({
                todayCellIndex: todayCell.index,
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                threshold: 0.35,
                tickBox,
                cyanRatio: Number(cyanRatio.toFixed(4)),
                todayCellBox: {
                    x: todayCell.x,
                    y: todayCell.y,
                    width: todayCell.width,
                    height: todayCell.height,
                },
            }),
        );
    }

    const gridOverlay: DiagnosticOverlayMeta[] = screenshotPath
        ? [
              {
                  purpose: "debug_view",
                  screenshotPath,
                  shapes: [
                      {
                          type: "box",
                          x: scan.gridBox.x,
                          y: scan.gridBox.y,
                          width: scan.gridBox.width,
                          height: scan.gridBox.height,
                          color: "blue",
                          label: "attendance-grid-roi",
                          lineWidth: 2,
                      },
                      ...scan.cells.map((cell) => {
                          let color:
                              | "green"
                              | "yellow"
                              | "red"
                              | "white"
                              | "gray"
                              | "blue"
                              | "orange" = "white";
                          let label = `cell #${cell.index}`;
                          let lineWidth = 1;

                          if (cell.index === todayCell?.index) {
                              color = "green";
                              label = `[TODAY] ${label}`;
                              lineWidth = 3;
                          } else if (cell.index === tomorrowCell?.index) {
                              color = "yellow";
                              label = `[TOMORROW] ${label}`;
                              lineWidth = 3;
                          } else if (cell.index === scan.bestCell?.index) {
                              color = "orange";
                              label = `[BEST] ${label}`;
                              lineWidth = 2;
                          }

                          return {
                              type: "box" as const,
                              x: cell.x,
                              y: cell.y,
                              width: cell.width,
                              height: cell.height,
                              color,
                              label,
                              lineWidth,
                          };
                      }),
                      ...tomorrowOverlayShapes,
                      ...checkinOverlayShapes,
                      ...ticketOverlayShapes,
                  ],
                  renderNote: "attendance grid scan (all 30 cells)",
              },
          ]
        : [];

    console.log(
        "[ATTENDANCE][GRID_OVERLAY_COUNTS]",
        JSON.stringify({
            baseCells: scan.cells.length,
            tomorrowOverlayCount: tomorrowOverlayShapes.length,
            checkinOverlayCount: checkinOverlayShapes.length,
            tickOverlayCount: ticketOverlayShapes.length,
            totalShapes: gridOverlay[0]?.shapes?.length ?? 0,
        }),
    );

    const finalOverlays = [...(templateResult.overlays ?? []), ...gridOverlay];

    console.log(
        "[ATTENDANCE][CLASSIFY_RETURN_OVERLAYS]",
        JSON.stringify(
            finalOverlays.map((o, i) => ({
                index: i,
                purpose: o.purpose,
                screenshotPath: o.screenshotPath,
                shapeCount: o.shapes?.length ?? 0,
                labels: (o.shapes ?? [])
                    .filter((s) => s.type === "box")
                    .map((s) => s.label ?? null),
            })),
            null,
            2,
        ),
    );
    // 1) Semantic path: if tomorrow marker found, classify the previous cell.
    if (todayCell && tickMatched) {
        console.log(
            "[ATTENDANCE][CLASSIFY_DECISION]",
            JSON.stringify({
                state: "DONE",
                reason: "semantic_tick_on_today_cell",
                todayCellIndex: todayCell.index,
                tomorrowCellIndex: tomorrowCell?.index,
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                cyanRatio: Number(cyanRatio.toFixed(4)),
            }),
        );
        return {
            state: "DONE",
            reason: "semantic_tick_on_today_cell",
            screenshotPath,
            attachments: templateResult.attachments,
            overlays: [...(templateResult.overlays ?? []), ...gridOverlay],
            meta: {
                todayCellIndex: todayCell.index,
                // todayCellSource,
                tomorrowCellIndex: tomorrowCell?.index,
                cyanRatio: Number(cyanRatio.toFixed(4)),
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowMatched: true,
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                gridBestRatio: Number(scan.bestRatio.toFixed(4)),
                bestCellIndex: scan.bestCell?.index,
                templateMatched: templateResult.matched,
                todayCellBox: todayCell
                    ? {
                          x: todayCell.x,
                          y: todayCell.y,
                          width: todayCell.width,
                          height: todayCell.height,
                      }
                    : undefined,
                tomorrowCellBox: tomorrowCell
                    ? {
                          x: tomorrowCell.x,
                          y: tomorrowCell.y,
                          width: tomorrowCell.width,
                          height: tomorrowCell.height,
                      }
                    : undefined,
                tickBox: tickBox
                    ? {
                          x: tickBox.x,
                          y: tickBox.y,
                          width: tickBox.width,
                          height: tickBox.height,
                      }
                    : undefined,
                tomorrowMarkerBox: matchedTomorrowMarkerBox
                    ? {
                          x: matchedTomorrowMarkerBox.x,
                          y: matchedTomorrowMarkerBox.y,
                          width: matchedTomorrowMarkerBox.width,
                          height: matchedTomorrowMarkerBox.height,
                      }
                    : undefined,
            },
            matchBox: {
                x: todayCell.x,
                y: todayCell.y,
                width: todayCell.width,
                height: todayCell.height,
            },
        };
    }

    if (todayCell && cyanRatio >= ATTENDANCE_CELL_MATCH_THRESHOLD) {
        console.log(
            "[ATTENDANCE][CLASSIFY_DECISION]",
            JSON.stringify({
                state: "READY",
                reason: "semantic_cyan_on_today_cell",
                todayCellIndex: todayCell.index,
                tomorrowCellIndex: tomorrowCell?.index,
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                cyanRatio: Number(cyanRatio.toFixed(4)),
                cyanThreshold: ATTENDANCE_CELL_MATCH_THRESHOLD,
            }),
        );
        return {
            state: "READY",
            reason: "semantic_cyan_on_today_cell",
            screenshotPath,
            overlays: [...(templateResult.overlays ?? []), ...gridOverlay],
            attachments: templateResult.attachments,
            meta: {
                todayCellIndex: todayCell.index,
                // todayCellSource,
                tomorrowCellIndex: tomorrowCell?.index,
                cyanRatio: Number(cyanRatio.toFixed(4)),
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowMatched: true,
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                gridBestRatio: Number(scan.bestRatio.toFixed(4)),
                bestCellIndex: scan.bestCell?.index,
                templateMatched: templateResult.matched,
                todayCellBox: todayCell
                    ? {
                          x: todayCell.x,
                          y: todayCell.y,
                          width: todayCell.width,
                          height: todayCell.height,
                      }
                    : undefined,
                tomorrowCellBox: tomorrowCell
                    ? {
                          x: tomorrowCell.x,
                          y: tomorrowCell.y,
                          width: tomorrowCell.width,
                          height: tomorrowCell.height,
                      }
                    : undefined,
                tickBox: tickBox
                    ? {
                          x: tickBox.x,
                          y: tickBox.y,
                          width: tickBox.width,
                          height: tickBox.height,
                      }
                    : undefined,
                tomorrowMarkerBox: matchedTomorrowMarkerBox
                    ? {
                          x: matchedTomorrowMarkerBox.x,
                          y: matchedTomorrowMarkerBox.y,
                          width: matchedTomorrowMarkerBox.width,
                          height: matchedTomorrowMarkerBox.height,
                      }
                    : undefined,
            },
            matchBox: {
                x: todayCell.x,
                y: todayCell.y,
                width: todayCell.width,
                height: todayCell.height,
            },
        };
    }

    // 2) Fallback path: if semantic marker not found or semantic state unresolved,
    // use the existing best-cyan heuristic.
    if (scan.found && scan.bestCell) {
        console.log(
            "[ATTENDANCE][CLASSIFY_DECISION]",
            JSON.stringify({
                state: "READY",
                reason: "fallback_best_cyan_cell",
                bestCellIndex: scan.bestCell.index,
                bestRatio: Number(scan.bestRatio.toFixed(4)),
                tomorrowCellIndex: tomorrowCell?.index,
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
            }),
        );
        return {
            state: "READY",
            reason: "fallback_best_cyan_cell",
            screenshotPath,
            attachments: templateResult.attachments,
            overlays: [...(templateResult.overlays ?? []), ...gridOverlay],
            meta: {
                todayCellIndex: scan.bestCell.index,
                // todayCellSource,
                cyanRatio: Number(scan.bestRatio.toFixed(4)),
                tickMatched: false,
                tickScore: 0,
                tomorrowMatched: Boolean(tomorrowCell),
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                gridBestRatio: Number(scan.bestRatio.toFixed(4)),
                bestCellIndex: scan.bestCell.index,
                templateMatched: templateResult.matched,
                todayCellBox: scan.bestCell
                    ? {
                          x: scan.bestCell.x,
                          y: scan.bestCell.y,
                          width: scan.bestCell.width,
                          height: scan.bestCell.height,
                      }
                    : undefined,
                tomorrowCellBox: tomorrowCell
                    ? {
                          x: tomorrowCell.x,
                          y: tomorrowCell.y,
                          width: tomorrowCell.width,
                          height: tomorrowCell.height,
                      }
                    : undefined,
                tickBox: undefined,
                tomorrowMarkerBox: matchedTomorrowMarkerBox
                    ? {
                          x: matchedTomorrowMarkerBox.x,
                          y: matchedTomorrowMarkerBox.y,
                          width: matchedTomorrowMarkerBox.width,
                          height: matchedTomorrowMarkerBox.height,
                      }
                    : undefined,
            },
            matchBox: {
                x: scan.bestCell.x,
                y: scan.bestCell.y,
                width: scan.bestCell.width,
                height: scan.bestCell.height,
            },
        };
    }

    if (templateResult.matched && templateResult.matchBox) {
        console.log(
            "[ATTENDANCE][CLASSIFY_DECISION]",
            JSON.stringify({
                state: "READY",
                reason: "fallback_template_match",
                // todayCellSource,
                templateMatched: templateResult.matched,
                templateMatchBox: templateResult.matchBox,
                tomorrowCellIndex: tomorrowCell?.index,
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                bestCellIndex: scan.bestCell?.index,
                bestRatio: Number(scan.bestRatio.toFixed(4)),
            }),
        );
        return {
            state: "READY",
            reason: "fallback_template_match",
            screenshotPath,
            attachments: templateResult.attachments,
            overlays: [...(templateResult.overlays ?? []), ...gridOverlay],
            meta: {
                cyanRatio: Number(scan.bestRatio.toFixed(4)),
                tickMatched: false,
                tickScore: 0,
                tomorrowMatched: Boolean(tomorrowCell),
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                gridBestRatio: Number(scan.bestRatio.toFixed(4)),
                bestCellIndex: scan.bestCell?.index,
                templateMatched: true,
                todayCellBox: undefined,
                tomorrowCellBox: tomorrowCell
                    ? {
                          x: tomorrowCell.x,
                          y: tomorrowCell.y,
                          width: tomorrowCell.width,
                          height: tomorrowCell.height,
                      }
                    : undefined,
                tickBox: undefined,
                tomorrowMarkerBox: matchedTomorrowMarkerBox
                    ? {
                          x: matchedTomorrowMarkerBox.x,
                          y: matchedTomorrowMarkerBox.y,
                          width: matchedTomorrowMarkerBox.width,
                          height: matchedTomorrowMarkerBox.height,
                      }
                    : undefined,
            },
            matchBox: templateResult.matchBox,
        };
    }

    if (!todayCell) {
        console.log(
            "[ATTENDANCE][TODAY_CELL_MISSING]",
            JSON.stringify({
                todayCellIndex: (todayCell as any)?.index ?? null,
                // todayCellSource: todayCellSource ?? null,
                tomorrowCellIndex: tomorrowCell?.index ?? null,
                bestCellIndex: scan.bestCell?.index ?? null,
                bestRatio: Number(scan.bestRatio.toFixed(4)),
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                cyanRatio: Number(cyanRatio.toFixed(4)),
            }),
        );
    }

    console.log(
        "[ATTENDANCE][CLASSIFY_DECISION]",
        JSON.stringify({
            state: "UNKNOWN",
            // todayCellSource,
            reason: tomorrowCell
                ? "semantic_today_cell_unresolved"
                : "no_semantic_marker_and_no_fallback_match",
            todayCellIndex: todayCell?.index,
            tomorrowCellIndex: tomorrowCell?.index,
            tickMatched,
            tickScore: Number(tickScore.toFixed(4)),
            tomorrowScore: Number(tomorrowScore.toFixed(4)),
            cyanRatio: Number(cyanRatio.toFixed(4)),
            bestCellIndex: scan.bestCell?.index,
            bestRatio: Number(scan.bestRatio.toFixed(4)),
        }),
    );

    return {
        state: "UNKNOWN",
        reason: tomorrowCell
            ? "semantic_today_cell_unresolved"
            : "no_semantic_marker_and_no_fallback_match",
        screenshotPath,
        attachments: templateResult.attachments,
        overlays: [...(templateResult.overlays ?? []), ...gridOverlay],
        meta: {
            todayCellIndex: todayCell?.index,
            // todayCellSource,
            tomorrowCellIndex: tomorrowCell?.index,
            cyanRatio: Number(cyanRatio.toFixed(4)),
            tickMatched,
            tickScore: Number(tickScore.toFixed(4)),
            tomorrowMatched: Boolean(tomorrowCell),
            tomorrowScore: Number(tomorrowScore.toFixed(4)),
            gridBestRatio: Number(scan.bestRatio.toFixed(4)),
            bestCellIndex: scan.bestCell?.index,
            templateMatched: templateResult.matched,
            todayCellBox: todayCell
                ? {
                      x: todayCell.x,
                      y: todayCell.y,
                      width: todayCell.width,
                      height: todayCell.height,
                  }
                : undefined,
            tomorrowCellBox: tomorrowCell
                ? {
                      x: tomorrowCell.x,
                      y: tomorrowCell.y,
                      width: tomorrowCell.width,
                      height: tomorrowCell.height,
                  }
                : undefined,
            tickBox: tickBox
                ? {
                      x: tickBox.x,
                      y: tickBox.y,
                      width: tickBox.width,
                      height: tickBox.height,
                  }
                : undefined,
            tomorrowMarkerBox: matchedTomorrowMarkerBox
                ? {
                      x: matchedTomorrowMarkerBox.x,
                      y: matchedTomorrowMarkerBox.y,
                      width: matchedTomorrowMarkerBox.width,
                      height: matchedTomorrowMarkerBox.height,
                  }
                : undefined,
        },
        matchBox: todayCell
            ? {
                  x: todayCell.x,
                  y: todayCell.y,
                  width: todayCell.width,
                  height: todayCell.height,
              }
            : scan.bestCell
              ? {
                    x: scan.bestCell.x,
                    y: scan.bestCell.y,
                    width: scan.bestCell.width,
                    height: scan.bestCell.height,
                }
              : templateResult.matchBox,
    };
}

function buildAttendanceSemanticDebugOverlay(
    classified: AttendanceDailyCellClassification,
): DiagnosticOverlayMeta[] {
    if (!classified.screenshotPath) {
        return [];
    }

    const shapes: DiagnosticOverlayMeta["shapes"] = [];

    const todayCellBox = classified.meta.todayCellBox;
    const tomorrowCellBox = classified.meta.tomorrowCellBox;
    const tickBox = classified.meta.tickBox;
    const tomorrowMarkerBox = classified.meta.tomorrowMarkerBox;

    if (todayCellBox) {
        shapes.push({
            type: "box",
            x: todayCellBox.x,
            y: todayCellBox.y,
            width: todayCellBox.width,
            height: todayCellBox.height,
            color: "green",
            label: `today-cell #${classified.meta.todayCellIndex ?? "?"}`,
            lineWidth: 2,
        });
    }

    if (tomorrowCellBox) {
        shapes.push({
            type: "box",
            x: tomorrowCellBox.x,
            y: tomorrowCellBox.y,
            width: tomorrowCellBox.width,
            height: tomorrowCellBox.height,
            color: "yellow",
            label: `tomorrow-cell #${classified.meta.tomorrowCellIndex ?? "?"}`,
            lineWidth: 2,
        });
    }

    if (tickBox) {
        shapes.push({
            type: "box",
            x: tickBox.x,
            y: tickBox.y,
            width: tickBox.width,
            height: tickBox.height,
            color: "orange",
            label: `tick-roi score=${Number(
                classified.meta.tickScore ?? 0,
            ).toFixed(3)}`,
            lineWidth: 2,
        });
    }

    if (tomorrowMarkerBox) {
        shapes.push({
            type: "box",
            x: tomorrowMarkerBox.x,
            y: tomorrowMarkerBox.y,
            width: tomorrowMarkerBox.width,
            height: tomorrowMarkerBox.height,
            color: "white",
            label: `tomorrow-marker score=${Number(
                classified.meta.tomorrowScore ?? 0,
            ).toFixed(3)}`,
            lineWidth: 2,
        });
    }

    if (shapes.length === 0) {
        return [];
    }

    return [
        {
            purpose: "debug_view",
            screenshotPath: classified.screenshotPath,
            shapes,
            renderNote: `attendance semantic ${classified.state.toLowerCase()}`,
        },
    ];
}

const ATTENDANCE_MAX_RETRY = 3;
const ATTENDANCE_VERIFY_WINDOW_ITERATIONS = 2;

function readIntVar(
    ctx: { variables: Record<string, string> },
    key: string,
    fallback = 0,
): number {
    const raw = ctx.variables[key];
    const parsed = Number.parseInt(raw ?? "", 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function setVar(
    ctx: { setVariable?: (key: string, value: string) => void },
    key: string,
    value: string,
): void {
    ctx.setVariable?.(key, value);
}

function clearAttendanceRuntime(ctx: {
    setVariable?: (key: string, value: string) => void;
}): void {
    setVar(ctx, "ATTENDANCE_VERIFY_ARMED", "false");
    setVar(ctx, "ATTENDANCE_VERIFY_ARMED_AT_ITERATION", "");
    setVar(ctx, "ATTENDANCE_VERIFY_DEADLINE_ITERATION", "");
    setVar(ctx, "ATTENDANCE_LAST_CLICK_AT_ITERATION", "");
    setVar(ctx, "ATTENDANCE_LAST_CLICK_SOURCE_DETECTOR_RUN_ID", "");
    setVar(ctx, "ATTENDANCE_LAST_CLICK_RETRY_ATTEMPT", "");
    setVar(ctx, "ATTENDANCE_LAST_FAILURE_KIND", "");
    setVar(ctx, "ATTENDANCE_LAST_FAILURE_MESSAGE", "");
    setVar(ctx, "ATTENDANCE_LAST_FAILURE_AT_ITERATION", "");
    setVar(ctx, "ATTENDANCE_ABORT_REASON", "");
    setVar(ctx, "ATTENDANCE_POPUP_CONFIRMED", "false");
}

function markAttendanceAborted(
    ctx: {
        setVariable?: (key: string, value: string) => void;
    },
    reason: string,
): void {
    setVar(ctx, "ATTENDANCE_POPUP_CONFIRMED", "false");
    setVar(ctx, "ATTENDANCE_MILESTONE_PHASE", "false");
    setVar(ctx, "ATTENDANCE_ABORT_REASON", reason);
    setVar(ctx, "ATTENDANCE_VERIFY_ARMED", "false");
    setVar(ctx, "ATTENDANCE_VERIFY_DEADLINE_ITERATION", "");
}

function registerAttendanceRetry(
    ctx: {
        variables: Record<string, string>;
        iteration: number;
        setVariable?: (key: string, value: string) => void;
    },
    reason: string,
): number {
    const nextRetry = readIntVar(ctx, "ATTENDANCE_RETRY_COUNT", 0) + 1;

    setVar(ctx, "ATTENDANCE_RETRY_COUNT", String(nextRetry));
    setVar(ctx, "ATTENDANCE_LAST_FAILURE_KIND", reason);
    setVar(ctx, "ATTENDANCE_LAST_FAILURE_MESSAGE", reason);
    setVar(ctx, "ATTENDANCE_LAST_FAILURE_AT_ITERATION", String(ctx.iteration));

    return nextRetry;
}

function markAttendanceFlowSuccess(ctx: {
    setVariable?: (key: string, value: string) => void;
}): void {
    setVar(ctx, "ATTENDANCE_FLOW_RESULT", "success");
    setVar(ctx, "ATTENDANCE_MILESTONE_PHASE", "false");
    setVar(ctx, "ATTENDANCE_ABORT_REASON", "");
}

export const td3qBrowserScenario: ScenarioDefinition = {
    id: "td3q-browser",
    name: "TD3Q Browser Scenario",
    version: "0.1.0",
    maxIterations: 15,
    idleIterationLimit: 5,

    detectionRules: [
        //login page
        {
            id: "detect-login-page",
            state: "LOGIN_PAGE",
            async detect(ctx) {
                const submit = await ctx.adapter.queryTarget(
                    targets.submitButton,
                    ctx.signal,
                );
                const password = await ctx.adapter.queryTarget(
                    targets.passwordInput,
                    ctx.signal,
                );
                return submit.found && password.found;
            },
        },

        //ATTENDANCE_DAILY_READY
        {
            id: "detect-attendance-daily-ready",
            state: "ATTENDANCE_DAILY_READY",
            async detect(ctx) {
                if (ctx.variables.ATTENDANCE_POPUP_CONFIRMED !== "true")
                    return false;

                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                return attendanceTodayClaimableDetector.detect(ctx);
            },
        },
        //ATTENDANCE_DAILY_REWARD_POPUP_OPEN
        {
            id: "detect-attendance-daily-reward-popup-open",
            state: "ATTENDANCE_DAILY_REWARD_POPUP_OPEN",
            async detect(ctx) {
                if (ctx.variables.ATTENDANCE_POPUP_CONFIRMED !== "true")
                    return false;

                // 1. Try close button first (preferred because it is actionable)
                const closeMatch =
                    await attendanceDailyRewardPopupCloseDetector.detect(ctx);
                if (closeMatch.matched) return closeMatch;

                // 2. Fallback to header detection
                return attendanceDailyRewardPopupDetector.detect(ctx);
            },
        },

        //ATTENDANCE_MILESTONE_READY
        {
            id: "detect-attendance-milestone-ready",
            state: "ATTENDANCE_MILESTONE_READY",
            async detect(ctx) {
                if (ctx.variables.ATTENDANCE_MILESTONE_PHASE !== "true")
                    return false;
                if (ctx.variables.ATTENDANCE_POPUP_CONFIRMED !== "true")
                    return false;
                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                return attendanceMilestoneClaimableDetector.detect(ctx);
            },
        },

        //ATTENDANCE_DAILY_DONE
        {
            id: "detect-attendance-daily-done",
            state: "ATTENDANCE_DAILY_DONE",
            async detect(ctx) {
                if (ctx.variables.ATTENDANCE_MILESTONE_PHASE === "true")
                    return false;

                if (ctx.variables.ATTENDANCE_POPUP_CONFIRMED !== "true")
                    return false;

                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                return attendanceTodayDoneDetector.detect(ctx);
            },
        },

        //ATTENDANCE_MILESTONE_DONE
        // {
        //     id: "detect-attendance-milestone-done",
        //     state: "ATTENDANCE_MILESTONE_DONE",
        //     async detect(ctx) {
        //         if (ctx.variables.ATTENDANCE_MILESTONE_PHASE !== "true")
        //             return false;
        //         if (ctx.variables.ATTENDANCE_POPUP_CONFIRMED !== "true")
        //             return false;

        //         const popup = await attendancePopupAnchorDetector.detect(ctx);
        //         if (!popup.matched) return false;

        //         const milestone =
        //             await attendanceMilestoneClaimableDetector.detect(ctx);

        //         return {
        //             matched: !milestone.matched,
        //             message: milestone.matched
        //                 ? "milestone_still_available"
        //                 : "all_milestones_claimed",
        //             meta: {
        //                 scannerMatched: milestone.matched,
        //             },
        //         };
        //     },
        // },
        {
            id: "detect-attendance-milestone-done",
            state: "ATTENDANCE_MILESTONE_DONE",
            async detect(ctx) {
                if (ctx.variables.ATTENDANCE_CLOSE_PHASE === "true") {
                    return false;
                }
                // --- chỉ chạy khi milestone phase đang active
                if (ctx.variables.ATTENDANCE_MILESTONE_PHASE !== "true") {
                    return false;
                }

                // --- popup phải còn mở
                if (ctx.variables.ATTENDANCE_POPUP_CONFIRMED !== "true") {
                    return false;
                }

                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                // --- scan milestone lại
                const result =
                    await attendanceMilestoneClaimableDetector.detect(ctx);

                // --- nếu còn claimable → chưa done
                if (result.matched) {
                    return false;
                }

                // --- full scan zero match → DONE
                return {
                    matched: true,
                    confidence: 1,
                    message: "ATTENDANCE MILESTONE DONE",
                };
            },
        },

        //ATTENDANCE_CLOSE_READY
        // {
        //     id: "detect-attendance-close-ready",
        //     state: "ATTENDANCE_CLOSE_READY",
        //     async detect(ctx) {
        //         if (ctx.variables.ATTENDANCE_MILESTONE_PHASE !== "true")
        //             return false;
        //         if (ctx.variables.ATTENDANCE_POPUP_CONFIRMED !== "true")
        //             return false;

        //         const popup = await attendancePopupAnchorDetector.detect(ctx);
        //         if (!popup.matched) return false;

        //         const milestone =
        //             await attendanceMilestoneClaimableDetector.detect(ctx);

        //         return {
        //             matched: !milestone.matched,
        //             message: !milestone.matched
        //                 ? "ready_to_close"
        //                 : "milestones_pending",
        //             meta: {
        //                 milestoneActive: milestone.matched,
        //             },
        //         };
        //     },
        // },
        {
            id: "detect-attendance-close-ready",
            state: "ATTENDANCE_CLOSE_READY",
            async detect(ctx) {
                // --- chỉ close khi milestone phase đã kết thúc
                if (ctx.variables.ATTENDANCE_MILESTONE_PHASE !== "true") {
                    return false;
                }

                if (ctx.variables.ATTENDANCE_POPUP_CONFIRMED !== "true") {
                    return false;
                }

                if (ctx.variables.ATTENDANCE_CLOSE_PHASE !== "true") {
                    return false;
                }

                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                // --- re-check milestone để đảm bảo không còn slot claimable
                const result =
                    await attendanceMilestoneClaimableDetector.detect(ctx);

                if (result.matched) {
                    return false;
                }

                return {
                    matched: true,
                    confidence: 1,
                    message: "ATTENDANCE CLOSE READY",
                };
            },
        },

        //ATTENDANCE_POPUP_OPEN
        {
            id: "detect-attendance-popup-open",
            state: "ATTENDANCE_POPUP_OPEN",
            async detect(ctx) {
                if (ctx.variables.ATTENDANCE_POPUP_CONFIRMED === "true") {
                    return attendancePopupAnchorDetector.detect(ctx);
                }

                const result = await attendancePopupVerifyDetector.detect(ctx);

                if (result.matched) {
                    setVar(ctx, "ATTENDANCE_RETRY_COUNT", "0");
                    setVar(ctx, "ATTENDANCE_VERIFY_ARMED", "false");
                    setVar(ctx, "ATTENDANCE_VERIFY_DEADLINE_ITERATION", "");
                    setVar(ctx, "ATTENDANCE_POPUP_CONFIRMED", "true");
                }

                return result;
            },
        },

        //ATTENDANCE_FLOW_DONE
        {
            id: "detect-attendance-flow-done",
            state: "ATTENDANCE_FLOW_DONE",
            async detect(ctx) {
                if (ctx.variables.ATTENDANCE_FLOW_RESULT !== "success") {
                    return false;
                }

                const player = await ctx.adapter.queryTarget(
                    targets.gameHost,
                    ctx.signal,
                );

                return {
                    matched: player.found && player.visible === true,
                    message: "attendance_flow_success",
                    meta: {
                        flowResult: ctx.variables.ATTENDANCE_FLOW_RESULT,
                    },
                };
            },
        },
        //ATTENDANCE_FLOW_FAILED
        {
            id: "detect-attendance-open-failed",
            state: "ATTENDANCE_FLOW_FAILED",
            async detect(ctx) {
                const abortReason =
                    ctx.variables.ATTENDANCE_ABORT_REASON?.trim();

                if (!abortReason) {
                    return false;
                }

                return {
                    matched: true,
                    confidence: 1,
                    message: `ATTENDANCE OPEN FAILED => ${abortReason}`,
                    meta: {
                        feature: "open_attendance_popup",
                        abortReason,
                        retryCount: readIntVar(
                            ctx,
                            "ATTENDANCE_RETRY_COUNT",
                            0,
                        ),
                        lastFailureKind:
                            ctx.variables.ATTENDANCE_LAST_FAILURE_KIND,
                        lastFailureMessage:
                            ctx.variables.ATTENDANCE_LAST_FAILURE_MESSAGE,
                    },
                };
            },
        },
        //game error
        {
            id: "detect-game-error",
            state: "GAME_ERROR",
            async detect(ctx) {
                const screenshot = await ctx.adapter.screenshot?.(ctx.signal);
                if (!screenshot) return false;

                // MVP: detect black screen / stuck frame / error overlay
                // (tạm thời return false → sẽ mở rộng sau)

                return false;
            },
        },
        //game running
        {
            id: "detect-game-running",
            state: "GAME_RUNNING",
            async detect(ctx) {
                const player = await ctx.adapter.queryTarget(
                    targets.gameHost,
                    ctx.signal,
                );
                const warning = await ctx.adapter.queryTarget(
                    targets.openInNewTab,
                    ctx.signal,
                );

                return (
                    player.found && player.visible === true && !warning.found
                );
            },
        },
        // warning page
        {
            id: "detect-warning-page",
            state: "WARNING_PAGE",
            async detect(ctx) {
                const warning = await ctx.adapter.queryTarget(
                    targets.openInNewTab,
                    ctx.signal,
                );
                return warning.found;
            },
        },
        //list serser
        {
            id: "detect-dashboard-server-list-open",
            state: "DASHBOARD_SERVER_LIST_OPEN",
            async detect(ctx) {
                const play = await ctx.adapter.queryTarget(
                    targets.playButton,
                    ctx.signal,
                );
                const serverListItem = await ctx.adapter.queryTarget(
                    targets.server7Item,
                    ctx.signal,
                );
                return play.found && serverListItem.found;
            },
        },
        //dashboard idle
        {
            id: "detect-dashboard-idle",
            state: "DASHBOARD_IDLE",
            async detect(ctx) {
                const play = await ctx.adapter.queryTarget(
                    targets.playButton,
                    ctx.signal,
                );
                const serverListItem = await ctx.adapter.queryTarget(
                    targets.serverListItem,
                    ctx.signal,
                );
                return play.found && !serverListItem.found;
            },
        },
    ],

    transitions: [
        //login
        {
            id: "submit-login",
            from: "LOGIN_PAGE",
            to: "DASHBOARD",
            priority: 100,
            async canRun(ctx) {
                const hasUser = Boolean(ctx.variables.TEST_USER?.trim());
                const hasPass = Boolean(ctx.variables.TEST_PASS?.trim());

                if (!hasUser) {
                    return { allowed: false, reason: "Missing TEST_USER" };
                }
                if (!hasPass) {
                    return { allowed: false, reason: "Missing TEST_PASS" };
                }

                const email = await ctx.adapter.queryTarget(
                    targets.emailInput,
                    ctx.signal,
                );
                const password = await ctx.adapter.queryTarget(
                    targets.passwordInput,
                    ctx.signal,
                );
                const submit = await ctx.adapter.queryTarget(
                    targets.submitButton,
                    ctx.signal,
                );

                return {
                    allowed: email.found && password.found && submit.found,
                    reason:
                        email.found && password.found && submit.found
                            ? undefined
                            : "Login form targets not found",
                };
            },
            async buildAction(ctx) {
                return {
                    id: "action-fill-and-submit-login",
                    kind: "COMPOSITE",
                    actions: [
                        {
                            id: "fill-user",
                            kind: "TYPE",
                            target: targets.emailInput,
                            value: ctx.variables.TEST_USER ?? "",
                        },
                        {
                            id: "fill-pass",
                            kind: "TYPE",
                            target: targets.passwordInput,
                            value: ctx.variables.TEST_PASS ?? "",
                        },
                        {
                            id: "click-submit",
                            kind: "CLICK",
                            target: targets.submitButton,
                        },
                    ],
                };
            },
        },
        //open server list
        {
            id: "open-server-list",
            from: "DASHBOARD_IDLE",
            to: "DASHBOARD_SERVER_LIST_OPEN",
            priority: 90,
            async canRun(ctx) {
                const play = await ctx.adapter.queryTarget(
                    targets.playButton,
                    ctx.signal,
                );
                const serverListItem = await ctx.adapter.queryTarget(
                    targets.serverListItem,
                    ctx.signal,
                );

                return {
                    allowed: play.found && !serverListItem.found,
                    reason:
                        play.found && !serverListItem.found
                            ? undefined
                            : "Server list already open or play button missing",
                };
            },
            async buildAction() {
                return {
                    id: "action-open-server-list",
                    kind: "CLICK",
                    target: targets.playButton,
                };
            },
        },
        //select server
        {
            id: "select-server-7",
            from: "DASHBOARD_SERVER_LIST_OPEN",
            to: "WARNING_PAGE",
            priority: 80,
            async canRun(ctx) {
                const server7 = await ctx.adapter.queryTarget(
                    targets.server7Item,
                    ctx.signal,
                );
                return {
                    allowed: server7.found,
                    reason: server7.found ? undefined : "Server 7 not found",
                };
            },
            async buildAction() {
                return {
                    id: "action-select-server-7",
                    kind: "CLICK",
                    target: targets.server7Item,
                };
            },
        },
        //open game in new tab
        {
            id: "open-in-new-tab",
            from: "WARNING_PAGE",
            to: "GAME_RUNNING",
            priority: 70,
            async canRun(ctx) {
                const open = await ctx.adapter.queryTarget(
                    targets.openInNewTab,
                    ctx.signal,
                );
                return { allowed: open.found };
            },
            async buildAction() {
                return {
                    id: "action-open-in-new-tab",
                    kind: "CLICK_AND_ADOPT_NEW_PAGE",
                    target: targets.openInNewTab,
                };
            },
        },
        // open attendance popup
        {
            id: "open-attendance-popup",
            from: "GAME_RUNNING",
            to: "ATTENDANCE_POPUP_OPEN",
            priority: 30,
            async canRun(ctx) {
                const player = await ctx.adapter.queryTarget(
                    targets.gameHost,
                    ctx.signal,
                );

                if (!player.found || player.visible !== true) {
                    return {
                        allowed: false,
                        reason: "Game host not ready for attendance click",
                    };
                }

                const abortReason =
                    ctx.variables.ATTENDANCE_ABORT_REASON?.trim();
                if (abortReason) {
                    return {
                        allowed: false,
                        reason: `Attendance flow aborted: ${abortReason}`,
                    };
                }

                const retryCount = readIntVar(ctx, "ATTENDANCE_RETRY_COUNT", 0);
                if (retryCount >= ATTENDANCE_MAX_RETRY) {
                    markAttendanceAborted(
                        ctx,
                        ctx.variables.ATTENDANCE_LAST_FAILURE_KIND?.trim() ||
                            "attendance_max_retry_exceeded",
                    );

                    return {
                        allowed: false,
                        reason: "Attendance max retry exceeded",
                        meta: {
                            retryCount,
                            maxRetry: ATTENDANCE_MAX_RETRY,
                        },
                    };
                }

                const armed = ctx.variables.ATTENDANCE_VERIFY_ARMED === "true";

                // Đang trong verify window sau click → chưa retry ngay
                if (armed) {
                    const deadline = readIntVar(
                        ctx,
                        "ATTENDANCE_VERIFY_DEADLINE_ITERATION",
                        0,
                    );

                    if (ctx.iteration <= deadline) {
                        return {
                            allowed: false,
                            reason: "Waiting attendance popup verify window",
                            meta: {
                                verifyDeadlineIteration: deadline,
                                currentIteration: ctx.iteration,
                            },
                        };
                    }

                    // Hết verify window mà popup vẫn chưa mở → classify CLICK_NO_POPUP
                    const nextRetry = registerAttendanceRetry(
                        ctx,
                        "attendance_click_no_popup",
                    );

                    setVar(ctx, "ATTENDANCE_VERIFY_ARMED", "false");
                    setVar(ctx, "ATTENDANCE_VERIFY_ARMED_AT_ITERATION", "");
                    setVar(ctx, "ATTENDANCE_VERIFY_DEADLINE_ITERATION", "");

                    if (nextRetry >= ATTENDANCE_MAX_RETRY) {
                        markAttendanceAborted(
                            ctx,
                            "attendance_click_no_popup_max_retry",
                        );

                        return {
                            allowed: false,
                            reason: "Attendance click did not open popup within retry budget",
                            meta: {
                                retryCount: nextRetry,
                                maxRetry: ATTENDANCE_MAX_RETRY,
                            },
                        };
                    }

                    return {
                        allowed: true,
                        reason: "Retry attendance after popup verify timeout",
                        meta: {
                            retryCount: nextRetry,
                            maxRetry: ATTENDANCE_MAX_RETRY,
                        },
                    };
                }

                return {
                    allowed: true,
                    meta: {
                        retryCount,
                        maxRetry: ATTENDANCE_MAX_RETRY,
                    },
                };
            },
            async buildAction(ctx) {
                // đảm bảo retry counter luôn tồn tại
                if (ctx.setVariable) {
                    if (!ctx.variables.ATTENDANCE_RETRY_COUNT) {
                        ctx.setVariable("ATTENDANCE_RETRY_COUNT", "0");
                    }

                    ctx.setVariable(
                        "ATTENDANCE_VERIFY_WINDOW_ITERATIONS",
                        String(ATTENDANCE_VERIFY_WINDOW_ITERATIONS),
                    );
                }
                return {
                    id: "action-open-attendance-popup",
                    kind: "COMPOSITE",
                    actions: [
                        {
                            id: "wait-before-attendance",
                            kind: "WAIT",
                            durationMs: 2500,
                        },
                        {
                            id: "focus-game-host",
                            kind: "FOCUS",
                            target: targets.gameHost,
                        },
                        {
                            kind: "CLICK_FROM_DETECTION",
                            id: "click-attendance-hotspot",
                            screenshotBefore: true,
                            screenshotAfter: true,
                            detectTarget: attendanceIconDetector.detect,
                        },
                        {
                            id: "move-pointer-away-after-attendance-click",
                            kind: "MOVE_RELATIVE_POINT",
                            xRatio: 0.08,
                            yRatio: 0.92,
                            description:
                                "Move pointer away from attendance hotspot",
                        },
                        {
                            id: "wait-attendance-popup",
                            kind: "WAIT",
                            durationMs: 200,
                        },
                        {
                            id: "wait-attendance-popup",
                            kind: "WAIT",
                            durationMs: 700,
                        },
                    ],
                };
            },
        },
        // claim daily attendance
        {
            id: "claim-attendance-daily",
            from: "ATTENDANCE_DAILY_READY",
            to: "ATTENDANCE_DAILY_REWARD_POPUP_OPEN",
            priority: 50,
            async buildAction() {
                return {
                    id: "action-claim-attendance-daily",
                    kind: "CLICK_FROM_DETECTION",
                    screenshotBefore: true,
                    screenshotAfter: true,
                    detectTarget: attendanceTodayClaimableDetector.detect,
                };
            },
        },
        // close daily reward popup
        {
            id: "close-attendance-daily-reward-popup",
            from: "ATTENDANCE_DAILY_REWARD_POPUP_OPEN",
            to: "ATTENDANCE_POPUP_OPEN",
            priority: 55,
            async buildAction() {
                return {
                    id: "action-close-attendance-daily-reward-popup",
                    kind: "CLICK_FROM_DETECTION",
                    screenshotBefore: true,
                    screenshotAfter: true,
                    detectTarget:
                        attendanceDailyRewardPopupCloseDetector.detect,
                };
            },
        },
        // handoff after daily done -> continue milestone evaluation
        {
            id: "advance-after-attendance-daily-done",
            from: "ATTENDANCE_DAILY_DONE",
            to: "ATTENDANCE_POPUP_OPEN",
            priority: 46,
            async canRun() {
                return { allowed: true };
            },
            async buildAction(ctx) {
                if (ctx.setVariable) {
                    ctx.setVariable("ATTENDANCE_MILESTONE_PHASE", "true");
                }
                return {
                    id: "action-advance-after-attendance-daily-done",
                    kind: "WAIT",
                    durationMs: 100,
                };
            },
        },
        // claim attendance milestone
        {
            id: "claim-attendance-milestone",
            from: "ATTENDANCE_MILESTONE_READY",
            to: "ATTENDANCE_POPUP_OPEN",
            priority: 45,
            async buildAction(ctx) {
                if (ctx.setVariable) {
                    ctx.setVariable("ATTENDANCE_MILESTONE_PHASE", "true");
                    ctx.setVariable("ATTENDANCE_CLOSE_PHASE", "false");
                }

                return {
                    id: "action-claim-attendance-milestone",
                    kind: "CLICK_FROM_DETECTION",
                    screenshotBefore: true,
                    screenshotAfter: true,
                    detectTarget: attendanceMilestoneClaimableDetector.detect,
                    // CLICK_FROM_DETECTION automatically uses matchBox center or metadata.clickPoint if available
                };
            },
        },

        //ATTENDANCE_MILESTONE_DONE
        {
            id: "prepare-close-attendance-popup",
            from: "ATTENDANCE_MILESTONE_DONE",
            to: "ATTENDANCE_CLOSE_READY",
            priority: 44,
            async canRun() {
                return { allowed: true };
            },
            async buildAction(ctx) {
                if (ctx.setVariable) {
                    ctx.setVariable("ATTENDANCE_CLOSE_PHASE", "true");
                }
                return {
                    id: "action-prepare-close-attendance-popup",
                    kind: "WAIT",
                    durationMs: 100,
                };
            },
        },
        //close attendance popup
        {
            id: "close-attendance-popup",
            from: "ATTENDANCE_CLOSE_READY",
            to: "GAME_RUNNING",
            priority: 40,
            async buildAction(ctx) {
                if (ctx.setVariable) {
                    ctx.setVariable(
                        "ATTENDANCE_CLOSE_ATTEMPT",
                        String(
                            readIntVar(ctx, "ATTENDANCE_CLOSE_ATTEMPT", 0) + 1,
                        ),
                    );
                }

                return {
                    id: "action-close-attendance-popup",
                    kind: "CLICK_FROM_DETECTION",
                    screenshotBefore: true,
                    screenshotAfter: true,
                    detectTarget: attendancePopupCloseButtonDetector.detect,
                };
            },
            async verifyAfterRun(ctx) {
                const player = await ctx.adapter.queryTarget(
                    targets.gameHost,
                    ctx.signal,
                );

                if (
                    player.found &&
                    player.visible === true &&
                    ctx.setVariable
                ) {
                    setVar(ctx, "ATTENDANCE_MILESTONE_PHASE", "false");
                    setVar(ctx, "ATTENDANCE_POPUP_CONFIRMED", "false");
                    setVar(ctx, "ATTENDANCE_CLOSE_PHASE", "false");
                    markAttendanceFlowSuccess(ctx);
                    return true;
                }

                return false;
            },
        },
    ],
};
