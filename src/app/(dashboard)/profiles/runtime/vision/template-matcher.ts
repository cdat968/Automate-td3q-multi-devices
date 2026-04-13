import cv from "@u4/opencv4nodejs";
import type { Mat, Rect } from "@u4/opencv4nodejs";

export interface MatchResult {
    matched: boolean;
    score: number;
    location?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface TemplateMatchRoi {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
}

export interface MatchTemplateOptions {
    roi?: TemplateMatchRoi;
    scales?: number[];
    threshold?: number;
}

/**
 * Backward-compatible default ROI.
 * Historically tuned for attendance-close detection near the top-right area.
 */
const DEFAULT_ROI: TemplateMatchRoi = {
    xRatio: 0.65,
    yRatio: 0.02,
    widthRatio: 0.3,
    heightRatio: 0.25,
};

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function resolveRoiRect(screenshot: Mat, roi?: TemplateMatchRoi): Rect {
    const effective = roi ?? DEFAULT_ROI;

    const x = Math.floor(screenshot.cols * effective.xRatio);
    const y = Math.floor(screenshot.rows * effective.yRatio);
    const width = Math.floor(screenshot.cols * effective.widthRatio);
    const height = Math.floor(screenshot.rows * effective.heightRatio);

    const safeX = clamp(x, 0, Math.max(0, screenshot.cols - 1));
    const safeY = clamp(y, 0, Math.max(0, screenshot.rows - 1));
    const safeWidth = clamp(width, 1, screenshot.cols - safeX);
    const safeHeight = clamp(height, 1, screenshot.rows - safeY);

    return new cv.Rect(safeX, safeY, safeWidth, safeHeight);
}

export function matchTemplateMultiScale(
    screenshotBuffer: Buffer,
    templateBuffer: Buffer,
    options?: MatchTemplateOptions,
): MatchResult {
    const screenshot = cv.imdecode(screenshotBuffer);
    const template = cv.imdecode(templateBuffer);

    const roiRect = resolveRoiRect(screenshot, options?.roi);
    const roi = screenshot.getRegion(roiRect);

    const scales = options?.scales ?? [0.9, 1.0, 1.1];
    const threshold = options?.threshold ?? 0.83;

    let bestScore = -1;
    let bestLoc:
        | {
              x: number;
              y: number;
              width: number;
              height: number;
          }
        | undefined;

    for (const scale of scales) {
        const resized = template.resize(
            Math.round(template.rows * scale),
            Math.round(template.cols * scale),
        );

        if (resized.cols > roi.cols || resized.rows > roi.rows) {
            continue;
        }

        const result = roi.matchTemplate(resized, cv.TM_CCOEFF_NORMED);
        const { maxVal, maxLoc } = result.minMaxLoc();

        if (maxVal > bestScore) {
            bestScore = maxVal;
            bestLoc = {
                x: maxLoc.x + roiRect.x,
                y: maxLoc.y + roiRect.y,
                width: resized.cols,
                height: resized.rows,
            };
        }
    }

    return {
        matched: bestScore > threshold,
        score: bestScore,
        location: bestLoc,
    };
}

// export interface MatchResult {
//     matched: boolean;
//     score: number;
//     location?: {
//         x: number;
//         y: number;
//         width: number;
//         height: number;
//     };
// }

// export function matchTemplateMultiScale(
//     screenshotBuffer: Buffer,
//     templateBuffer: Buffer,
// ): MatchResult {
//     const screenshot = cv.imdecode(screenshotBuffer);
//     const template = cv.imdecode(templateBuffer);

//     // 🔥 ROI (tuned theo ảnh bạn gửi)
//     const roiRect = new cv.Rect(
//         Math.floor(screenshot.cols * 0.65),
//         Math.floor(screenshot.rows * 0.02),
//         Math.floor(screenshot.cols * 0.3),
//         Math.floor(screenshot.rows * 0.25),
//     );

//     const roi = screenshot.getRegion(roiRect);

//     const scales = [0.9, 1.0, 1.1];
//     let bestScore = -1;
//     let bestLoc;

//     for (const scale of scales) {
//         const resized = template.resize(
//             Math.round(template.rows * scale),
//             Math.round(template.cols * scale),
//         );

//         if (resized.cols > roi.cols || resized.rows > roi.rows) continue;

//         const result = roi.matchTemplate(resized, cv.TM_CCOEFF_NORMED);

//         const { maxVal, maxLoc } = result.minMaxLoc();

//         if (maxVal > bestScore) {
//             bestScore = maxVal;
//             bestLoc = {
//                 x: maxLoc.x + roiRect.x,
//                 y: maxLoc.y + roiRect.y,
//                 width: resized.cols,
//                 height: resized.rows,
//             };
//         }
//     }

//     return {
//         matched: bestScore > 0.83,
//         score: bestScore,
//         location: bestLoc,
//     };
// }
