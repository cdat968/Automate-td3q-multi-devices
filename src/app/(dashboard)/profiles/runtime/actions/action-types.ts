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
    | "COMPOSITE";

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
    | NoopAction;

export interface ActionExecutionResult {
    ok: boolean;
    message?: string;
    evidence?: Record<string, unknown>;
}
