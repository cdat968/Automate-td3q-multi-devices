export type RuntimeActionKind =
    | "NOOP"
    | "WAIT"
    | "CLICK"
    | "CLICK_AND_ADOPT_NEW_PAGE"
    | "TYPE"
    | "PRESS_KEY"
    | "FOCUS"
    | "ASSERT_TARGET"
    | "CLICK_RELATIVE_POINT"
    | "CLICK_FROM_DETECTION"
    | "MOVE_RELATIVE_POINT"
    | "COMPOSITE";

export interface MoveRelativePointAction extends RuntimeActionBase {
    id: string;
    kind: "MOVE_RELATIVE_POINT";
    xRatio: number;
    yRatio: number;
    description?: string;
}

export interface ClickFromDetectionAction extends RuntimeActionBase {
    kind: "CLICK_FROM_DETECTION";
    detectTarget: (ctx: ExecutionContext) => Promise<DetectionTargetResult>;
    requireMatch?: boolean;
    screenshotBefore?: boolean;
    screenshotAfter?: boolean;
}

export interface RuntimeTargetRef {
    id: string;
    kind: "dom" | "visual" | "native" | "canvas";
    locator?: string;
    strategy?: "css" | "xpath";
    meta?: Record<string, unknown>;
}

export interface RuntimeActionBase {
    id: string;
    kind: RuntimeActionKind;
    label?: string;
}

export interface ClickRelativePointAction extends RuntimeActionBase {
    kind: "CLICK_RELATIVE_POINT";
    target: RuntimeTargetRef; // game host / ruffle-player host
    xRatio: number; // 0..1
    yRatio: number; // 0..1
    requireVisible?: boolean;
    screenshotBefore?: boolean;
    screenshotAfter?: boolean;
}
// export interface ClickRelativePointAction extends RuntimeActionBase {
//     actionKind: "CLICK_RELATIVE_POINT";
//     targetId: string;

//     clickedPoint: {
//         x: number;
//         y: number;
//     };

//     targetBox?: {
//         x: number;
//         y: number;
//         width: number;
//         height: number;
//     };

//     artifacts?: {
//         beforeRawPath?: string;
//         afterRawPath?: string;
//         beforeOverlayPath?: string;
//         afterOverlayPath?: string;
//         jsonPath?: string;
//     };
// }

export interface ClickAction extends RuntimeActionBase {
    kind: "CLICK";
    target: RuntimeTargetRef;
}

export interface ClickAndAdoptNewPageAction extends RuntimeActionBase {
    kind: "CLICK_AND_ADOPT_NEW_PAGE";
    target: RuntimeTargetRef;
    timeoutMs?: number;
}

export interface TypeAction extends RuntimeActionBase {
    kind: "TYPE";
    target: RuntimeTargetRef;
    value: string;
    clearBeforeType?: boolean;
}

export interface PressKeyAction extends RuntimeActionBase {
    kind: "PRESS_KEY";
    key: string;
}

export interface FocusAction extends RuntimeActionBase {
    kind: "FOCUS";
    target: RuntimeTargetRef;
}

export interface WaitAction extends RuntimeActionBase {
    kind: "WAIT";
    durationMs: number;
}

export interface AssertTargetAction extends RuntimeActionBase {
    kind: "ASSERT_TARGET";
    target: RuntimeTargetRef;
}

export interface CompositeAction extends RuntimeActionBase {
    kind: "COMPOSITE";
    actions: RuntimeAction[];
}

export interface NoopAction extends RuntimeActionBase {
    kind: "NOOP";
}

export type RuntimeAction =
    | ClickAction
    | ClickAndAdoptNewPageAction
    | TypeAction
    | PressKeyAction
    | FocusAction
    | WaitAction
    | AssertTargetAction
    | CompositeAction
    | ClickRelativePointAction
    | ClickFromDetectionAction
    | MoveRelativePointAction
    | NoopAction;

import type {
    DiagnosticAttachment,
    DiagnosticOverlayMeta,
    StateDetectionResult,
} from "../../diagnostics/diagnostic-types";
import { ExecutionContext } from "../scenario/scenario-types";

export type DetectionTargetResult = StateDetectionResult;

export interface ActionExecutionResult {
    ok: boolean;
    message?: string;
    evidence?: Record<string, unknown>;
    /** Optional diagnostic attachments produced during execution. */
    attachments?: DiagnosticAttachment[];
    /** Optional diagnostic overlays produced during execution. */
    overlays?: DiagnosticOverlayMeta[];
}
