"use client";

import React from "react";
import { ActionFields } from "./fields/ActionFields";
import { WaitFields } from "./fields/WaitFields";
import { DetectFields } from "./fields/DetectFields";
import { LoopFields } from "./fields/LoopFields";
import { BranchFields } from "./fields/BranchFields";

import type {
    AutomationStep,
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

interface KindConfigPanelProps {
    task: AutomationStep;
    isErrorTarget: boolean;
    issues: ValidationIssue[];

    onConditionChange: (stepId: string, condition: StepCondition | null) => void;

    onActionTargetChange: (stepId: string, target: AutomationTarget) => void;
    onActionInputValueChange: (stepId: string, value: string) => void;

    // Fix #1: named URL handler — never shared with action fields
    onNavigationUrlChange: (stepId: string, url: string) => void;

    // Fix #2: named assertion handlers — each prop maps one field
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

export const KindConfigPanel: React.FC<KindConfigPanelProps> = ({
    task,
    isErrorTarget,
    issues,
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
    const kind = task.config.kind;

    // ── DOM / Visual Action kinds ────────────────────────────────────────────
    if (
        kind === "dom_click" ||
        kind === "dom_type" ||
        kind === "visual_click" ||
        kind === "visual_type"
    ) {
        return (
            <ActionFields
                task={task}
                isErrorTarget={isErrorTarget}
                issues={issues}
                onActionTargetChange={onActionTargetChange}
                onActionInputValueChange={onActionInputValueChange}
            />
        );
    }

    // ── Wait / Delay kinds ───────────────────────────────────────────────────
    if (
        kind === "wait_dom" ||
        kind === "wait_visual" ||
        kind === "wait_tab" ||
        kind === "delay"
    ) {
        return (
            <WaitFields
                task={task}
                issues={issues}
                onWaitConfigChange={onWaitConfigChange}
                onActionTargetChange={onActionTargetChange}
            />
        );
    }

    // ── Navigation / Tab / Assertion kinds ───────────────────────────────────
    if (
        kind === "navigation" ||
        kind === "tab_management" ||
        kind === "assertion"
    ) {
        return (
            <DetectFields
                task={task}
                issues={issues}
                onDetectConfigChange={onDetectConfigChange}
                onActionTargetChange={onActionTargetChange}
                onNavigationUrlChange={onNavigationUrlChange}
                onAssertionTypeChange={onAssertionTypeChange}
                onAssertionKindChange={onAssertionKindChange}
                onAssertionExpectedValueChange={onAssertionExpectedValueChange}
                onWaitConfigChange={onWaitConfigChange}
            />
        );
    }

    // ── Loop ─────────────────────────────────────────────────────────────────
    if (kind === "loop") {
        return (
            <LoopFields
                task={task}
                issues={issues}
                onLoopConfigChange={onLoopConfigChange}
            />
        );
    }

    // ── Branch ───────────────────────────────────────────────────────────────
    if (kind === "branch") {
        return (
            <BranchFields
                task={task}
                issues={issues}
                onConditionChange={onConditionChange}
                onBranchConfigChange={onBranchConfigChange}
            />
        );
    }

    return null;
};
