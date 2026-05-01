import { PixelBox, GridCellBox } from "./visual-types";

export function splitRectIntoGrid(
    gridBox: PixelBox,
    cols: number,
    rows: number,
): GridCellBox[] {
    const baseCellWidth = Math.floor(gridBox.width / cols);
    const baseCellHeight = Math.floor(gridBox.height / rows);

    const cells: GridCellBox[] = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = gridBox.x + col * baseCellWidth;
            const y = gridBox.y + row * baseCellHeight;

            const width =
                col === cols - 1
                    ? gridBox.x + gridBox.width - x
                    : baseCellWidth;

            const height =
                row === rows - 1
                    ? gridBox.y + gridBox.height - y
                    : baseCellHeight;

            cells.push({
                x,
                y,
                width,
                height,
                row,
                col,
                index: row * cols + col,
            });
        }
    }

    return cells;
}
