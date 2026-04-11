export type StepExecutionStatus = "success" | "failed" | "skipped" | "timeout";

/**
 * Status and audit metadata for a completed step.
 */
export interface StepExecutionResult {
    stepId: string;
    ok: boolean;
    status: StepExecutionStatus;
    startedAt: number;
    finishedAt: number;
    durationMs: number;
    message?: string;
    errorCode?: string;
    /**
     * Evidence of execution (screenshots, crops).
     */
    evidence?: StepEvidence;
    /**
     * Data extracted from the step (e.g. OCR text).
     * Separated from result status.
     */
    output?: StepOutputData;
}

/**
 * Typed domain data extracted from a step.
 */
export interface StepOutputData {
    values: Record<string, string | number | boolean>;
    metrics?: Record<string, number>;
}

/**
 * References to audit trails created by the step.
 */
export interface StepEvidence {
    screenshotPath?: string;
    cropPath?: string;
    matchScore?: number;
    ocrContent?: string;
}

export interface FlowExecutionResult {
    runId: string;
    ok: boolean;
    totalSteps: number;
    completedSteps: number;
    failedStepId?: string;
    results: StepExecutionResult[];
}
