import { DiagnosticsCollector } from "../diagnostics-collector";

export interface RectLike {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ClickPoint {
    x: number;
    y: number;
}

export function attachDetectorBox(
    collector: DiagnosticsCollector,
    box: RectLike,
    label = "detector-match",
): void {
    collector.addBox({
        ...box,
        label,
        color: "yellow",
        lineWidth: 3,
    });
}

export function attachClickPoint(
    collector: DiagnosticsCollector,
    point: ClickPoint,
    label = "click",
): void {
    collector.addPoint({
        ...point,
        label,
        color: "red",
        radius: 6,
    });
}

export function attachMetaText(
    collector: DiagnosticsCollector,
    text: string,
    x = 20,
    y = 100,
): void {
    collector.addText({
        x,
        y,
        text,
        color: "white",
        fontSize: 15,
        background: true,
    });
}
