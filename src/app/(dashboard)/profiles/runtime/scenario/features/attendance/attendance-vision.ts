import { PNG } from "pngjs";
import { AttendanceConfig } from "./attendance-config";
import { matchTemplateMultiScale } from "../../../vision/template-matcher";

const ATTENDANCE_GRID_COLS = AttendanceConfig.dailyGrid.cols;
const ATTENDANCE_GRID_ROWS = AttendanceConfig.dailyGrid.rows;
export const ATTENDANCE_CELL_MATCH_THRESHOLD =
    AttendanceConfig.dailyGrid.cyanMatchThreshold;
export const ATTENDANCE_CELL_WINNER_MARGIN =
    AttendanceConfig.dailyGrid.cyanWinnerMargin;

export type GridCellBox = {
    x: number;
    y: number;
    width: number;
    height: number;
    row: number;
    col: number;
    index: number;
};

export type PixelBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function isCyanLike(r: number, g: number, b: number): boolean {
    return g > 120 && b > 120 && r < 100 && Math.abs(g - b) < 80;
}

export function decodePng(buffer: Buffer) {
    const png = PNG.sync.read(buffer);

    return {
        data: png.data, // RGBA
        width: png.width,
        height: png.height,
    };
}

export function computeCyanRatioFromBuffer(buffer: Buffer): number {
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

export function clampBoxToBounds(
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

export function cropAbsoluteRectFromScreenshot(
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

export function buildInnerCellBox(
    cell: GridCellBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    const sampleBox = AttendanceConfig.dailyGrid.cyanSampleBoxInCell;

    return clampBoxToBounds(
        {
            x: cell.x + Math.floor(cell.width * sampleBox.x),
            y: cell.y + Math.floor(cell.height * sampleBox.y),
            width: Math.max(1, Math.floor(cell.width * sampleBox.width)),
            height: Math.max(1, Math.floor(cell.height * sampleBox.height)),
        },
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

export function pixelBoxToRatioRoi(
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

export function buildTomorrowMarkerBox(
    cell: GridCellBox,
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    const markerBox = AttendanceConfig.dailyGrid.tomorrowMarkerBoxInCell;

    return clampBoxToBounds(
        {
            x: cell.x + Math.floor(cell.width * markerBox.x),
            y: cell.y + Math.floor(cell.height * markerBox.y),
            width: Math.max(1, Math.floor(cell.width * markerBox.width)),
            height: Math.max(1, Math.floor(cell.height * markerBox.height)),
        },
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

    return clampBoxToBounds(
        {
            x: cell.x + Math.floor(cell.width * tickBox.x),
            y: cell.y + Math.floor(cell.height * tickBox.y),
            width: Math.max(1, Math.floor(cell.width * tickBox.width)),
            height: Math.max(1, Math.floor(cell.height * tickBox.height)),
        },
        screenshotWidth,
        screenshotHeight,
    );
}

export function matchTemplateInPixelBox(
    screenshotBuffer: Buffer,
    templateBuffer: Buffer,
    screenshotWidth: number,
    screenshotHeight: number,
    box: PixelBox,
    threshold: number,
    scales: readonly number[],
) {
    return matchTemplateMultiScale(screenshotBuffer, templateBuffer, {
        roi: pixelBoxToRatioRoi(box, screenshotWidth, screenshotHeight),
        threshold,
        scales: [...scales],
    });
}
