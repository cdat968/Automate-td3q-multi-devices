"use client";

import React from "react";
import { FormField } from "../../shared/FormField";
import type {
    AutomationStep,
    AutomationTarget,
    DomTarget,
    VisualTarget,
} from "../../../types/automation-step";
import type { ValidationIssue } from "../../../utils/step-validation";
import { getFieldError, getFieldWarning } from "../../../utils/validation-helpers";
import { DomTargetEditor } from "./targets/DomTargetEditor";
import { VisualTargetEditor } from "./targets/VisualTargetEditor";

interface ActionFieldsProps {
    task: AutomationStep;
    isErrorTarget: boolean;
    issues: ValidationIssue[];
    onActionTargetChange: (stepId: string, target: AutomationTarget) => void;
    onActionInputValueChange: (stepId: string, value: string) => void;
}


export const ActionFields: React.FC<ActionFieldsProps> = ({
    task,
    isErrorTarget: _ignored,
    issues,
    onActionTargetChange,
    onActionInputValueChange,
}) => {
    const { config } = task;

    // DOM Click
    if (config.kind === "dom_click") {
        const selectorError = getFieldError(issues, ["config.target.selector", "config.target"]);
        const selectorWarning = getFieldWarning(issues, ["config.target.selector", "config.target"]);

        return (
            <div className="grid grid-cols-1 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                <DomTargetEditor
                    target={config.target}
                    onChange={(target) => onActionTargetChange(task.id, target)}
                    error={selectorError}
                    warning={selectorWarning}
                />
            </div>
        );
    }

    // DOM Type
    if (config.kind === "dom_type") {
        const selectorError = getFieldError(issues, ["config.target.selector", "config.target"]);
        const selectorWarning = getFieldWarning(issues, ["config.target.selector", "config.target"]);
        const valueError = getFieldError(issues, "config.value");
        const valueWarning = getFieldWarning(issues, "config.value");

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                <DomTargetEditor
                    target={config.target}
                    onChange={(target) => onActionTargetChange(task.id, target)}
                    error={selectorError}
                    warning={selectorWarning}
                />
                
                <div /> {/* spacer if needed */}

                <FormField label="Text to Type" error={valueError} warning={valueWarning} className="col-span-1 md:col-span-2">
                    <input
                        type="text"
                        value={config.value}
                        placeholder="Text to enter into the field..."
                        onChange={(e) => onActionInputValueChange(task.id, e.target.value)}
                        className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                            valueError
                                ? "border-error ring-1 ring-error/20 text-error placeholder:text-error/40"
                                : valueWarning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
                        }`}
                    />
                </FormField>
            </div>
        );
    }

    // Visual Click / Visual Type
    if (config.kind === "visual_click" || config.kind === "visual_type") {
        const targetError = getFieldError(issues, ["config.target.assetId", "config.target.text", "config.target"]);
        const targetWarning = getFieldWarning(issues, ["config.target.assetId", "config.target.text", "config.target"]);
        const valueError = config.kind === "visual_type" ? getFieldError(issues, "config.value") : undefined;
        const valueWarning = config.kind === "visual_type" ? getFieldWarning(issues, "config.value") : undefined;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                <VisualTargetEditor
                    target={config.target}
                    onChange={(target) => onActionTargetChange(task.id, target)}
                    error={targetError}
                    warning={targetWarning}
                />

                {config.kind === "visual_type" && (
                    <FormField label="Text to Type" error={valueError} warning={valueWarning} className="col-span-1 md:col-span-2">
                        <input
                            type="text"
                            value={config.value}
                            placeholder="Text to enter..."
                            onChange={(e) => onActionInputValueChange(task.id, e.target.value)}
                            className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                                valueError
                                    ? "border-error ring-1 ring-error/20 text-error"
                                    : valueWarning
                                      ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                      : "border-white/10 text-on-surface focus:border-primary"
                            }`}
                        />
                    </FormField>
                )}
            </div>
        );
    }

    return null;
};
