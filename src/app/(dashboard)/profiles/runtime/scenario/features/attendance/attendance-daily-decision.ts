import { AttendanceConfig } from "./attendance-config";
import type { AttendanceDailyAnalysis } from "./attendance-daily-analyzer";
import type { AttendanceDailyCellClassification } from "./attendance-daily-classification";

type BoxLike = {
    x: number;
    y: number;
    width: number;
    height: number;
};

function toBoxMeta(box: BoxLike | undefined) {
    if (!box) return undefined;

    return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
    };
}

function round4(value: number | undefined): number | undefined {
    if (typeof value !== "number") return undefined;
    return Number(value.toFixed(4));
}

function buildDailyMeta(
    analysis: AttendanceDailyAnalysis,
): AttendanceDailyCellClassification["meta"] {
    const { facts } = analysis;

    return {
        todayCellIndex: facts.todayCellIndex,
        tomorrowCellIndex: facts.tomorrowCellIndex,
        cyanRatio: round4(facts.cyanRatio),
        tickMatched: facts.tickMatched,
        tickScore: round4(facts.tickScore),
        tomorrowMatched: Boolean(facts.tomorrowCell),
        tomorrowScore: round4(facts.tomorrowScore),
        gridBestRatio: round4(facts.bestRatio),
        bestCellIndex: facts.bestCellIndex,
        todayCellBox: toBoxMeta(facts.todayCell),
        tomorrowCellBox: toBoxMeta(facts.tomorrowCell),
        tickBox: toBoxMeta(facts.tickBox),
        tomorrowMarkerBox: toBoxMeta(facts.tomorrowMarkerBox),
    };
}

function resolveDailyMatchBox(
    analysis: AttendanceDailyAnalysis,
): AttendanceDailyCellClassification["matchBox"] {
    const { facts } = analysis;

    return toBoxMeta(facts.todayCell) ?? toBoxMeta(facts.bestCell);
}

function withEvidence(
    analysis: AttendanceDailyAnalysis,
    classification: Omit<
        AttendanceDailyCellClassification,
        "screenshotPath" | "attachments" | "overlays"
    >,
): AttendanceDailyCellClassification {
    return {
        ...classification,
        screenshotPath: analysis.evidence.screenshotPath,
        attachments: analysis.evidence.attachments,
        overlays: analysis.evidence.overlays,
    };
}

function logAndReturn(
    analysis: AttendanceDailyAnalysis,
    classification: AttendanceDailyCellClassification,
): AttendanceDailyCellClassification {
    console.log(
        "[ATTENDANCE][CLASSIFY_DECISION]",
        JSON.stringify({
            state: classification.state,
            reason: classification.reason,
            analysisStatus: analysis.status,
            todayCellIndex: classification.meta.todayCellIndex,
            tomorrowCellIndex: classification.meta.tomorrowCellIndex,
            tickMatched: classification.meta.tickMatched,
            tickScore: classification.meta.tickScore,
            tomorrowScore: classification.meta.tomorrowScore,
            cyanRatio: classification.meta.cyanRatio,
            bestCellIndex: classification.meta.bestCellIndex,
            bestRatio: classification.meta.gridBestRatio,
        }),
    );

    return classification;
}

export function decideAttendanceDailyState(
    analysis: AttendanceDailyAnalysis,
): AttendanceDailyCellClassification {
    const { facts } = analysis;

    if (analysis.status === "POPUP_ANCHOR_NOT_MATCHED") {
        return logAndReturn(
            analysis,
            withEvidence(analysis, {
                state: "UNKNOWN",
                reason: "popup_anchor_not_matched",
                meta: {
                    popupMatched: facts.popupMatched,
                },
                matchBox: facts.popupMatchBox,
            }),
        );
    }

    if (analysis.status === "NO_SCREENSHOT") {
        return logAndReturn(
            analysis,
            withEvidence(analysis, {
                state: "UNKNOWN",
                reason: "no_screenshot",
                meta: {
                    popupMatched: facts.popupMatched,
                },
                matchBox: facts.popupMatchBox,
            }),
        );
    }

    const ATTENDANCE_CELL_MATCH_THRESHOLD =
        AttendanceConfig.dailyGrid.cyanMatchThreshold;

    const ATTENDANCE_TODAY_BEST_CELL_FALLBACK_THRESHOLD =
        AttendanceConfig.dailyGrid.bestCellFallbackThreshold;

    if (facts.todayCell && facts.tickMatched) {
        return logAndReturn(
            analysis,
            withEvidence(analysis, {
                state: "DONE",
                reason: "semantic_tick_on_today_cell",
                meta: buildDailyMeta(analysis),
                matchBox: toBoxMeta(facts.todayCell),
            }),
        );
    }

    if (facts.todayCell && facts.cyanRatio >= ATTENDANCE_CELL_MATCH_THRESHOLD) {
        return logAndReturn(
            analysis,
            withEvidence(analysis, {
                state: "READY",
                reason: "semantic_cyan_on_today_cell",
                meta: buildDailyMeta(analysis),
                matchBox: toBoxMeta(facts.todayCell),
            }),
        );
    }

    if (
        facts.todayCell &&
        facts.tomorrowCell &&
        !facts.tickMatched &&
        facts.bestRatio < ATTENDANCE_TODAY_BEST_CELL_FALLBACK_THRESHOLD
    ) {
        return logAndReturn(
            analysis,
            withEvidence(analysis, {
                state: "DONE",
                reason: "semantic_today_resolved_not_claimable",
                meta: buildDailyMeta(analysis),
                matchBox: toBoxMeta(facts.todayCell),
            }),
        );
    }

    if (
        !facts.todayCell &&
        facts.bestCell &&
        facts.bestRatio >= ATTENDANCE_TODAY_BEST_CELL_FALLBACK_THRESHOLD
    ) {
        return logAndReturn(
            analysis,
            withEvidence(analysis, {
                state: "READY",
                reason: "fallback_best_cyan_cell",
                meta: buildDailyMeta(analysis),
                matchBox: toBoxMeta(facts.bestCell),
            }),
        );
    }

    if (!facts.tomorrowCell && !facts.found) {
        return logAndReturn(
            analysis,
            withEvidence(analysis, {
                state: "DONE",
                reason: "fallback_no_tomorrow_no_cyan",
                meta: buildDailyMeta(analysis),
                matchBox: resolveDailyMatchBox(analysis),
            }),
        );
    }

    return logAndReturn(
        analysis,
        withEvidence(analysis, {
            state: "UNKNOWN",
            reason: facts.tomorrowCell
                ? "semantic_today_cell_unresolved"
                : "no_semantic_marker_and_no_fallback_match",
            meta: buildDailyMeta(analysis),
            matchBox: resolveDailyMatchBox(analysis),
        }),
    );
}
