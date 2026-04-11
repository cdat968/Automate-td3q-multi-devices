"use client";

import React from "react";
import { FormField } from "../shared/FormField";
import { KindConfigPanel } from "./KindConfigPanel";
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
import type { ValidationIssue } from "../../utils/step-validation";
import { getFieldError, getFieldWarning } from "../../utils/validation-helpers";
import { STEP_TYPE_OPTIONS } from "../../constants/step-types";

interface TaskStepConfigPanelProps {
    task: AutomationStep;
    isErrorTarget: boolean;
    issues: ValidationIssue[];
    onTypeChange: (taskId: string, newType: StepType) => void;
    // Live-editor semantics:
    // onCancelConfig collapses the panel without reverting edits.
    // onSaveConfig collapses the panel and signals "done", optionally with a notification.
    onCancelConfig: () => void;
    onSaveConfig: () => void;

    onStepNameChange: (stepId: string, name: string) => void;
    onStepDescriptionChange: (stepId: string, description: string) => void;
    onStepLabelChange: (stepId: string, label: string) => void;
    onTimeoutChange: (stepId: string, timeoutSec: number) => void;
    onRetryCountChange: (stepId: string, retryCount: number) => void;
    onRetryDelayChange: (stepId: string, retryDelayMs: number) => void;
    onScreenshotModeChange: (stepId: string, mode: ScreenshotOnFailureMode) => void;
    onConditionChange: (stepId: string, condition: StepCondition | null) => void;

    onActionTargetChange: (stepId: string, target: AutomationTarget) => void;
    onActionInputValueChange: (stepId: string, value: string) => void;
    // Fix #1: navigation URL handler (never reused for action)
    onNavigationUrlChange: (stepId: string, url: string) => void;
    // Fix #2: per-field assertion handlers
    onAssertionTypeChange: (stepId: string, type: AssertionStepConfig["type"]) => void;
    onAssertionKindChange: (stepId: string, assertionKind: AssertionKind) => void;
    onAssertionExpectedValueChange: (stepId: string, expectedValue: string) => void;

    onWaitConfigChange: (
        stepId: string,
        patch: Partial<WaitTabStepConfig> | Partial<TabSwitchStepConfig> | { state: "visible" | "hidden" | "presence" } | { durationMs: number },
    ) => void;
    onDetectConfigChange: (stepId: string, patch: Partial<DetectionConfig>) => void;
    onLoopConfigChange: (stepId: string, patch: Partial<LoopStepConfig>) => void;
    onBranchConfigChange: (stepId: string, patch: Partial<BranchStepConfig>) => void;
}

export const TaskStepConfigPanel: React.FC<TaskStepConfigPanelProps> = ({
    task,
    isErrorTarget,
    issues,
    onTypeChange,
    onSaveConfig,
    onCancelConfig,

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
    const statusWarning = getFieldWarning(issues, "status");

    const nameError = getFieldError(issues, "name");
    const nameWarning = getFieldWarning(issues, "name");

    const labelError = getFieldError(issues, "label");
    const labelWarning = getFieldWarning(issues, "label");

    const timeoutError = getFieldError(issues, "runtime.timeoutSec");
    const timeoutWarning = getFieldWarning(issues, "runtime.timeoutSec");

    const retryCountError = getFieldError(issues, "runtime.retryCount");
    const retryCountWarning = getFieldWarning(issues, "runtime.retryCount");

    const retryDelayError = getFieldError(issues, "runtime.retryDelayMs");
    const retryDelayWarning = getFieldWarning(issues, "runtime.retryDelayMs");

    return (
        <div
            className="px-5 pb-5 pt-1 border-t border-white/5 text-sm cursor-default"
            onClick={(e) => e.stopPropagation()}
        >
            {statusWarning && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2.5 text-amber-500 text-xs font-medium">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    {statusWarning}
                </div>
            )}

            {/* Validation issues for this step */}
            {isErrorTarget && issues.some((i) => i.severity === "error") && (
                <div className="mb-4 p-3 bg-error/5 border border-error/20 rounded-lg space-y-1">
                    {issues
                        .filter((i) => i.severity === "error")
                        .map((issue, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-error">
                                <span className="material-symbols-outlined text-[14px] shrink-0">error</span>
                                {issue.message}
                            </div>
                        ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <FormField label="Step Name" error={nameError} warning={nameWarning}>
                    <input
                        type="text"
                        value={task.name}
                        onChange={(e) => onStepNameChange(task.id, e.target.value)}
                        className={`w-full bg-surface-container-lowest border rounded-lg px-3.5 py-2.5 text-sm outline-none shadow-inner transition-all ${
                            nameError
                                ? "border-error text-error focus:border-error ring-1 ring-error/20"
                                : nameWarning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-primary"
                        }`}
                    />
                </FormField>

                <FormField label="Step Kind">
                    <div className="relative">
                        <select
                            value={task.type}
                            onChange={(e) => onTypeChange(task.id, e.target.value as StepType)}
                            className="w-full bg-surface-container-lowest border border-primary/30 text-primary rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner transition-all appearance-none cursor-pointer font-bold"
                        >
                            {STEP_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[18px] pointer-events-none">
                            arrow_drop_down
                        </span>
                    </div>
                </FormField>

                <FormField label="Description">
                    <input
                        type="text"
                        value={task.description ?? ""}
                        onChange={(e) => onStepDescriptionChange(task.id, e.target.value)}
                        placeholder="Optional description..."
                        className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary shadow-inner transition-all"
                    />
                </FormField>

                <FormField label="Label" error={labelError} warning={labelWarning}>
                    <input
                        type="text"
                        value={task.label ?? ""}
                        onChange={(e) => onStepLabelChange(task.id, e.target.value)}
                        placeholder="Optional jump label..."
                        className={`w-full bg-surface-container-lowest border rounded-lg px-3.5 py-2.5 text-sm outline-none shadow-inner transition-all ${
                            labelError
                                ? "border-error text-error focus:border-error ring-1 ring-error/20"
                                : labelWarning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-primary"
                        }`}
                    />
                </FormField>

                <FormField label="Timeout (sec)" error={timeoutError} warning={timeoutWarning}>
                    <input
                        type="number"
                        min={1}
                        value={task.runtime.timeoutSec}
                        onChange={(e) => onTimeoutChange(task.id, Number(e.target.value || 0))}
                        className={`w-full bg-surface-container-lowest border rounded-lg px-3.5 py-2.5 text-sm font-mono outline-none shadow-inner transition-all ${
                            timeoutError
                                ? "border-error text-error focus:border-error ring-1 ring-error/20"
                                : timeoutWarning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-primary"
                        }`}
                    />
                </FormField>

                <FormField label="Retry Count" error={retryCountError} warning={retryCountWarning}>
                    <input
                        type="number"
                        min={0}
                        value={task.runtime.retryCount}
                        onChange={(e) => onRetryCountChange(task.id, Number(e.target.value || 0))}
                        className={`w-full bg-surface-container-lowest border rounded-lg px-3.5 py-2.5 text-sm font-mono outline-none shadow-inner transition-all ${
                            retryCountError
                                ? "border-error text-error focus:border-error ring-1 ring-error/20"
                                : retryCountWarning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-primary"
                        }`}
                    />
                </FormField>

                <FormField label="Retry Delay (ms)" error={retryDelayError} warning={retryDelayWarning}>
                    <input
                        type="number"
                        min={0}
                        value={task.runtime.retryDelayMs ?? 0}
                        onChange={(e) => onRetryDelayChange(task.id, Number(e.target.value || 0))}
                        className={`w-full bg-surface-container-lowest border rounded-lg px-3.5 py-2.5 text-sm font-mono outline-none shadow-inner transition-all ${
                            retryDelayError
                                ? "border-error text-error focus:border-error ring-1 ring-error/20"
                                : retryDelayWarning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-primary"
                        }`}
                    />
                </FormField>

                <FormField label="Screenshot on Failure">
                    <div className="relative">
                        <select
                            value={task.runtime.screenshotOnFailure}
                            onChange={(e) =>
                                onScreenshotModeChange(task.id, e.target.value as ScreenshotOnFailureMode)
                            }
                            className="w-full bg-surface-container-lowest border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary shadow-inner transition-all appearance-none cursor-pointer"
                        >
                            <option value="none">None</option>
                            <option value="full_screen">Full Screen</option>
                            <option value="target_region">Target Region</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                            arrow_drop_down
                        </span>
                    </div>
                </FormField>
            </div>

            <div className="pt-6 border-t border-white/5">
                <KindConfigPanel
                    task={task}
                    isErrorTarget={isErrorTarget}
                    issues={issues}
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
            </div>

            <div className="flex items-center gap-3 pt-5 mt-4 border-t border-white/5">
                <button
                    onClick={onCancelConfig}
                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                    Close
                </button>
                <button
                    onClick={onSaveConfig}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 shadow-glow transition-all"
                >
                    Done
                </button>
            </div>
        </div>
    );
};
