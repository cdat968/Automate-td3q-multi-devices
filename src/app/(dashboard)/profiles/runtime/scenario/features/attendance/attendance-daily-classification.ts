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
