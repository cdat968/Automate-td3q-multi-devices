"use client";

import React from "react";
import { FormField } from "../../../shared/FormField";
import type {
    ConditionOperator,
    ConditionSource,
    StepCondition,
} from "../../../../types/automation-step";

export const CONDITION_OPERATORS: ConditionOperator[] = [
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "contains",
    "exists",
    "not_exists",
    "matches",
];

export function getConditionKey(source: ConditionSource): string {
    switch (source.kind) {
        case "state":
            return source.key;
        case "context":
            return source.key;
        case "detect":
            return source.targetId;
        case "variable":
            return source.name;
        default:
            return "";
    }
}

export function buildConditionSource(
    kind: ConditionSource["kind"],
    rawKey: string,
): ConditionSource {
    switch (kind) {
        case "state":
            return { kind: "state", key: rawKey };
        case "context":
            return { kind: "context", key: rawKey };
        case "detect":
            return { kind: "detect", targetId: rawKey };
        case "variable":
        default:
            return { kind: "variable", name: rawKey };
    }
}

interface StepConditionEditorProps {
    condition: StepCondition;
    onChange: (condition: StepCondition) => void;
    errorSource?: string;
    warningSource?: string;
    errorValue?: string;
    warningValue?: string;
}

export const StepConditionEditor: React.FC<StepConditionEditorProps> = ({
    condition,
    onChange,
    errorSource,
    warningSource,
    errorValue,
    warningValue,
}) => {
    const operatorRequiresValue =
        condition.operator !== "exists" && condition.operator !== "not_exists";

    return (
        <>
            <FormField label="Condition Source Type">
                <div className="relative">
                    <select
                        value={condition.source.kind}
                        onChange={(e) =>
                            onChange({
                                ...condition,
                                source: buildConditionSource(
                                    e.target.value as ConditionSource["kind"],
                                    getConditionKey(condition.source),
                                ),
                            })
                        }
                        className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                        <option value="state">state</option>
                        <option value="context">context</option>
                        <option value="detect">detect</option>
                        <option value="variable">variable</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                        arrow_drop_down
                    </span>
                </div>
            </FormField>

            <FormField
                label="Condition Key / Name"
                error={errorSource}
                warning={warningSource}
            >
                <input
                    type="text"
                    value={getConditionKey(condition.source)}
                    placeholder="e.g. hp, isVisible, detectResult"
                    onChange={(e) =>
                        onChange({
                            ...condition,
                            source: buildConditionSource(
                                condition.source.kind,
                                e.target.value,
                            ),
                        })
                    }
                    className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                        errorSource
                            ? "border-error text-error placeholder:text-error/40 focus:border-error"
                            : warningSource
                              ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                              : "border-white/10 text-on-surface focus:border-primary"
                    }`}
                />
            </FormField>

            <FormField label="Operator">
                <div className="relative">
                    <select
                        value={condition.operator}
                        onChange={(e) =>
                            onChange({
                                ...condition,
                                operator: e.target.value as ConditionOperator,
                            })
                        }
                        className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                        {CONDITION_OPERATORS.map((operator) => (
                            <option key={operator} value={operator}>
                                {operator}
                            </option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                        arrow_drop_down
                    </span>
                </div>
            </FormField>

            <FormField
                label="Condition Value"
                error={errorValue}
                warning={warningValue}
            >
                <input
                    type="text"
                    value={
                        condition.value === undefined
                            ? ""
                            : String(condition.value)
                    }
                    disabled={!operatorRequiresValue}
                    placeholder="e.g. true / 10 / done"
                    onChange={(e) =>
                        onChange({
                            ...condition,
                            value: e.target.value,
                        })
                    }
                    className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all disabled:opacity-50 ${
                        errorValue
                            ? "border-error text-error placeholder:text-error/40 focus:border-error"
                            : warningValue
                              ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                              : "border-white/10 text-on-surface focus:border-primary"
                    }`}
                />
            </FormField>
        </>
    );
};
