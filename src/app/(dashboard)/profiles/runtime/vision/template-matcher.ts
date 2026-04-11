import cv from "@u4/opencv4nodejs";

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

export function matchTemplateMultiScale(
    screenshotBuffer: Buffer,
    templateBuffer: Buffer,
): MatchResult {
    const screenshot = cv.imdecode(screenshotBuffer);
    const template = cv.imdecode(templateBuffer);

    // 🔥 ROI (tuned theo ảnh bạn gửi)
    const roiRect = new cv.Rect(
        Math.floor(screenshot.cols * 0.65),
        Math.floor(screenshot.rows * 0.02),
        Math.floor(screenshot.cols * 0.3),
        Math.floor(screenshot.rows * 0.25),
    );

    const roi = screenshot.getRegion(roiRect);

    const scales = [0.9, 1.0, 1.1];
    let bestScore = -1;
    let bestLoc;

    for (const scale of scales) {
        const resized = template.resize(
            Math.round(template.rows * scale),
            Math.round(template.cols * scale),
        );

        if (resized.cols > roi.cols || resized.rows > roi.rows) continue;

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
        matched: bestScore > 0.83,
        score: bestScore,
        location: bestLoc,
    };
}
