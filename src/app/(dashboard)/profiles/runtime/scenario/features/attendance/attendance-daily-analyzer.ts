import type { ExecutionContext } from "../../scenario-types";
import type {
    DiagnosticAttachment,
    DiagnosticOverlayMeta,
} from "../../../../diagnostics/diagnostic-types";
import { AttendanceConfig } from "./attendance-config";
import {
    attendancePopupAnchorDetector,
    attendanceTodayCheckedTemplate,
    attendanceTomorrowReceiveTemplate,
} from "./attendance-detectors";
import {
    buildInnerCellBox,
    buildTickCheckBox,
    buildTomorrowMarkerBox,
    computeCyanRatioFromBuffer,
    cropAbsoluteRectFromScreenshot,
    decodePng,
    matchTemplateInPixelBox,
    scanAttendanceGridFromPopupHeader,
    type GridCellBox,
    type PixelBox,
} from "./attendance-vision";

export type AttendanceDailyAnalysisStatus =
    | "OK"
    | "POPUP_ANCHOR_NOT_MATCHED"
    | "NO_SCREENSHOT";

export type AttendanceDailyAnalysisFacts = {
    popupMatched: boolean;
    popupMatchBox?: PixelBox;

    screenshotWidth?: number;
    screenshotHeight?: number;

    gridBox?: PixelBox;
    cells: GridCellBox[];
    found: boolean;
    bestCell?: GridCellBox;
    bestCellIndex?: number;
    bestRatio: number;
    secondBestRatio: number;
    winnerMargin: number;

    tomorrowCell?: GridCellBox;
    tomorrowCellIndex?: number;
    tomorrowScore: number;
    tomorrowMarkerBox?: PixelBox;

    todayCell?: GridCellBox;
    todayCellIndex?: number;

    cyanRatio: number;

    tickMatched: boolean;
    tickScore: number;
    tickBox?: PixelBox;
};

export type AttendanceDailyAnalysisDebug = {
    tomorrowOverlayShapes: DiagnosticOverlayMeta["shapes"];
    checkinOverlayShapes: DiagnosticOverlayMeta["shapes"];
    tickOverlayShapes: DiagnosticOverlayMeta["shapes"];
};

export type AttendanceDailyAnalysisEvidence = {
    screenshotPath?: string;
    attachments?: DiagnosticAttachment[];
    overlays?: DiagnosticOverlayMeta[];
};

export type AttendanceDailyAnalysis = {
    status: AttendanceDailyAnalysisStatus;
    facts: AttendanceDailyAnalysisFacts;
    debug: AttendanceDailyAnalysisDebug;
    evidence: AttendanceDailyAnalysisEvidence;
};

function createEmptyFacts(params: {
    popupMatched: boolean;
    popupMatchBox?: PixelBox;
}): AttendanceDailyAnalysisFacts {
    return {
        popupMatched: params.popupMatched,
        popupMatchBox: params.popupMatchBox,

        cells: [],
        found: false,
        bestRatio: 0,
        secondBestRatio: 0,
        winnerMargin: 0,

        tomorrowScore: 0,
        cyanRatio: 0,

        tickMatched: false,
        tickScore: 0,
    };
}

function createEmptyDebug(): AttendanceDailyAnalysisDebug {
    return {
        tomorrowOverlayShapes: [],
        checkinOverlayShapes: [],
        tickOverlayShapes: [],
    };
}

export async function analyzeAttendanceDaily(
    ctx: ExecutionContext,
): Promise<AttendanceDailyAnalysis> {
    const popup = await attendancePopupAnchorDetector.detect(ctx);

    const popupEvidence: AttendanceDailyAnalysisEvidence = {
        screenshotPath: popup.screenshotPath,
        attachments: popup.attachments,
        overlays: popup.overlays,
    };

    if (!popup.matched || !popup.matchBox) {
        return {
            status: "POPUP_ANCHOR_NOT_MATCHED",
            facts: createEmptyFacts({
                popupMatched: popup.matched,
                popupMatchBox: popup.matchBox,
            }),
            debug: createEmptyDebug(),
            evidence: popupEvidence,
        };
    }

    const raw = await ctx.adapter.screenshot?.(ctx.signal);

    if (!raw) {
        return {
            status: "NO_SCREENSHOT",
            facts: createEmptyFacts({
                popupMatched: popup.matched,
                popupMatchBox: popup.matchBox,
            }),
            debug: createEmptyDebug(),
            evidence: popupEvidence,
        };
    }

    const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    const { width, height } = decodePng(buffer);

    const scan = scanAttendanceGridFromPopupHeader(buffer, popup.matchBox);

    console.log(
        "[ATTENDANCE][CLASSIFY_START]",
        JSON.stringify({
            screenshotPath: popupEvidence.screenshotPath,
            screenshotWidth: width,
            screenshotHeight: height,
            popupMatchBox: popup.matchBox,
            scanGridBox: scan.gridBox,
            bestCellIndex: scan.bestCell?.index,
            bestRatio: Number(scan.bestRatio.toFixed(4)),
            totalCells: scan.cells.length,
        }),
    );

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
                AttendanceConfig.dailyGrid.tomorrowMarkerMatch.threshold,
                AttendanceConfig.dailyGrid.tomorrowMarkerMatch.scales,
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
                    threshold:
                        AttendanceConfig.dailyGrid.tomorrowMarkerMatch
                            .threshold,
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
            threshold: AttendanceConfig.dailyGrid.tomorrowMarkerMatch.threshold,
            found: tomorrowCell ? true : false,
            tomorrowCellIndex: tomorrowCell?.index ?? null,
        }),
    );

    let todayCell: GridCellBox | undefined;

    if (tomorrowCell && tomorrowCell.index > 0) {
        todayCell = scan.cells[tomorrowCell.index - 1];
    }

    console.log(
        "[ATTENDANCE][CELL_RESOLUTION]",
        JSON.stringify({
            todayCellIndex: todayCell?.index ?? null,
            tomorrowCellIndex: tomorrowCell?.index ?? null,
            bestCellIndex: scan.bestCell?.index ?? null,
            bestRatio: Number(scan.bestRatio.toFixed(4)),
            totalCells: scan.cells.length,
            scanGridBox: scan.gridBox,
            popupMatchBox: popup.matchBox,
        }),
    );

    let cyanRatio = 0;
    let tickMatched = false;
    let tickScore = 0;
    let tickBox: PixelBox | undefined;

    const checkinOverlayShapes: DiagnosticOverlayMeta["shapes"] = [];
    const tickOverlayShapes: DiagnosticOverlayMeta["shapes"] = [];

    if (todayCell) {
        const todayInner = buildInnerCellBox(todayCell, width, height);

        checkinOverlayShapes.push({
            type: "box",
            x: todayInner.x,
            y: todayInner.y,
            width: todayInner.width,
            height: todayInner.height,
            color: "red",
            label: "checkin-roi",
            lineWidth: 4,
        });

        const todayInnerBuffer = cropAbsoluteRectFromScreenshot(
            buffer,
            todayInner,
        );

        cyanRatio = computeCyanRatioFromBuffer(todayInnerBuffer);

        tickBox = buildTickCheckBox(todayCell, width, height);

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
                tickBox,
                cyanRatio: Number(cyanRatio.toFixed(4)),
                enteringTickEvaluation: true,
            }),
        );

        tickOverlayShapes.push({
            type: "box",
            x: tickBox.x,
            y: tickBox.y,
            width: tickBox.width,
            height: tickBox.height,
            color: "orange",
            label: "ticket-roi",
            lineWidth: 6,
        });

        const tickResult = matchTemplateInPixelBox(
            buffer,
            attendanceTodayCheckedTemplate,
            width,
            height,
            tickBox,
            AttendanceConfig.dailyGrid.tickMatch.threshold,
            AttendanceConfig.dailyGrid.tickMatch.scales,
        );

        tickMatched = tickResult.matched;
        tickScore = tickResult.score;

        console.log(
            "[ATTENDANCE][TICK_CHECK]",
            JSON.stringify({
                todayCellIndex: todayCell.index,
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                threshold: AttendanceConfig.dailyGrid.tickMatch.threshold,
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

    return {
        status: "OK",
        facts: {
            popupMatched: popup.matched,
            popupMatchBox: popup.matchBox,

            screenshotWidth: width,
            screenshotHeight: height,

            gridBox: scan.gridBox,
            cells: scan.cells,
            found: scan.found,
            bestCell: scan.bestCell,
            bestCellIndex: scan.bestCell?.index,
            bestRatio: scan.bestRatio,
            secondBestRatio: scan.secondBestRatio,
            winnerMargin: scan.winnerMargin,

            tomorrowCell,
            tomorrowCellIndex: tomorrowCell?.index,
            tomorrowScore,
            tomorrowMarkerBox: matchedTomorrowMarkerBox,

            todayCell,
            todayCellIndex: todayCell?.index,

            cyanRatio,

            tickMatched,
            tickScore,
            tickBox,
        },
        debug: {
            tomorrowOverlayShapes,
            checkinOverlayShapes,
            tickOverlayShapes,
        },
        evidence: {
            screenshotPath: popupEvidence.screenshotPath,
            attachments: popupEvidence.attachments,
        },
    };
}
