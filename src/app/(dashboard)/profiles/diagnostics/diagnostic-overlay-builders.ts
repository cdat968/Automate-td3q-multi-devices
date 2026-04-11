/**
 * diagnostic-overlay-builders.ts
 *
 * Pure functions to build DiagnosticOverlayMeta shapes for deferred rendering.
 */

import type {
    DiagnosticOverlayMeta,
    DiagnosticOverlayPurpose,
} from "./diagnostic-types";

export interface BuildRelativeClickOverlayInput {
    screenshotPath?: string;
    rect?: { x: number; y: number; width: number; height: number };
    clickPoint?: { x: number; y: number };
    note?: string;
    /** Defaults to 'before_action' if not specified. */
    purpose?: DiagnosticOverlayPurpose;
}

/**
 * Builds a single DiagnosticOverlayMeta for a relative-click action.
 */
export function buildRelativeClickOverlay(
    input: BuildRelativeClickOverlayInput,
): DiagnosticOverlayMeta | undefined {
    if (!input.screenshotPath) return undefined;

    const shapes: DiagnosticOverlayMeta["shapes"] = [];

    if (input.rect) {
        shapes.push({
            type: "box",
            x: input.rect.x,
            y: input.rect.y,
            width: input.rect.width,
            height: input.rect.height,
            color: "yellow",
            label: "target",
            lineWidth: 3,
        });
    }

    if (input.clickPoint) {
        shapes.push({
            type: "point",
            x: input.clickPoint.x,
            y: input.clickPoint.y,
            color: "red",
            label: "click",
            radius: 6,
        });
    }

    if (!input.rect && !input.clickPoint) {
        shapes.push({
            type: "text",
            x: 20,
            y: 90,
            text: "No target bounds / click point available",
            color: "white",
            fontSize: 14,
            background: true,
        });
    }

    return {
        purpose: input.purpose ?? "before_action",
        screenshotPath: input.screenshotPath,
        shapes,
        renderNote: input.note,
    };
}

export interface BuildDetectorMatchOverlayInput {
    screenshotPath?: string;
    matchBox?: { x: number; y: number; width: number; height: number };
    score?: number;
    label?: string;
    /** Defaults to 'detector_match' if not specified. */
    purpose?: DiagnosticOverlayPurpose;
}

/**
 * Builds a single DiagnosticOverlayMeta for a detector match.
 */
export function buildDetectorMatchOverlay(
    input: BuildDetectorMatchOverlayInput,
): DiagnosticOverlayMeta | undefined {
    if (!input.screenshotPath) return undefined;

    const shapes: DiagnosticOverlayMeta["shapes"] = [];

    if (input.matchBox) {
        const scoreText =
            input.score !== undefined ? ` (${input.score.toFixed(3)})` : "";
        shapes.push({
            type: "box",
            x: input.matchBox.x,
            y: input.matchBox.y,
            width: input.matchBox.width,
            height: input.matchBox.height,
            color: "green",
            label: `${input.label ?? "match"}${scoreText}`,
            lineWidth: 3,
        });
    }

    return {
        purpose: input.purpose ?? "detector_match",
        screenshotPath: input.screenshotPath,
        shapes,
    };
}

export interface BuildDetectorMatchOverlaysInput {
    screenshotPath?: string;
    matchBox?: { x: number; y: number; width: number; height: number };
    score?: number;
    label?: string;
}

export function buildDetectorMatchOverlays(
    input: BuildDetectorMatchOverlaysInput,
): DiagnosticOverlayMeta[] {
    const overlay = buildDetectorMatchOverlay({
        purpose: "detector_match",
        screenshotPath: input.screenshotPath,
        matchBox: input.matchBox,
        score: input.score,
        label: input.label,
    });

    return overlay ? [overlay] : [];
}
