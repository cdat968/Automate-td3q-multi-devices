"use client";

import React from "react";
import { FormField } from "../../../shared/FormField";
import type { BranchTarget } from "../../../../types/automation-step";

export function branchTargetTypeToSelectValue(
    target: BranchTarget,
): BranchTarget["type"] {
    return target.type;
}

export function buildBranchTarget(
    type: BranchTarget["type"],
    current?: BranchTarget,
): BranchTarget {
    switch (type) {
        case "next_step":
            return { type: "next_step" };
        case "skip_step":
            return { type: "skip_step" };
        case "stop_flow":
            return { type: "stop_flow" };
        case "goto_step":
            return {
                type: "goto_step",
                stepId: current?.type === "goto_step" ? current.stepId : "",
            };
        case "goto_label":
            return {
                type: "goto_label",
                label: current?.type === "goto_label" ? current.label : "",
            };
        default: {
            const exhaustiveCheck: never = type;
            throw new Error(
                `Unsupported branch target type: ${exhaustiveCheck}`,
            );
        }
    }
}

export function updateGotoStepTarget(stepId: string): BranchTarget {
    return {
        type: "goto_step",
        stepId,
    };
}

export function updateGotoLabelTarget(label: string): BranchTarget {
    return {
        type: "goto_label",
        label,
    };
}

interface BranchTargetEditorProps {
    label: string;
    target: BranchTarget;
    onChange: (target: BranchTarget) => void;
    error?: string;
    warning?: string;
    labelExtra?: React.ReactNode;
}

export const BranchTargetEditor: React.FC<BranchTargetEditorProps> = ({
    label,
    target,
    onChange,
    error,
    warning,
    labelExtra,
}) => {
    return (
        <>
            <FormField
                label={label}
                error={error}
                warning={warning}
                labelExtra={labelExtra}
            >
                <div className="relative">
                    <select
                        value={branchTargetTypeToSelectValue(target)}
                        onChange={(e) =>
                            onChange(
                                buildBranchTarget(
                                    e.target.value as BranchTarget["type"],
                                    target,
                                ),
                            )
                        }
                        className={`w-full bg-surface-container-low border rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none transition-all appearance-none cursor-pointer ${
                            error
                                ? "border-error text-error focus:border-error"
                                : warning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-secondary"
                        }`}
                    >
                        <option value="next_step">next_step</option>
                        <option value="skip_step">skip_step</option>
                        <option value="goto_step">goto_step</option>
                        <option value="goto_label">goto_label</option>
                        <option value="stop_flow">stop_flow</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                        arrow_drop_down
                    </span>
                </div>
            </FormField>

            {target.type === "goto_step" && (
                <FormField
                    label={`${label} Step ID`}
                    error={error}
                    warning={warning}
                >
                    <input
                        type="text"
                        value={target.stepId}
                        placeholder="Target step id"
                        onChange={(e) =>
                            onChange(updateGotoStepTarget(e.target.value))
                        }
                        className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                            error
                                ? "border-error text-error placeholder:text-error/40 focus:border-error"
                                : warning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-secondary"
                        }`}
                    />
                </FormField>
            )}

            {target.type === "goto_label" && (
                <FormField
                    label={`${label} Label`}
                    error={error}
                    warning={warning}
                >
                    <input
                        type="text"
                        value={target.label}
                        placeholder="Target label"
                        onChange={(e) =>
                            onChange(updateGotoLabelTarget(e.target.value))
                        }
                        className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                            error
                                ? "border-error text-error placeholder:text-error/40 focus:border-error"
                                : warning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-secondary"
                        }`}
                    />
                </FormField>
            )}
        </>
    );
};
