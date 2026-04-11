import path from "path";
import { ensureParentDir } from "../../diagnostics/artifact/artifact-writer";
import { renderOverlayImage } from "../../diagnostics/overlay/overlay-renderer";
import { OverlayPayload } from "../../diagnostics/overlay/overlay-types";
// import { renderOverlayImage } from "./overlay-renderer";
// import type { OverlayPayload } from "./overlay-types";

interface RectLike {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface PointLike {
    x: number;
    y: number;
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function extractRectFromUnknown(input: unknown): RectLike | undefined {
    if (!input || typeof input !== "object") {
        return undefined;
    }

    const obj = input as Record<string, unknown>;

    if (
        isFiniteNumber(obj.x) &&
        isFiniteNumber(obj.y) &&
        isFiniteNumber(obj.width) &&
        isFiniteNumber(obj.height)
    ) {
        return {
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
        };
    }

    if (obj.rect && typeof obj.rect === "object" && obj.rect !== null) {
        return extractRectFromUnknown(obj.rect);
    }

    if (obj.bounds && typeof obj.bounds === "object" && obj.bounds !== null) {
        return extractRectFromUnknown(obj.bounds);
    }

    if (obj.box && typeof obj.box === "object" && obj.box !== null) {
        return extractRectFromUnknown(obj.box);
    }

    return undefined;
}

function extractPointFromUnknown(input: unknown): PointLike | undefined {
    if (!input || typeof input !== "object") {
        return undefined;
    }

    const obj = input as Record<string, unknown>;

    if (isFiniteNumber(obj.x) && isFiniteNumber(obj.y)) {
        return { x: obj.x, y: obj.y };
    }

    if (
        obj.clickPoint &&
        typeof obj.clickPoint === "object" &&
        obj.clickPoint !== null
    ) {
        return extractPointFromUnknown(obj.clickPoint);
    }

    if (obj.point && typeof obj.point === "object" && obj.point !== null) {
        return extractPointFromUnknown(obj.point);
    }

    return undefined;
}

function computePointFromRectAndRatio(
    rect: RectLike,
    xRatio: number,
    yRatio: number,
): PointLike {
    return {
        x: Math.round(rect.x + rect.width * xRatio),
        y: Math.round(rect.y + rect.height * yRatio),
    };
}

function buildAnnotatedPath(rawPath: string): string {
    const dir = path.dirname(rawPath);
    const ext = path.extname(rawPath);
    const base = path.basename(rawPath, ext);
    return path.join(dir, `${base}_annotated${ext}`);
}

export async function createRelativeClickOverlayArtifacts(params: {
    scenarioId: string;
    iteration: number;
    actionId: string;
    actionKind: string;
    targetStateMeta?: unknown;
    clickEvidence?: unknown;
    xRatio: number;
    yRatio: number;
    beforeRawPath?: string;
    afterRawPath?: string;
}): Promise<{
    beforeAnnotatedPath?: string;
    afterAnnotatedPath?: string;
}> {
    const rect =
        extractRectFromUnknown(params.clickEvidence) ??
        extractRectFromUnknown(params.targetStateMeta);

    const clickPoint =
        extractPointFromUnknown(params.clickEvidence) ??
        (rect
            ? computePointFromRectAndRatio(rect, params.xRatio, params.yRatio)
            : undefined);

    const shapes = [];

    if (rect) {
        shapes.push({
            type: "box" as const,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            color: "yellow" as const,
            label: "target",
            lineWidth: 3,
        });
    }

    if (clickPoint) {
        shapes.push({
            type: "point" as const,
            x: clickPoint.x,
            y: clickPoint.y,
            color: "red" as const,
            label: "click",
            radius: 6,
        });
    }

    if (!rect && !clickPoint) {
        shapes.push({
            type: "text" as const,
            x: 20,
            y: 90,
            text: "No target bounds/click point available from adapter evidence",
            color: "white" as const,
            fontSize: 14,
            background: true,
        });
    }

    const payloadBase: Omit<OverlayPayload, "meta"> = {
        shapes,
    };

    let beforeAnnotatedPath: string | undefined;
    let afterAnnotatedPath: string | undefined;

    if (params.beforeRawPath) {
        beforeAnnotatedPath = buildAnnotatedPath(params.beforeRawPath);
        await ensureParentDir(beforeAnnotatedPath);

        await renderOverlayImage({
            screenshotPath: params.beforeRawPath,
            outputPath: beforeAnnotatedPath,
            payload: {
                ...payloadBase,
                meta: {
                    scenarioId: params.scenarioId,
                    iteration: params.iteration,
                    actionId: params.actionId,
                    actionKind: params.actionKind,
                    note: "before click",
                },
            },
        });
    }

    if (params.afterRawPath) {
        afterAnnotatedPath = buildAnnotatedPath(params.afterRawPath);
        await ensureParentDir(afterAnnotatedPath);

        await renderOverlayImage({
            screenshotPath: params.afterRawPath,
            outputPath: afterAnnotatedPath,
            payload: {
                ...payloadBase,
                meta: {
                    scenarioId: params.scenarioId,
                    iteration: params.iteration,
                    actionId: params.actionId,
                    actionKind: params.actionKind,
                    note: "after click",
                },
            },
        });
    }

    return {
        beforeAnnotatedPath,
        afterAnnotatedPath,
    };
}
// export interface RelativePointBox {
//     x: number;
//     y: number;
//     width: number;
//     height: number;
// }

// export interface ClickRelativePointInput {
//     targetBox: RelativePointBox;
//     offsetXRatio?: number; // 0 -> trái, 0.5 -> giữa, 1 -> phải
//     offsetYRatio?: number; // 0 -> trên, 0.5 -> giữa, 1 -> dưới
// }

// export interface ClickRelativePointResult {
//     clickX: number;
//     clickY: number;
//     targetBox: RelativePointBox;
// }

// export function resolveRelativeClickPoint(
//     input: ClickRelativePointInput,
// ): ClickRelativePointResult {
//     const offsetXRatio = input.offsetXRatio ?? 0.5;
//     const offsetYRatio = input.offsetYRatio ?? 0.5;

//     const clickX = Math.round(
//         input.targetBox.x + input.targetBox.width * offsetXRatio,
//     );
//     const clickY = Math.round(
//         input.targetBox.y + input.targetBox.height * offsetYRatio,
//     );

//     return {
//         clickX,
//         clickY,
//         targetBox: input.targetBox,
//     };
// }
