import { PNG } from "pngjs";
import { PixelBox } from "./visual-types";
import { clampBoxToBounds } from "./roi-utils";

export function decodePng(buffer: Buffer) {
    const png = PNG.sync.read(buffer);

    return {
        data: png.data, // RGBA
        width: png.width,
        height: png.height,
    };
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
