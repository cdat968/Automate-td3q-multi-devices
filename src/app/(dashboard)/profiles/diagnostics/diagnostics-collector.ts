import { OverlayPayload, OverlayShape } from "./overlay/overlay-types";

export interface DiagnosticsCollectorContext {
    timestamp: string;
    scenario?: string;
    iteration?: number;
    state?: string;
    action?: string;
    detector?: string;
    note?: string;
}

export class DiagnosticsCollector {
    private readonly context: DiagnosticsCollectorContext;
    private readonly shapes: OverlayShape[] = [];

    constructor(context: DiagnosticsCollectorContext) {
        this.context = context;
    }

    addBox(input: {
        x: number;
        y: number;
        width: number;
        height: number;
        label?: string;
        color?: "red" | "green" | "blue" | "yellow" | "orange" | "white";
        lineWidth?: number;
    }): void {
        this.shapes.push({
            type: "box",
            ...input,
        });
    }

    addPoint(input: {
        x: number;
        y: number;
        label?: string;
        color?: "red" | "green" | "blue" | "yellow" | "orange" | "white";
        radius?: number;
    }): void {
        this.shapes.push({
            type: "point",
            ...input,
        });
    }

    addText(input: {
        x: number;
        y: number;
        text: string;
        color?: "red" | "green" | "blue" | "yellow" | "orange" | "white";
        fontSize?: number;
        background?: boolean;
    }): void {
        this.shapes.push({
            type: "text",
            ...input,
        });
    }

    buildPayload(): OverlayPayload {
        return {
            meta: {
                timestamp: this.context.timestamp,
                scenario: this.context.scenario,
                iteration: this.context.iteration,
                state: this.context.state,
                action: this.context.action,
                detector: this.context.detector,
                note: this.context.note,
            },
            shapes: [...this.shapes],
        };
    }
}
