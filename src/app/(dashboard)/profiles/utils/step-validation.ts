import type {
    AutomationStep,
    StepConfig,
    StepCondition,
    AutomationTarget,
    DetectionConfig,
    DomClickStepConfig,
    DomTypeStepConfig,
    VisualClickStepConfig,
    VisualTypeStepConfig,
    WaitDomStepConfig,
    WaitVisualStepConfig,
    WaitTabStepConfig,
    NavigateStepConfig,
    DelayStepConfig,
    TabSwitchStepConfig,
    AssertionStepConfig,
    LoopStepConfig,
    BranchStepConfig,
} from "../types/automation-step";
import type { GameProfile } from "../types/game-profile";

/**
 * Standardizes the schema-validation logic for profile editor tasks.
 * 
 * --- Issue Path Conventions ---
 * - Step-level: "name", "id", "status"
 * - Runtime policy: "runtime.timeoutSec", "runtime.retryCount", etc.
 * - Step Config: "config.url", "config.value", "config.target.selector", etc.
 * - Step Conditions: "condition.source", "condition.value"
 * - Loop/Branch Conditions: "config.untilCondition.source", "config.ifCondition.source", etc.
 * -------------------------------
 */

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
    code: string;
    severity: ValidationSeverity;
    message: string;
    path: string;
    stepId?: string;
}

export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
}

export function validateStep(
    step: AutomationStep,
    allSteps: AutomationStep[] = [],
): ValidationResult {
    const issues: ValidationIssue[] = [];

    if (!step.id.trim()) {
        issues.push(issue("STEP_ID_REQUIRED", "error", "Step id is required.", "id", step.id));
    }

    if (step.order < 1) {
        issues.push(issue("STEP_ORDER_INVALID", "error", "Step order must be greater than 0.", "order", step.id));
    }

    if (!step.name.trim()) {
        issues.push(issue("STEP_NAME_REQUIRED", "error", "Step name is required.", "name", step.id));
    }

    if (!["enabled", "disabled"].includes(step.status)) {
        issues.push(issue("STEP_STATUS_INVALID", "error", "Step status is invalid.", "status", step.id));
    }

    validateRuntime(step, issues, allSteps);
    validateCondition(step.condition, "condition", step.id, issues);
    validateStepConfig(step.config, step.id, issues, allSteps);
    validateOutputMappings(step, issues);
    validateStepAssertions(step, issues);

    // Threshold Warnings
    if (step.runtime.timeoutSec > 300) {
        issues.push(issue("STEP_TIMEOUT_HIGH", "warning", "Unusually high timeout (> 300s).", "runtime.timeoutSec", step.id));
    }
    if (step.runtime.retryCount > 10) {
        issues.push(issue("STEP_RETRY_HIGH", "warning", "High retry count. May cause long execution delays.", "runtime.retryCount", step.id));
    }

    return {
        valid: issues.every((i) => i.severity !== "error"),
        issues,
    };
}

export function validateSteps(steps: AutomationStep[]): ValidationResult {
    const issues: ValidationIssue[] = [];

    if (steps.length === 0) {
        issues.push(issue("FLOW_EMPTY", "error", "The flow must contain at least one step.", "steps"));
        return { valid: false, issues };
    }

    const ids = new Set<string>();
    const labels = new Set<string>();

    for (const step of steps) {
        if (ids.has(step.id)) {
            issues.push(issue("STEP_ID_DUPLICATE", "error", `Duplicate step id: ${step.id}`, "id", step.id));
        }
        ids.add(step.id);

        if (step.label?.trim()) {
            if (labels.has(step.label.trim())) {
                issues.push(issue("STEP_LABEL_DUPLICATE", "error", `Duplicate step label: ${step.label}`, "label", step.id));
            }
            labels.add(step.label.trim());
        }

        const stepResult = validateStep(step, steps);
        issues.push(...stepResult.issues);
    }

    // Flow-level Warnings
    const allDisabled = steps.every((s) => s.status === "disabled");
    if (allDisabled) {
        issues.push(issue("FLOW_ALL_DISABLED", "warning", "All steps are disabled. The flow will skip everything.", "steps"));
    }

    return {
        valid: issues.every((i) => i.severity !== "error"),
        issues,
    };
}

export function validateProfile(profile: GameProfile): ValidationResult {
    const issues: ValidationIssue[] = [];

    if (!profile.name.trim()) {
        issues.push(issue("PROFILE_NAME_REQUIRED", "error", "Profile name is required.", "name"));
    }

    if (!profile.game.trim()) {
        issues.push(issue("PROFILE_GAME_REQUIRED", "error", "Target game is required.", "game"));
    }

    if (Array.isArray(profile.steps)) {
        issues.push(...validateSteps(profile.steps).issues);
    }

    return {
        valid: issues.every((i) => i.severity !== "error"),
        issues,
    };
}

function validateRuntime(
    step: AutomationStep,
    issues: ValidationIssue[],
    allSteps: AutomationStep[],
) {
    const { runtime } = step;

    if (runtime.timeoutSec <= 0) {
        issues.push(issue("STEP_TIMEOUT_INVALID", "error", "Timeout must be greater than 0.", "runtime.timeoutSec", step.id));
    }

    if (runtime.retryCount < 0) {
        issues.push(issue("STEP_RETRY_INVALID", "error", "Retry count cannot be negative.", "runtime.retryCount", step.id));
    }

    if (
        (runtime.failAction === "goto_step" || runtime.failAction === "goto_label") &&
        !runtime.failTarget
    ) {
        issues.push(issue("STEP_FAIL_TARGET_REQUIRED", "error", "Fail target is required for jump actions.", "runtime.failTarget", step.id));
    }
}

function validateStepConfig(
    config: StepConfig,
    stepId: string,
    issues: ValidationIssue[],
    allSteps: AutomationStep[],
) {
    switch (config.kind) {
        case "navigation":
            if (!config.url.trim()) {
                issues.push(issue("NAV_URL_REQUIRED", "error", "Navigation URL is required.", "config.url", stepId));
            }
            break;
        case "dom_click":
        case "dom_type":
            validateDomTarget(config.target, stepId, issues, "config.target");
            if (config.kind === "dom_type" && !config.value) {
                issues.push(issue("TYPE_VALUE_REQUIRED", "error", "Text value is required for typing.", "config.value", stepId));
            }
            break;
        case "visual_click":
        case "visual_type":
            validateVisualTarget(config.target, stepId, issues, "config.target");
            validateDetectionConfig(config.detection, stepId, issues, "config.detection", config.target.kind);
            if (config.kind === "visual_type" && !config.value) {
                issues.push(issue("TYPE_VALUE_REQUIRED", "error", "Text value is required for typing.", "config.value", stepId));
            }
            break;
        case "wait_dom":
            validateDomTarget(config.target, stepId, issues, "config.target");
            break;
        case "wait_visual":
            validateVisualTarget(config.target, stepId, issues, "config.target");
            validateDetectionConfig(config.detection, stepId, issues, "config.detection", config.target.kind);
            break;
        case "wait_tab":
            if (config.mode !== "new_tab" && !config.pattern?.trim()) {
                issues.push(issue("WAIT_TAB_PATTERN_REQUIRED", "error", "Match pattern required for this mode.", "config.pattern", stepId));
            }
            break;
        case "delay":
            if (config.durationMs < 0) {
                issues.push(issue("DELAY_INVALID", "error", "Delay cannot be negative.", "config.durationMs", stepId));
            }
            break;
        case "tab_management":
            if (config.mode === "by_title" && !config.title?.trim()) {
                issues.push(issue("TAB_TITLE_REQUIRED", "error", "Tab title is required.", "config.title", stepId));
            }
            break;
        case "assertion":
            validateAssertionConfig(config, stepId, issues);
            break;
        case "loop":
            validateLoopConfig(config, stepId, issues, allSteps);
            break;
        case "branch":
            validateBranchConfig(config, stepId, issues, allSteps);
            break;
        default: {
            const exhaustiveCheck: never = config;
            throw new Error(`Unsupported config kind: ${JSON.stringify(exhaustiveCheck)}`);
        }
    }
}

function validateDomTarget(target: AutomationTarget, stepId: string, issues: ValidationIssue[], path: string) {
    if (target.kind !== "dom") {
        issues.push(issue("INVALID_TARGET_KIND", "error", "Expected DOM target for this step.", path, stepId));
        return;
    }
    if (!target.selector.trim()) {
        issues.push(issue("DOM_SELECTOR_REQUIRED", "error", "DOM selector is required.", `${path}.selector`, stepId));
    }
}

function validateVisualTarget(target: AutomationTarget, stepId: string, issues: ValidationIssue[], path: string) {
    if (target.kind !== "visual-template" && target.kind !== "visual-feature" && target.kind !== "ocr-text") {
        issues.push(issue("INVALID_TARGET_KIND", "error", "Expected visual target for this step.", path, stepId));
        return;
    }
    if (target.kind === "ocr-text" && !target.text.trim()) {
        issues.push(issue("OCR_TEXT_REQUIRED", "error", "OCR text pattern is required.", `${path}.text`, stepId));
    } else if ((target.kind === "visual-template" || target.kind === "visual-feature") && !target.assetId.trim()) {
        issues.push(issue("ASSET_ID_REQUIRED", "error", "Visual asset ID is required.", `${path}.assetId`, stepId));
    }
}

function validateDetectionConfig(config: DetectionConfig, stepId: string, issues: ValidationIssue[], path: string, targetKind?: string) {
    if (config.kind === "visual-template") {
        if (config.threshold < 0 || config.threshold > 1.1) {
            issues.push(issue("THRESHOLD_INVALID", "error", "Threshold must be between 0 and 1.1", `${path}.threshold`, stepId));
        }
    }

    // Strict Compatibility Check
    if (targetKind && targetKind !== config.kind) {
        issues.push(issue("DETECTION_KIND_MISMATCH", "error", `Detection kind "${config.kind}" is incompatible with target kind "${targetKind}".`, path, stepId));
    }
}

function validateAssertionConfig(config: AssertionStepConfig, stepId: string, issues: ValidationIssue[]) {
    if (config.type === "state_check" && !config.target) {
        issues.push(issue("ASSERT_TARGET_REQUIRED", "error", "Target required for state check.", "config.target", stepId));
    }
    if (config.target && config.detection) {
        validateDetectionConfig(config.detection, stepId, issues, "config.detection", config.target.kind);
    }
}

function validateOutputMappings(step: AutomationStep, issues: ValidationIssue[]) {
    if (!step.outputMappings || step.outputMappings.length === 0) return;

    const allowedSources = OUTPUT_SOURCE_MAP[step.config.kind] || [];

    for (const mapping of step.outputMappings) {
        if (!mapping.sourceKey.trim()) {
            issues.push(issue("OUTPUT_SOURCE_REQUIRED", "error", "Output source key is required.", "outputMappings", step.id));
        } else if (!allowedSources.includes(mapping.sourceKey)) {
            issues.push(issue("OUTPUT_SOURCE_INVALID", "error", `Source key "${mapping.sourceKey}" is not supported by step kind "${step.config.kind}".`, "outputMappings", step.id));
        }

        if (!mapping.targetVariableId.trim()) {
            issues.push(issue("OUTPUT_VARIABLE_REQUIRED", "error", "Target variable ID is required.", "outputMappings", step.id));
        }
    }
}

function validateStepAssertions(step: AutomationStep, issues: ValidationIssue[]) {
    if (!step.assertions || step.assertions.length === 0) return;

    for (const assertion of step.assertions) {
        if (!assertion.id?.trim()) {
            issues.push(issue("ASSERTION_ID_REQUIRED", "error", "Assertion ID is required.", "assertions", step.id));
        }

        // Target requirement
        if (["visible", "hidden", "text_match"].includes(assertion.kind) && !assertion.target) {
            issues.push(issue("ASSERTION_TARGET_REQUIRED", "error", `Assertion "${assertion.kind}" requires a target.`, "assertions", step.id));
        }

        // Expected value requirement
        if (["value_eq", "value_gt", "count_eq", "text_match"].includes(assertion.kind) && assertion.expectedValue === undefined) {
            issues.push(issue("ASSERTION_VALUE_REQUIRED", "error", `Assertion "${assertion.kind}" requires an expected value.`, "assertions", step.id));
        }

        if (assertion.target && assertion.detection) {
            validateDetectionConfig(assertion.detection, step.id, issues, "assertions.detection", assertion.target.kind);
        }
    }
}

const OUTPUT_SOURCE_MAP: Record<string, string[]> = {
    dom_click: [],
    dom_type: [],
    visual_click: ["match_score"],
    visual_type: ["match_score"],
    wait_dom: [],
    wait_visual: ["match_score"],
    assertion: ["success"],
};

function validateLoopConfig(config: LoopStepConfig, stepId: string, issues: ValidationIssue[], allSteps: AutomationStep[]) {
    if (config.mode === "count" && (!config.count || config.count <= 0)) {
        issues.push(issue("LOOP_COUNT_INVALID", "error", "Loop count must be > 0.", "config.count", stepId));
    }
    if (config.mode === "until_condition") {
        validateCondition(config.untilCondition, "config.untilCondition", stepId, issues);
    }
}

function validateBranchConfig(config: BranchStepConfig, stepId: string, issues: ValidationIssue[], allSteps: AutomationStep[]) {
    if (!config.ifCondition) {
        issues.push(issue("BRANCH_COND_REQUIRED", "error", "Branch requires a condition.", "config.ifCondition", stepId));
    } else {
        validateCondition(config.ifCondition, "config.ifCondition", stepId, issues);
    }
}

function validateCondition(condition: StepCondition | null | undefined, path: string, stepId: string, issues: ValidationIssue[]) {
    if (!condition) return;

    // Check source type (state, context, etc.)
    if (!condition.source?.kind) {
        issues.push(issue("COND_SOURCE_REQUIRED", "error", "Condition source kind is required.", `${path}.source`, stepId));
    }

    // Check specific source key (depends on kind)
    const sourceKey = (condition.source as any)?.key || (condition.source as any)?.targetId || (condition.source as any)?.name;
    if (!sourceKey?.trim()) {
        issues.push(issue("COND_KEY_REQUIRED", "error", "Condition key/name is required.", `${path}.source`, stepId));
    }

    // Check value if operator requires it
    const operatorRequiresValue = condition.operator !== "exists" && condition.operator !== "not_exists";
    if (operatorRequiresValue && (condition.value === undefined || String(condition.value).trim() === "")) {
        issues.push(issue("COND_VALUE_REQUIRED", "error", "Condition value is required for this operator.", `${path}.value`, stepId));
    }
}

function issue(
    code: string,
    severity: ValidationSeverity,
    message: string,
    path: string,
    stepId?: string,
): ValidationIssue {
    return { code, severity, message, path, stepId };
}