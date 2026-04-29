import type { DiagnosticOverlayMeta } from "../../../../diagnostics/diagnostic-types";
import type {
    OverlayColor,
    OverlayShape,
} from "../../../../diagnostics/overlay/overlay-types";
import type { AttendanceDailyAnalysis } from "./attendance-daily-analyzer";
import type { AttendanceDailyCellClassification } from "./attendance-daily-classification";

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
            lineWidth: 4,
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
            lineWidth: 4,
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
            lineWidth: 4,
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
            lineWidth: 4,
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

export function buildAttendanceDailyGridOverlay(
    analysis: AttendanceDailyAnalysis,
    classification: AttendanceDailyCellClassification,
): DiagnosticOverlayMeta[] {
    if (analysis.status !== "OK") {
        return analysis.evidence.overlays ?? [];
    }

    const { facts, debug, evidence } = analysis;
    const screenshotPath = evidence.screenshotPath;

    if (!screenshotPath || !facts.gridBox) {
        return [];
    }

    const gridRoiShape: OverlayShape = {
        type: "box",
        x: facts.gridBox.x,
        y: facts.gridBox.y,
        width: facts.gridBox.width,
        height: facts.gridBox.height,
        color: "blue",
        label: "attendance-grid-roi",
        lineWidth: 4,
    };

    const cellOverlayShapes: OverlayShape[] = facts.cells.map((cell) => {
        let color: OverlayColor = "white";
        let label = `cell #${cell.index}`;
        let lineWidth = 4;

        if (cell.index === classification.meta.todayCellIndex) {
            color = "green";
            label = `[TODAY] ${label}`;
            lineWidth = 4;
        } else if (cell.index === classification.meta.tomorrowCellIndex) {
            color = "yellow";
            label = `[TOMORROW] ${label}`;
            lineWidth = 4;
        } else if (cell.index === facts.bestCell?.index) {
            color = "orange";
            label = `[BEST] ${label}`;
            lineWidth = 4;
        }

        return {
            type: "box",
            x: cell.x,
            y: cell.y,
            width: cell.width,
            height: cell.height,
            color,
            label,
            lineWidth,
        };
    });

    const overlays: DiagnosticOverlayMeta[] = [
        {
            purpose: "debug_view",
            screenshotPath,
            shapes: [
                gridRoiShape,
                ...cellOverlayShapes,
                ...debug.tomorrowOverlayShapes,
                ...debug.checkinOverlayShapes,
                ...debug.tickOverlayShapes,
            ],
            renderNote: "attendance grid scan (all 30 cells)",
        },
    ];

    console.log(
        "[ATTENDANCE][GRID_OVERLAY_COUNTS]",
        JSON.stringify({
            baseCells: facts.cells.length,
            tomorrowOverlayCount: debug.tomorrowOverlayShapes.length,
            checkinOverlayCount: debug.checkinOverlayShapes.length,
            tickOverlayCount: debug.tickOverlayShapes.length,
            totalShapes: overlays[0]?.shapes?.length ?? 0,
        }),
    );

    console.log(
        "[ATTENDANCE][CLASSIFY_RETURN_OVERLAYS]",
        JSON.stringify(
            overlays.map((overlay, index) => ({
                index,
                purpose: overlay.purpose,
                screenshotPath: overlay.screenshotPath,
                shapeCount: overlay.shapes?.length ?? 0,
                labels: (overlay.shapes ?? [])
                    .filter((shape) => shape.type === "box")
                    .map((shape) =>
                        "label" in shape ? (shape.label ?? null) : null,
                    ),
            })),
            null,
            2,
        ),
    );

    return overlays;
}

export function attachAttendanceDailyEvidence(
    analysis: AttendanceDailyAnalysis,
    classification: AttendanceDailyCellClassification,
): AttendanceDailyCellClassification {
    if (analysis.status !== "OK") {
        return classification;
    }

    const overlays = buildAttendanceDailyGridOverlay(analysis, classification);

    return {
        ...classification,
        screenshotPath: analysis.evidence.screenshotPath,
        attachments: analysis.evidence.attachments,
        overlays,
    };
}
