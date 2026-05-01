import type {
    OverlayColor,
    OverlayShape,
} from "@diagnostics/overlay/overlay-types";

export function createBoxOverlay(
    x: number,
    y: number,
    width: number,
    height: number,
    color: OverlayColor,
    label?: string,
    lineWidth?: number,
): OverlayShape {
    return {
        type: "box",
        x,
        y,
        width,
        height,
        color,
        label,
        lineWidth,
    };
}

export function createPointOverlay(
    x: number,
    y: number,
    color: OverlayColor,
    label?: string,
): OverlayShape {
    return {
        type: "point",
        x,
        y,
        color,
        label,
    };
}

export function getOverlayShapeLabel(shape: OverlayShape) {
    if ("label" in shape) {
        return shape.label;
    }

    if (shape.type === "text") {
        return shape.text;
    }

    return undefined;
}
