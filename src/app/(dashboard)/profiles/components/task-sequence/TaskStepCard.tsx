"use client";

import React from "react";
import { ToggleSwitch } from "../shared/ToggleSwitch";
import { IconButton } from "../shared/IconButton";
import { TaskStepConfigPanel } from "./TaskStepConfigPanel";
import type {
    AutomationStep,
    StepType,
    ScreenshotOnFailureMode,
    AutomationTarget,
    DetectionConfig,
    LoopStepConfig,
    BranchStepConfig,
    AssertionKind,
    AssertionStepConfig,
    StepCondition,
    WaitTabStepConfig,
    TabSwitchStepConfig,
} from "../../types/automation-step";
import type { ValidationIssue } from "../../utils/step-validation";
import { STEP_TYPE_LABEL_MAP, STEP_TYPE_ICON_MAP } from "../../constants/step-types";

interface TaskStepCardProps {
    task: AutomationStep;
    isExpanded: boolean;
    isErrorTarget: boolean;
    issues: ValidationIssue[];
    onStepClick: (taskId: string) => void;
    onSaveConfig: (taskId: string) => void;
    onCancelConfig: (taskId: string) => void;
    onToggleStatus: (taskId: string, e: React.MouseEvent) => void;
    onDelete: (taskId: string, e: React.MouseEvent) => void;
    onTypeChange: (taskId: string, newType: StepType) => void;

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
    // Fix #1 + #2: named handlers
    onNavigationUrlChange: (stepId: string, url: string) => void;
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

/** Returns a short summary of the step's primary target/config for the card header */
function getStepTargetSummary(task: AutomationStep): string | null {
    const { config } = task;
    switch (config.kind) {
        case "dom_click":
        case "dom_type":
        case "wait_dom":
            return config.target.selector
                ? config.target.selector.length > 28
                    ? config.target.selector.slice(0, 28) + "…"
                    : config.target.selector
                : null;
        case "visual_click":
        case "visual_type":
        case "wait_visual":
            if (config.target.kind === "ocr-text") return config.target.text || null;
            return config.target.assetId || null;
        case "navigation":
            return config.url.replace(/^https?:\/\//, "").slice(0, 30) || null;
        case "tab_management":
            return config.mode === "by_title"
                ? (config.title ?? null)
                : config.mode === "by_url"
                  ? (config.url ?? null)
                  : `index ${config.index ?? 0}`;
        case "delay":
            return `${config.durationMs}ms`;
        case "wait_tab":
            return config.pattern ?? config.mode;
        case "loop":
            return config.mode === "count" ? `×${config.count ?? 1}` : "until condition";
        case "branch":
            return null;
        case "assertion":
            return config.assertionKind;
        default:
            return null;
    }
}

const screenshotModeLabel: Record<ScreenshotOnFailureMode, string> = {
    none: "On Fail: None",
    full_screen: "On Fail: Snap",
    target_region: "On Fail: Region",
};

export const TaskStepCard: React.FC<TaskStepCardProps> = ({
    task,
    isExpanded,
    isErrorTarget: _ignored,
    issues,
    onStepClick,
    onSaveConfig,
    onCancelConfig,
    onToggleStatus,
    onDelete,
    onTypeChange,
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
    const isDisabled = task.status === "disabled";
    const hasStepErrors = issues.some((i) => i.severity === "error");
    const hasStepWarnings = issues.some((i) => i.severity === "warning");

    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    const kindLabel = STEP_TYPE_LABEL_MAP[task.config.kind];
    const kindIcon = task.ui?.icon ?? STEP_TYPE_ICON_MAP[task.config.kind] ?? "play_arrow";
    const targetSummary = getStepTargetSummary(task);

    return (
        <div
            id={`step-card-${task.id}`}
            className={`rounded-xl border transition-all duration-300 ${
                isExpanded
                    ? "border-l-4 border-l-primary border-t-white/5 border-r-white/5 border-b-white/5 bg-surface-container-high shadow-lg"
                    : hasStepErrors
                      ? "border-error border-l-4 border-l-error bg-error-container/5"
                      : hasStepWarnings
                        ? "border-amber-500/50 border-l-4 border-l-amber-500 bg-amber-500/5"
                        : isDisabled
                          ? "border-white/5 bg-surface-container-lowest"
                          : "border-white/5 bg-surface-container-low hover:border-white/10 hover:bg-surface-container-high"
            }`}
        >
            <div
                onClick={() => !isDisabled && onStepClick(task.id)}
                className={`flex items-center gap-4 p-4 transition-colors ${
                    isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                } group`}
            >
                {/* Order badge */}
                <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border transition-colors ${
                        isDisabled
                            ? "bg-surface-variant/30 text-outline border-transparent"
                            : hasStepErrors
                              ? "bg-error text-error-container border-error"
                              : hasStepWarnings
                                ? "bg-amber-500 text-amber-950 border-amber-500/50"
                                : "bg-surface text-outline border-white/5 group-hover:bg-surface-variant"
                    }`}
                >
                    {task.order}
                </div>

                {/* Kind icon */}
                <div
                    className={`p-2 rounded-lg shrink-0 border transition-colors ${
                        isDisabled
                            ? "bg-surface-variant/30 border-transparent"
                            : hasStepErrors
                              ? "bg-error/10 border-error/20"
                              : hasStepWarnings
                                ? "bg-amber-500/10 border-amber-500/20"
                                : "bg-surface border-white/5"
                    }`}
                >
                    <span
                        className={`material-symbols-outlined text-sm transition-colors ${
                            isDisabled
                                ? "text-outline/50"
                                : hasStepErrors
                                  ? "text-error"
                                  : hasStepWarnings
                                    ? "text-amber-500"
                                    : isExpanded
                                      ? "text-primary"
                                      : "text-outline"
                        } group-hover:text-primary`}
                    >
                        {kindIcon}
                    </span>
                </div>

                {/* Name + meta row */}
                <div className="flex-1 min-w-0 flex flex-col items-start">
                    <div className="flex items-center justify-between w-full pr-4">
                        <p
                            className={`text-sm font-bold truncate transition-all ${
                                isExpanded ? "text-primary" : "text-on-surface"
                            } ${isDisabled ? "line-through opacity-40" : ""}`}
                        >
                            {task.name}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1 w-full flex-wrap">
                        {/* Kind badge */}
                        <span
                            className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
                                isDisabled
                                    ? "opacity-40 text-outline"
                                    : "text-primary/70 bg-primary/10"
                            }`}
                        >
                            {kindLabel}
                        </span>

                        {/* Target summary */}
                        {targetSummary && !isDisabled && (
                            <span className="text-[10px] text-on-surface-variant font-mono truncate max-w-[140px]">
                                {targetSummary}
                            </span>
                        )}

                        {/* Issue count badges */}
                        {!isDisabled && errorCount > 0 && (
                            <span className="text-[9px] bg-error/20 text-error border border-error/20 px-1.5 py-0.5 rounded font-bold">
                                {errorCount} ERR
                            </span>
                        )}
                        {!isDisabled && warningCount > 0 && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                                {warningCount} WARN
                            </span>
                        )}

                        {/* Screenshot mode */}
                        {!isDisabled && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border bg-surface-container-lowest border-white/10 text-on-surface-variant ml-1 transition-all">
                                <span className="material-symbols-outlined text-[10px]">camera</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:block">
                                    {screenshotModeLabel[task.runtime.screenshotOnFailure]}
                                </span>
                            </div>
                        )}

                        {/* Step label tag */}
                        {task.label && (
                            <span className="text-[9px] bg-surface-variant text-on-surface-variant border border-white/10 px-1.5 py-0.5 rounded font-mono">
                                #{task.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 shrink-0">
                    <ToggleSwitch
                        enabled={!isDisabled}
                        onChange={(e) => onToggleStatus(task.id, e)}
                        title="Toggle Enabled/Disabled"
                    />

                    <div className="w-[1px] h-4 bg-white/10 mx-1 hidden sm:block" />

                    <IconButton
                        icon="delete"
                        onClick={(e) => onDelete(task.id, e)}
                        title="Delete Step"
                        className="text-outline hover:text-error hover:bg-error/10 rounded-md opacity-0 group-hover:opacity-100"
                    />

                    <IconButton
                        icon={isExpanded ? "expand_less" : "edit"}
                        onClick={(e) => {
                            e.stopPropagation();
                            onStepClick(task.id);
                        }}
                        className="hover:bg-surface rounded-md text-outline hover:text-on-surface"
                    />
                </div>
            </div>

            {/* Expandable config panel */}
            <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out origin-top ${
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <div className="overflow-hidden">
                    {isExpanded && (
                        <TaskStepConfigPanel
                            task={task}
                            isErrorTarget={hasStepErrors}
                            issues={issues}
                            onTypeChange={onTypeChange}
                            onSaveConfig={() => onSaveConfig(task.id)}
                            onCancelConfig={() => onCancelConfig(task.id)}
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
                    )}
                </div>
            </div>
        </div>
    );
};
