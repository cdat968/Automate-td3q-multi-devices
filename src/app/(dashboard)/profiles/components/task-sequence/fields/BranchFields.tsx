"use client";

import React from "react";
import { FormField } from "../../shared/FormField";
import type {
    AutomationStep,
    BranchStepConfig,
    StepCondition,
} from "../../../types/automation-step";
import type { ValidationIssue } from "../../../utils/step-validation";
import { getFieldError, getFieldWarning } from "../../../utils/validation-helpers";
import { StepConditionEditor } from "./editors/StepConditionEditor";
import { BranchTargetEditor } from "./editors/BranchTargetEditor";

interface BranchFieldsProps {
    task: AutomationStep;
    issues: ValidationIssue[];
    onConditionChange: (
        stepId: string,
        condition: StepCondition | null,
    ) => void;
    onBranchConfigChange: (
        stepId: string,
        patch: Partial<BranchStepConfig>,
    ) => void;
}


export const BranchFields: React.FC<BranchFieldsProps> = ({
    task,
    issues,
    onConditionChange,
    onBranchConfigChange,
}) => {
    if (task.config.kind !== "branch") return null;

    const config = task.config;
    const condition = config.ifCondition;
    const condKeyError = getFieldError(issues, "config.ifCondition.source");
    const condKeyWarning = getFieldWarning(issues, "config.ifCondition.source");

    const condValueError = getFieldError(issues, "config.ifCondition.value");
    const condValueWarning = getFieldWarning(issues, "config.ifCondition.value");

    const onTrueError = getFieldError(issues, ["config.onTrue.stepId", "config.onTrue.label", "config.onTrue"]);
    const onTrueWarning = getFieldWarning(issues, ["config.onTrue.stepId", "config.onTrue.label", "config.onTrue"]);

    const onFalseError = getFieldError(issues, ["config.onFalse.stepId", "config.onFalse.label", "config.onFalse"]);
    const onFalseWarning = getFieldWarning(issues, ["config.onFalse.stepId", "config.onFalse.label", "config.onFalse"]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
            <StepConditionEditor
                condition={condition}
                onChange={(newCondition) =>
                    onConditionChange(task.id, newCondition)
                }
                errorSource={condKeyError}
                warningSource={condKeyWarning}
                errorValue={condValueError}
                warningValue={condValueWarning}
            />

            <BranchTargetEditor
                label="True Path"
                target={config.onTrue}
                onChange={(newTarget) =>
                    onBranchConfigChange(task.id, { onTrue: newTarget })
                }
                error={onTrueError}
                warning={onTrueWarning}
                labelExtra={
                    <span className="flex items-center gap-1 text-secondary">
                        <span className="material-symbols-outlined text-[14px]">
                            check_circle
                        </span>
                    </span>
                }
            />

            <BranchTargetEditor
                label="False Path"
                target={config.onFalse}
                onChange={(newTarget) =>
                    onBranchConfigChange(task.id, { onFalse: newTarget })
                }
                error={onFalseError}
                warning={onFalseWarning}
                labelExtra={
                    <span className="flex items-center gap-1 text-error">
                        <span className="material-symbols-outlined text-[14px]">
                            cancel
                        </span>
                    </span>
                }
            />
        </div>
    );
};
