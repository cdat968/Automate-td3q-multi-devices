/**
 * Persisted version of an automation step.
 * This is the canonical storage format for serialized steps.
 */
export interface PersistedAutomationStep {
    id: string;
    order: number;
    name: string;
    type: PersistedStepType;
    status: "enabled" | "disabled";
    description?: string;
    label?: string;
    condition?: PersistedStepCondition | null;
    runtime: PersistedStepRuntimePolicy;
    config: PersistedStepConfig;
    assertions?: PersistedAssertionConfig[];
    outputMappings?: PersistedOutputMapping[];
}

export type PersistedStepType = 
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

export interface PersistedStepRuntimePolicy {
    timeoutSec: number;
    retryCount: number;
    retryDelayMs?: number;
    failAction: "stop_flow" | "skip_step" | "retry_step" | "goto_step" | "goto_label" | "run_recovery";
    failTarget?: { stepId?: string; label?: string } | null;
    screenshotOnFailure: "none" | "full_screen" | "target_region";
    continueOnSuccess?: boolean;
}

export type PersistedStepConfig =
    | PersistedNavigateConfig
    | PersistedTabSwitchConfig
    | PersistedDomClickConfig
    | PersistedDomTypeConfig
    | PersistedVisualClickConfig
    | PersistedVisualTypeConfig
    | PersistedWaitDomConfig
    | PersistedWaitVisualConfig
    | PersistedWaitTabConfig
    | PersistedDelayConfig
    | PersistedAssertionStepConfig
    | PersistedLoopConfig
    | PersistedBranchConfig;

export interface PersistedNavigateConfig { kind: "navigation"; url: string; }
export interface PersistedTabSwitchConfig { 
    kind: "tab_management"; 
    mode: "by_index" | "by_title" | "by_url"; 
    index?: number; 
    title?: string; 
    url?: string; 
}
export interface PersistedDomClickConfig { kind: "dom_click"; target: PersistedDomTarget; }
export interface PersistedDomTypeConfig { kind: "dom_type"; target: PersistedDomTarget; value: string; }
export interface PersistedVisualClickConfig { 
    kind: "visual_click"; 
    target: PersistedVisualTarget; 
    detection: PersistedDetectionConfig; 
}
export interface PersistedVisualTypeConfig { 
    kind: "visual_type"; 
    target: PersistedVisualTarget; 
    detection: PersistedDetectionConfig; 
    value: string; 
}
export interface PersistedWaitDomConfig { 
    kind: "wait_dom"; 
    target: PersistedDomTarget; 
    state: "visible" | "hidden" | "presence"; 
}
export interface PersistedWaitVisualConfig { 
    kind: "wait_visual"; 
    target: PersistedVisualTarget; 
    detection: PersistedDetectionConfig; 
    state: "visible" | "hidden"; 
}
export interface PersistedWaitTabConfig { 
    kind: "wait_tab"; 
    mode: "new_tab" | "url_match" | "title_match"; 
    pattern?: string; 
}
export interface PersistedDelayConfig { kind: "delay"; durationMs: number; }
export interface PersistedAssertionStepConfig {
    kind: "assertion";
    type: "cross_step" | "state_check" | "milestone";
    target?: PersistedAutomationTarget;
    detection?: PersistedDetectionConfig;
    expectedValue?: string | number | boolean;
    assertionKind: PersistedAssertionKind;
}
export interface PersistedLoopConfig {
    kind: "loop";
    mode: "count" | "until_condition";
    count?: number;
    untilCondition?: PersistedStepCondition | null;
    delayBetweenIterationsMs?: number;
    bodyStepIds?: string[];
}
export interface PersistedBranchConfig {
    kind: "branch";
    ifCondition: PersistedStepCondition;
    onTrue: PersistedBranchTarget;
    onFalse: PersistedBranchTarget;
}

export type PersistedBranchTarget =
    | { type: "next_step" }
    | { type: "skip_step" }
    | { type: "goto_step"; stepId: string }
    | { type: "goto_label"; label: string }
    | { type: "stop_flow" };

export type PersistedAutomationTarget = PersistedDomTarget | PersistedVisualTarget;

export interface PersistedDomTarget { kind: "dom"; selector: string; useXpath?: boolean; }
export type PersistedVisualTarget = 
    | { kind: "visual-template"; assetId: string }
    | { kind: "visual-feature"; assetId: string }
    | { kind: "ocr-text"; text: string; matchMode?: "exact" | "contains" | "regex" };

export type PersistedDetectionConfig =
    | { kind: "visual-template"; threshold: number; multiScale: boolean; grayscale: boolean; region?: PersistedScreenRegion | null }
    | { kind: "visual-feature"; minMatches: number; limitFeatures: number; region?: PersistedScreenRegion | null }
    | { kind: "ocr-text"; language: string; denoise: boolean; region?: PersistedScreenRegion | null };

export interface PersistedScreenRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type PersistedConditionOperator =
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

export interface PersistedStepCondition {
    source: {
        kind: "state" | "context" | "detect" | "variable";
        key?: string;
        targetId?: string;
        name?: string;
    };
    operator: PersistedConditionOperator;
    value?: string | number | boolean;
}

export type PersistedAssertionKind = 
    | "visible" 
    | "hidden" 
    | "text_match" 
    | "value_eq" 
    | "value_gt" 
    | "count_eq";

export interface PersistedAssertionConfig {
    id: string;
    kind: PersistedAssertionKind;
    target?: PersistedAutomationTarget;
    detection?: PersistedDetectionConfig;
    expectedValue?: string | number | boolean;
    failAction: "stop" | "continue";
}

export interface PersistedOutputMapping {
    sourceKey: string;
    targetVariableId: string;
}
