import { pixelBoxToRatioRoi } from "./roi-utils";
import { PixelBox } from "./visual-types";
import { matchTemplateMultiScale } from "@runtime/vision/template-matcher";

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
