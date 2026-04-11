"use client";

import React from "react";
import { FormField } from "../../shared/FormField";
import type {
    AutomationStep,
    LoopStepConfig,
    StepCondition,
} from "../../../types/automation-step";
import type { ValidationIssue } from "../../../utils/step-validation";
import { getFieldError, getFieldWarning } from "../../../utils/validation-helpers";
import { StepConditionEditor } from "./editors/StepConditionEditor";

interface LoopFieldsProps {
    task: AutomationStep;
    issues: ValidationIssue[];
    onLoopConfigChange: (
        stepId: string,
        patch: Partial<LoopStepConfig>,
    ) => void;
}


function createDefaultLoopCondition(): StepCondition {
    return {
        source: { kind: "variable", name: "loopFlag" },
        operator: "eq",
        value: true,
    };
}

function parseBodyStepIds(raw: string): string[] {
    return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function formatBodyStepIds(stepIds?: string[]): string {
    return (stepIds ?? []).join(", ");
}

export const LoopFields: React.FC<LoopFieldsProps> = ({
    task,
    issues,
    onLoopConfigChange,
}) => {
    if (task.config.kind !== "loop") return null;

    const config = task.config;
    const condition = config.untilCondition ?? createDefaultLoopCondition();

    const countError = getFieldError(issues, "config.count");
    const countWarning = getFieldWarning(issues, "config.count");

    const bodyError = getFieldError(issues, "config.bodyStepIds");
    const bodyWarning = getFieldWarning(issues, "config.bodyStepIds");

    const delayError = getFieldError(issues, "config.delayBetweenIterationsMs");
    const delayWarning = getFieldWarning(
        issues,
        "config.delayBetweenIterationsMs",
    );

    const condKeyError = getFieldError(issues, "config.untilCondition.source");
    const condKeyWarning = getFieldWarning(
        issues,
        "config.untilCondition.source",
    );

    const condValueError = getFieldError(issues, "config.untilCondition.value");
    const condValueWarning = getFieldWarning(
        issues,
        "config.untilCondition.value",
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
            <FormField label="Loop Mode">
                <div className="relative">
                    <select
                        value={config.mode}
                        onChange={(e) => {
                            const nextMode = e.target
                                .value as LoopStepConfig["mode"];

                            onLoopConfigChange(task.id, {
                                mode: nextMode,
                                count:
                                    nextMode === "count"
                                        ? (config.count ?? 10)
                                        : undefined,
                                untilCondition:
                                    nextMode === "until_condition"
                                        ? (config.untilCondition ??
                                          createDefaultLoopCondition())
                                        : null,
                            });
                        }}
                        className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                        <option value="count">count</option>
                        <option value="until_condition">until_condition</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                        arrow_drop_down
                    </span>
                </div>
            </FormField>

            <FormField
                label="Delay Between Iterations (ms)"
                error={delayError}
                warning={delayWarning}
            >
                <input
                    type="number"
                    min={0}
                    value={config.delayBetweenIterationsMs ?? 0}
                    onChange={(e) =>
                        onLoopConfigChange(task.id, {
                            delayBetweenIterationsMs: Number(
                                e.target.value || 0,
                            ),
                        })
                    }
                    className={`w-full font-mono bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                        delayError
                            ? "border-error text-error focus:border-error"
                            : delayWarning
                              ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                              : "border-white/10 text-on-surface focus:border-primary"
                    }`}
                />
            </FormField>

            {config.mode === "count" && (
                <FormField
                    label="Loop Count"
                    error={countError}
                    warning={countWarning}
                >
                    <input
                        type="number"
                        min={1}
                        value={config.count ?? 1}
                        onChange={(e) =>
                            onLoopConfigChange(task.id, {
                                count: Number(e.target.value || 1),
                            })
                        }
                        className={`w-full font-mono bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                            countError
                                ? "border-error text-error focus:border-error"
                                : countWarning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-primary"
                        }`}
                    />
                </FormField>
            )}

            {config.mode === "until_condition" && (
                <StepConditionEditor
                    condition={condition}
                    onChange={(newCondition) =>
                        onLoopConfigChange(task.id, {
                            untilCondition: newCondition,
                        })
                    }
                    errorSource={condKeyError}
                    warningSource={condKeyWarning}
                    errorValue={condValueError}
                    warningValue={condValueWarning}
                />
            )}

            <FormField
                label="Body Step IDs"
                className="col-span-1 md:col-span-2"
                error={bodyError}
                warning={bodyWarning}
            >
                <input
                    type="text"
                    value={formatBodyStepIds(config.bodyStepIds)}
                    placeholder="e.g. step_2, step_3, step_4"
                    onChange={(e) =>
                        onLoopConfigChange(task.id, {
                            bodyStepIds: parseBodyStepIds(e.target.value),
                        })
                    }
                    className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                        bodyError
                            ? "border-error text-error placeholder:text-error/40 focus:border-error"
                            : bodyWarning
                              ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                              : "border-white/10 text-on-surface focus:border-primary"
                    }`}
                />
            </FormField>
        </div>
    );
};
