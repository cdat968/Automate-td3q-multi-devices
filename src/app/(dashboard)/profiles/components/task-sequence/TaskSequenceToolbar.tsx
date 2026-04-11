"use client";

import React from "react";
import { AddStepMenu } from "./AddStepMenu";

interface TaskSequenceToolbarProps {
    validationStatus: "idle" | "success" | "error";
    executionStatus: "idle" | "success" | "error";
    executionMessage?: string;
    failedStepId?: string | null;
    isValidating: boolean;
    isDryRunning: boolean;
    hasIssues: boolean;
    isAddStepOpen: boolean;
    onValidate: () => void;
    onDryRun: () => void;
    onToggleAddStep: () => void;
    onAddStep: (type: string) => void;
    addStepRef: React.RefObject<HTMLDivElement | null>;
}

export const TaskSequenceToolbar: React.FC<TaskSequenceToolbarProps> = ({
    validationStatus,
    executionStatus,
    executionMessage,
    failedStepId,
    isValidating,
    isDryRunning,
    hasIssues,
    isAddStepOpen,
    onValidate,
    onDryRun,
    onToggleAddStep,
    onAddStep,
    addStepRef,
}) => {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onValidate}
        disabled={isValidating || isDryRunning}
        className="px-4 py-2 border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface flex items-center gap-1.5 hover:bg-surface-variant transition-colors disabled:opacity-50"
      >
        {isValidating ? (
          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
        ) : (
          <span className="material-symbols-outlined text-sm">rule</span>
        )}
        Validate
      </button>

      <button
        onClick={onDryRun}
        disabled={isValidating || isDryRunning}
        className="px-4 py-2 bg-secondary-container text-on-secondary-container border border-secondary/20 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-colors disabled:opacity-50"
      >
        {isDryRunning ? (
          <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
        ) : (
          <span className="material-symbols-outlined text-sm pl-[1px]">play_arrow</span>
        )}
        Dry Run
      </button>

      <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

      <div className="flex gap-2">
        {validationStatus !== "idle" && (
          <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
            validationStatus === "error" ? "bg-error/10 border-error/20 text-error" : "bg-success/10 border-success/20 text-success"
          }`}>
            VALIDATION: {validationStatus.toUpperCase()}
          </div>
        )}
        {executionStatus !== "idle" && (
          <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
            executionStatus === "error" ? "bg-error/10 border-error/20 text-error" : "bg-success/10 border-success/20 text-success"
          }`}>
            DRY RUN: {executionStatus.toUpperCase()}
          </div>
        )}
      </div>

      <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

      <div className="relative">
        <button
          onClick={onToggleAddStep}
          className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-primary/20 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span> Add Step
        </button>

        <AddStepMenu isOpen={isAddStepOpen} onAddStep={onAddStep} menuRef={addStepRef} />
      </div>
    </div>
  );
};
