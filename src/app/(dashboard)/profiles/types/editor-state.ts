import { AutomationStep } from "./automation-step";
import { ValidationIssue } from "../utils/step-validation";

export type EditorDraftModel = {
    tasks: AutomationStep[];
};

export type EditorUiState = {
    activeTab: string;
    expandedStepId: string | null;
    isAddStepOpen: boolean;
    isValidating: boolean;
    isDryRunning: boolean;
    isDrawerOpen: boolean;
};

/**
 * Tracks the result of the last schema validation pass only.
 * Populated by `runValidation`. Never written to by dry-run/execution flows.
 */
export type EditorValidationState = {
    status: "idle" | "success" | "error";
    issues: ValidationIssue[];
};

/**
 * Tracks the result of the last dry-run / execution attempt only.
 * Populated by `simulateDryRun`. Never conflated with schema validation issues.
 */
export type EditorExecutionState = {
    status: "idle" | "success" | "error";
    message?: string;
    /** The stepId that caused the execution failure, if any. */
    failedStepId?: string | null;
};

export type ProfileEditorState = {
    draft: EditorDraftModel;
    ui: EditorUiState;
    /** Schema validation issues from the last Validate pass. */
    validation: EditorValidationState;
    /** Dry-run / execution result — distinct from validation issues. */
    execution: EditorExecutionState;
};
