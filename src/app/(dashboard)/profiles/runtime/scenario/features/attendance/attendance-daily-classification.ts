import {
    DiagnosticAttachment,
    DiagnosticOverlayMeta,
} from "../../../../diagnostics/diagnostic-types";

export type AttendanceDailyCellState = "READY" | "DONE" | "UNKNOWN";

export type AttendanceDailyCellClassification = {
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
        popupMatched?: boolean;
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

export function buildAttendanceSemanticDebugOverlay(
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
