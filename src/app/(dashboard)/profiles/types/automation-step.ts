export type StepType = 
    | "dom_click"
    | "dom_type"
    | "visual_click"
    | "visual_type"
    | "wait_dom"
    | "wait_visual"
    | "wait_tab"
    | "delay"
    | "assertion"
    | "navigation"
    | "tab_management"
    | "loop"
    | "branch";

export type StepStatus = "enabled" | "disabled";

export type ScreenshotOnFailureMode = "none" | "full_screen" | "target_region";

export type FailAction =
    | "stop_flow"
    | "skip_step"
    | "retry_step"
    | "goto_step"
    | "goto_label"
    | "run_recovery";

export interface AutomationStep {
    id: string;
    order: number;
    name: string;
    type: StepType;
    status: StepStatus;
    description?: string;
    label?: string;
    condition?: StepCondition | null;
    runtime: StepRuntimePolicy;
    config: StepConfig;
    ui?: StepUiMeta;
    assertions?: AssertionConfig[];
    outputMappings?: OutputMapping[];
}

export interface StepRuntimePolicy {
    timeoutSec: number;
    retryCount: number;
    retryDelayMs?: number;
    failAction: FailAction;
    failTarget?: FailTarget | null;
    screenshotOnFailure: ScreenshotOnFailureMode;
    continueOnSuccess?: boolean;
}

export interface FailTarget {
    stepId?: string;
    label?: string;
}

export type ConditionOperator =
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "exists"
    | "not_exists"
    | "matches";

export interface StepCondition {
    source: ConditionSource;
    operator: ConditionOperator;
    value?: string | number | boolean;
}

export type ConditionSource =
    | { kind: "state"; key: string }
    | { kind: "context"; key: string }
    | { kind: "detect"; targetId: string }
    | { kind: "variable"; name: string };

// --- Specialized Step Configs ---

export interface NavigateStepConfig {
    kind: "navigation";
    url: string;
}

export interface TabSwitchStepConfig {
    kind: "tab_management";
    mode: "by_index" | "by_title" | "by_url";
    index?: number;
    title?: string;
    url?: string;
}

export interface DomClickStepConfig {
    kind: "dom_click";
    target: DomTarget;
}

export interface DomTypeStepConfig {
    kind: "dom_type";
    target: DomTarget;
    value: string;
}

export interface VisualClickStepConfig {
    kind: "visual_click";
    target: VisualTarget;
    detection: DetectionConfig;
}

export interface VisualTypeStepConfig {
    kind: "visual_type";
    target: VisualTarget;
    detection: DetectionConfig;
    value: string;
}

export interface WaitDomStepConfig {
    kind: "wait_dom";
    target: DomTarget;
    state: "visible" | "hidden" | "presence";
}

export interface WaitVisualStepConfig {
    kind: "wait_visual";
    target: VisualTarget;
    detection: DetectionConfig;
    state: "visible" | "hidden";
}

export interface WaitTabStepConfig {
    kind: "wait_tab";
    mode: "new_tab" | "url_match" | "title_match";
    pattern?: string;
}

export interface DelayStepConfig {
    kind: "delay";
    durationMs: number;
}

export interface AssertionStepConfig {
    kind: "assertion";
    type: "cross_step" | "state_check" | "milestone";
    target?: AutomationTarget;
    detection?: DetectionConfig;
    expectedValue?: string | number | boolean;
    assertionKind: AssertionKind;
}

export interface LoopStepConfig {
    kind: "loop";
    mode: "count" | "until_condition";
    count?: number;
    untilCondition?: StepCondition | null;
    delayBetweenIterationsMs?: number;
    bodyStepIds?: string[];
}

export interface BranchStepConfig {
    kind: "branch";
    ifCondition: StepCondition;
    onTrue: BranchTarget;
    onFalse: BranchTarget;
}

export type BranchTarget =
    | { type: "next_step" }
    | { type: "skip_step" }
    | { type: "goto_step"; stepId: string }
    | { type: "goto_label"; label: string }
    | { type: "stop_flow" };

export type StepConfig =
    | NavigateStepConfig
    | TabSwitchStepConfig
    | DomClickStepConfig
    | DomTypeStepConfig
    | VisualClickStepConfig
    | VisualTypeStepConfig
    | WaitDomStepConfig
    | WaitVisualStepConfig
    | WaitTabStepConfig
    | DelayStepConfig
    | AssertionStepConfig
    | LoopStepConfig
    | BranchStepConfig;

// --- Automation Targets ---

export type AutomationTarget =
    | DomTarget
    | VisualTarget
    | PointTarget;

export type VisualTarget = 
    | VisualTemplateTarget
    | VisualFeatureTarget
    | OcrTextTarget;

export interface DomTarget {
    kind: "dom";
    selector: string;
    useXpath?: boolean;
}

export interface VisualTemplateTarget {
    kind: "visual-template";
    assetId: string;
}

export interface VisualFeatureTarget {
    kind: "visual-feature";
    assetId: string;
}

export interface OcrTextTarget {
    kind: "ocr-text";
    text: string;
    matchMode?: "exact" | "contains" | "regex";
}

export interface PointTarget {
    kind: "point";
    x: number;
    y: number;
    space: "game-normalized" | "viewport-px";
}

// --- Detection Heuristics ---

export type DetectionConfig =
    | VisualTemplateDetectionConfig
    | VisualFeatureDetectionConfig
    | OcrDetectionConfig;

export interface VisualTemplateDetectionConfig {
    kind: "visual-template";
    threshold: number;      // 0.0 to 1.1
    multiScale: boolean;
    grayscale: boolean;
    region?: ScreenRegion | null;
}

export interface VisualFeatureDetectionConfig {
    kind: "visual-feature";
    minMatches: number;     // e.g. 10
    limitFeatures: number;  // e.g. 500
    region?: ScreenRegion | null;
}

export interface OcrDetectionConfig {
    kind: "ocr-text";
    language: string;       // e.g. "eng"
    denoise: boolean;
    region?: ScreenRegion | null;
}

// --- Verification & Outputs ---

export type AssertionKind = 
    | "visible" 
    | "hidden" 
    | "text_match" 
    | "value_eq" 
    | "value_gt" 
    | "count_eq";

export interface AssertionConfig {
    id: string;
    kind: AssertionKind;
    target?: AutomationTarget;
    detection?: DetectionConfig;
    expectedValue?: string | number | boolean;
    failAction: "stop" | "continue";
}

export interface OutputMapping {
    sourceKey: string;      // Validated against step contract (e.g. "ocr_text")
    targetVariableId: string;
}

export interface ScreenRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface StepUiMeta {
    collapsed?: boolean;
    colorHint?: "primary" | "secondary" | "tertiary" | "error";
    icon?: string;
}