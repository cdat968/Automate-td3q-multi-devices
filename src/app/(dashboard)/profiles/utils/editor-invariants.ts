import { 
    AutomationStep, 
    DomClickStepConfig, 
    DomTypeStepConfig, 
    WaitDomStepConfig,
    AssertionStepConfig,
    VisualClickStepConfig, 
    VisualTypeStepConfig, 
    WaitVisualStepConfig,
    AutomationTarget,
    DomTarget,
    VisualTarget
} from "../types/automation-step";

/**
 * Type checks if a given step config kind operates against a DOM target.
 */
export function isDomTargetConfigKind(
    kind: AutomationStep["config"]["kind"]
): kind is "dom_click" | "dom_type" | "wait_dom" | "assertion" {
    return ["dom_click", "dom_type", "wait_dom", "assertion"].includes(kind);
}

/**
 * Type checks if a given step config operates against a DOM target.
 */
export function hasDomTarget(
    config: AutomationStep["config"]
): config is DomClickStepConfig | DomTypeStepConfig | WaitDomStepConfig | AssertionStepConfig {
    return isDomTargetConfigKind(config.kind);
}

/**
 * Type checks if a target object is a guaranteed DOM target.
 */
export function isDomTarget(target: AutomationTarget): target is DomTarget {
    return target.kind === "dom";
}

/**
 * Type checks if a given step config kind operates against a visual target.
 */
export function isVisualTargetConfigKind(
    kind: AutomationStep["config"]["kind"]
): kind is "visual_click" | "visual_type" | "wait_visual" {
    return ["visual_click", "visual_type", "wait_visual"].includes(kind);
}

/**
 * Type checks if a given step config operates against a visual target.
 */
export function hasVisualTarget(
    config: AutomationStep["config"]
): config is VisualClickStepConfig | VisualTypeStepConfig | WaitVisualStepConfig {
    return isVisualTargetConfigKind(config.kind);
}

/**
 * Type checks if a target object is a guaranteed visual target.
 */
export function isVisualTarget(target: AutomationTarget): target is VisualTarget {
    return ["visual-template", "visual-feature", "ocr-text"].includes(target.kind);
}
