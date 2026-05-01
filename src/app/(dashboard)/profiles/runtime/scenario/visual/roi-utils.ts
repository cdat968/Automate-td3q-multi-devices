import { PixelBox } from "./visual-types";

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

export function buildInnerRect(
    outerBox: PixelBox,
    relativeInnerBox: { x: number; y: number; width: number; height: number },
    screenshotWidth: number,
    screenshotHeight: number,
): PixelBox {
    return clampBoxToBounds(
        {
            x: outerBox.x + Math.floor(outerBox.width * relativeInnerBox.x),
            y: outerBox.y + Math.floor(outerBox.height * relativeInnerBox.y),
            width: Math.max(1, Math.floor(outerBox.width * relativeInnerBox.width)),
            height: Math.max(1, Math.floor(outerBox.height * relativeInnerBox.height)),
        },
        screenshotWidth,
        screenshotHeight,
    );
}
