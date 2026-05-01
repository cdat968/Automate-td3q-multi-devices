import { AttendanceConfig } from "./attendance-config";

import {
    buildInnerRect,
    clampBoxToBounds,
    computeCyanRatioFromBuffer,
    cropAbsoluteRectFromScreenshot,
    decodePng,
    splitRectIntoGrid,
} from "../../visual";

import type { GridCellBox, PixelBox } from "../../visual";

export type { GridCellBox, PixelBox } from "../../visual";

export {
    clampBoxToBounds,
    pixelBoxToRatioRoi,
    decodePng,
    cropAbsoluteRectFromScreenshot,
    computeCyanRatioFromBuffer,
    buildInnerRect,
    splitRectIntoGrid,
    matchTemplateInPixelBox,
} from "../../visual";

const ATTENDANCE_GRID_COLS = AttendanceConfig.dailyGrid.cols;
const ATTENDANCE_GRID_ROWS = AttendanceConfig.dailyGrid.rows;
export const ATTENDANCE_CELL_MATCH_THRESHOLD =
    AttendanceConfig.dailyGrid.cyanMatchThreshold;
export const ATTENDANCE_CELL_WINNER_MARGIN =
    AttendanceConfig.dailyGrid.cyanWinnerMargin;


export function resolveAttendanceGridBoxFromPopupHeader(
    headerBox: PixelBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    /**
     * popup-relative grid ROI
     * Tune tại đây nếu cần, không còn hardcode theo full-screen nữa.
     */
    const grid = AttendanceConfig.dailyGrid.popupRelativeGridBox;

    const gridBox = {
        x: Math.round(
            headerBox.x + headerBox.width * grid.xOffsetByHeaderWidth,
        ),
        y: Math.round(
            headerBox.y + headerBox.height * grid.yOffsetByHeaderHeight,
        ),
        width: Math.round(headerBox.width * grid.widthByHeaderWidth),
        height: Math.round(headerBox.height * grid.heightByHeaderHeight),
    };

    return clampBoxToBounds(gridBox, screenshotWidth, screenshotHeight);
}

export function buildAttendanceGridCellsFromGridBox(
    gridBox: PixelBox,
): GridCellBox[] {
    return splitRectIntoGrid(gridBox, ATTENDANCE_GRID_COLS, ATTENDANCE_GRID_ROWS);
}

export function buildInnerCellBox(
    cell: GridCellBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    const sampleBox = AttendanceConfig.dailyGrid.cyanSampleBoxInCell;

    return buildInnerRect(
        cell,
        sampleBox,
        screenshotWidth,
        screenshotHeight,
    );
}

export function scanAttendanceGridFromPopupHeader(
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


export function buildTomorrowMarkerBox(
    cell: GridCellBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    const markerBox = AttendanceConfig.dailyGrid.tomorrowMarkerBoxInCell;

    return buildInnerRect(
        cell,
        markerBox,
        screenshotWidth,
        screenshotHeight,
    );
}

export function buildTickCheckBox(
    cell: GridCellBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    const tickBox = AttendanceConfig.dailyGrid.tickBoxInCell;

    return buildInnerRect(
        cell,
        tickBox,
        screenshotWidth,
        screenshotHeight,
    );
}


