"use client";

import React from "react";
import { TaskSequenceToolbar } from "./TaskSequenceToolbar";
import { TaskStepCard } from "./TaskStepCard";
import type {
    AutomationStep,
    StepType,
    ScreenshotOnFailureMode,
    AutomationTarget,
    AssertionKind,
    AssertionStepConfig,
    DetectionConfig,
    LoopStepConfig,
    BranchStepConfig,
    StepCondition,
    WaitTabStepConfig,
    TabSwitchStepConfig,
} from "../../types/automation-step";
import {
    EditorDraftModel,
    EditorUiState,
    EditorValidationState,
    EditorExecutionState,
} from "../../types/editor-state";
import { groupIssuesByStep } from "../../utils/validation-helpers";
import type { ValidationIssue } from "../../utils/step-validation";

interface TaskSequencePanelProps {
    draft: EditorDraftModel;
    ui: EditorUiState;
    validation: EditorValidationState;
    execution: EditorExecutionState;
    onValidate: () => void;
    onDryRun: () => void;
    onToggleAddStep: () => void;
    onAddStep: (type: string) => void;
    onStepClick: (taskId: string) => void;
    onSaveConfig: (taskId: string) => void;
    // Note: Live-editor semantics mean draft edits apply instantly. 
    // "Close/Cancel" simply collapses the UI without reverting.
    onCancelConfig: (taskId: string) => void;
    onToggleStatus: (taskId: string, e: React.MouseEvent) => void;
    onDelete: (taskId: string, e: React.MouseEvent) => void;
    onTypeChange: (taskId: string, newType: StepType) => void;
    addStepRef: React.RefObject<HTMLDivElement | null>;

    onStepNameChange: (stepId: string, name: string) => void;
    onStepDescriptionChange: (stepId: string, description: string) => void;
    onStepLabelChange: (stepId: string, label: string) => void;
    onTimeoutChange: (stepId: string, timeoutSec: number) => void;
    onRetryCountChange: (stepId: string, retryCount: number) => void;
    onRetryDelayChange: (stepId: string, retryDelayMs: number) => void;
    onScreenshotModeChange: (
        stepId: string,
        mode: ScreenshotOnFailureMode,
    ) => void;
    onConditionChange: (
        stepId: string,
        condition: StepCondition | null,
    ) => void;

    onActionTargetChange: (stepId: string, target: AutomationTarget) => void;
    onActionInputValueChange: (stepId: string, value: string) => void;
    // Fix #1 + #2: named handlers
    onNavigationUrlChange: (stepId: string, url: string) => void;
    onAssertionTypeChange: (stepId: string, type: AssertionStepConfig["type"]) => void;
    onAssertionKindChange: (stepId: string, assertionKind: AssertionKind) => void;
    onAssertionExpectedValueChange: (stepId: string, expectedValue: string) => void;

    onWaitConfigChange: (
        stepId: string,
        patch: Partial<WaitTabStepConfig> | Partial<TabSwitchStepConfig> | { state: "visible" | "hidden" | "presence" } | { durationMs: number },
    ) => void;
    onDetectConfigChange: (
        stepId: string,
        patch: Partial<DetectionConfig>,
    ) => void;
    onLoopConfigChange: (
        stepId: string,
        patch: Partial<LoopStepConfig>,
    ) => void;
    onBranchConfigChange: (
        stepId: string,
        patch: Partial<BranchStepConfig>,
    ) => void;
}

export const TaskSequencePanel: React.FC<TaskSequencePanelProps> = ({
    draft,
    ui,
    validation,
    execution,
    onStepClick,
    onSaveConfig,
    onCancelConfig,
    onToggleStatus,
    onDelete,
    onTypeChange,
    onValidate,
    onDryRun,
    onToggleAddStep,
    onAddStep,
    addStepRef,
    onStepNameChange,
    onStepDescriptionChange,
    onStepLabelChange,
    onTimeoutChange,
    onRetryCountChange,
    onRetryDelayChange,
    onScreenshotModeChange,
    onConditionChange,
    onActionTargetChange,
    onActionInputValueChange,
    onNavigationUrlChange,
    onAssertionTypeChange,
    onAssertionKindChange,
    onAssertionExpectedValueChange,
    onWaitConfigChange,
    onDetectConfigChange,
    onLoopConfigChange,
    onBranchConfigChange,
}) => {
    const { tasks } = draft;
    const { expandedStepId, isValidating, isDryRunning, isAddStepOpen } = ui;
    const { issues } = validation;

    const groupedIssues = React.useMemo(
        () => groupIssuesByStep(issues),
        [issues],
    );

    const globalIssues = groupedIssues["global"] || {
        errors: [],
        warnings: [],
    };
    const hasGlobalIssues =
        globalIssues.errors.length > 0 || globalIssues.warnings.length > 0;

    const totalErrors = issues.filter(
        (i) => i.severity === "error",
    ).length;
    const totalWarnings = issues.filter(
        (i) => i.severity === "warning",
    ).length;

    const hasAnyIssues = totalErrors > 0 || totalWarnings > 0;

    return (
        <div
            key="task-sequence"
            className="card p-6 border border-white/5 bg-surface-container shadow-xl flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="section-title text-xl text-on-surface">
                        Task Sequence
                    </h3>
                </div>

                <TaskSequenceToolbar
                    validationStatus={validation.status}
                    executionStatus={execution.status}
                    executionMessage={execution.message}
                    failedStepId={execution.failedStepId}
                    isValidating={isValidating}
                    isDryRunning={isDryRunning}
                    hasIssues={hasAnyIssues}
                    isAddStepOpen={isAddStepOpen}
                    onValidate={onValidate}
                    onDryRun={onDryRun}
                    onToggleAddStep={onToggleAddStep}
                    onAddStep={onAddStep}
                    addStepRef={addStepRef}
                />
            </div>

            {hasAnyIssues && (
                <div
                    className={`mb-4 p-4 border rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm ${totalErrors > 0
                            ? "bg-error-container/20 border-error/30"
                            : "bg-amber-500/10 border-amber-500/30"
                        }`}
                >
                    <span
                        className={`material-symbols-outlined shrink-0 ${totalErrors > 0 ? "text-error" : "text-amber-500"
                            }`}
                    >
                        {totalErrors > 0 ? "error" : "info"}
                    </span>
                    <div className="flex-1">
                        <h4
                            className={`text-sm font-bold ${totalErrors > 0 ? "text-error" : "text-amber-500"
                                }`}
                        >
                            {totalErrors > 0
                                ? "Validation Issues Found"
                                : "Validation completed with warnings"}
                        </h4>
                        <div className="mt-1 space-y-1">
                            {globalIssues.errors.map(
                                (err: ValidationIssue, idx: number) => (
                                    <p
                                        key={`global-err-${idx}`}
                                        className="text-xs text-on-error-container leading-relaxed flex items-center gap-1.5"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-error shrink-0" />
                                        {err.message}
                                    </p>
                                ),
                            )}
                            {globalIssues.warnings.map(
                                (warn: ValidationIssue, idx: number) => (
                                    <p
                                        key={`global-warn-${idx}`}
                                        className="text-xs text-amber-500/80 leading-relaxed flex items-center gap-1.5"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                        {warn.message}
                                    </p>
                                ),
                            )}
                            {!hasGlobalIssues && (
                                <p className="text-xs opacity-70 leading-relaxed italic">
                                    Please check the highlighted steps below for
                                    details.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {execution.status !== "idle" && !isDryRunning && (
                <div
                    className={`mb-4 p-4 border rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm ${execution.status === "error"
                            ? "bg-error-container/20 border-error/30"
                            : "bg-success-container/10 border-success/30"
                        }`}
                >
                    <span
                        className={`material-symbols-outlined shrink-0 ${execution.status === "error" ? "text-error" : "text-success"
                            }`}
                    >
                        {execution.status === "error" ? "running_with_errors" : "check_circle"}
                    </span>
                    <div className="flex-1">
                        <h4
                            className={`text-sm font-bold ${execution.status === "error" ? "text-error" : "text-success"
                                }`}
                        >
                            {execution.status === "error"
                                ? "Dry Run Execution Failed"
                                : "Dry Run Succeeded"}
                        </h4>
                        <p className={`text-xs mt-1 ${execution.status === "error" ? "text-on-error-container" : "text-on-success-container"}`}>
                            {execution.message}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">

                        <div className="flex gap-1.5">
                            {totalErrors > 0 && (
                                <div className="text-[10px] bg-error/20 text-error px-2 py-1 rounded-md font-bold border border-error/20">
                                    {totalErrors} ERRORS
                                </div>
                            )}
                            {totalWarnings > 0 && (
                                <div className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded-md font-bold border border-amber-500/20">
                                    {totalWarnings} WARNINGS
                                </div>
                            )}
                        </div>
                        {totalErrors > 0 && (
                            // Fix #8: scroll to the first step with errors — do NOT re-run validation
                            <button
                                onClick={() => {
                                    // Find the first step that has errors (from existing results)
                                    const firstErrorStep = tasks.find(
                                        (t) => (groupedIssues[t.id]?.errors.length ?? 0) > 0,
                                    );
                                    if (firstErrorStep) {
                                        document
                                            .getElementById(`step-card-${firstErrorStep.id}`)
                                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }
                                }}
                                className="text-[10px] font-bold text-error uppercase tracking-wider hover:underline flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[14px]">
                                    keyboard_double_arrow_down
                                </span>
                                Focus First Error
                            </button>
                        )}
                    </div>
                </div>
            )}

            {validation.status === "success" && !hasAnyIssues && (
                <div className="mb-4 p-4 bg-tertiary/10 border border-tertiary/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <span className="material-symbols-outlined text-tertiary shrink-0">
                        check_circle
                    </span>
                    <div>
                        <h4 className="text-sm font-bold text-tertiary">
                            Flow is Valid
                        </h4>
                        <p className="text-xs text-on-surface mt-0.5 opacity-80">
                            Everything looks good. You can now safe run or dry run this sequence.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {tasks.map((task) => {
                    const isExpanded = expandedStepId === task.id;
                    const stepIssuesGrp = groupedIssues[task.id] || {
                        errors: [],
                        warnings: [],
                    };
                    const combinedStepIssues = [
                        ...stepIssuesGrp.errors,
                        ...stepIssuesGrp.warnings,
                    ];
                    const hasError = stepIssuesGrp.errors.length > 0;

                    return (
                        <TaskStepCard
                            key={task.id}
                            task={task}
                            isExpanded={isExpanded}
                            isErrorTarget={execution.failedStepId === task.id}
                            issues={combinedStepIssues}
                            onStepClick={onStepClick}
                            onSaveConfig={onSaveConfig}
                            onCancelConfig={onCancelConfig}
                            onToggleStatus={onToggleStatus}
                            onDelete={onDelete}
                            onTypeChange={onTypeChange}
                            onStepNameChange={onStepNameChange}
                            onStepDescriptionChange={onStepDescriptionChange}
                            onStepLabelChange={onStepLabelChange}
                            onTimeoutChange={onTimeoutChange}
                            onRetryCountChange={onRetryCountChange}
                            onRetryDelayChange={onRetryDelayChange}
                            onScreenshotModeChange={onScreenshotModeChange}
                            onConditionChange={onConditionChange}
                            onActionTargetChange={onActionTargetChange}
                            onActionInputValueChange={onActionInputValueChange}
                            onNavigationUrlChange={onNavigationUrlChange}
                            onAssertionTypeChange={onAssertionTypeChange}
                            onAssertionKindChange={onAssertionKindChange}
                            onAssertionExpectedValueChange={onAssertionExpectedValueChange}
                            onWaitConfigChange={onWaitConfigChange}
                            onDetectConfigChange={onDetectConfigChange}
                            onLoopConfigChange={onLoopConfigChange}
                            onBranchConfigChange={onBranchConfigChange}
                        />
                    );
                })}
            </div>
        </div>
    );
};
