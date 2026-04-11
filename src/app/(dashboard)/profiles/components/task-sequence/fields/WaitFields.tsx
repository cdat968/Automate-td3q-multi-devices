"use client";

import React from "react";
import { FormField } from "../../shared/FormField";
import type {
    AutomationStep,
    AutomationTarget,
    VisualTarget,
    WaitTabStepConfig,
    TabSwitchStepConfig,
    DelayStepConfig,
} from "../../../types/automation-step";
import type { ValidationIssue } from "../../../utils/step-validation";
import { getFieldError, getFieldWarning } from "../../../utils/validation-helpers";
import { DomTargetEditor } from "./targets/DomTargetEditor";
import { VisualTargetEditor } from "./targets/VisualTargetEditor";

interface WaitFieldsProps {
    task: AutomationStep;
    issues: ValidationIssue[];
    onWaitConfigChange: (
        stepId: string,
        patch: Partial<WaitTabStepConfig> | Partial<TabSwitchStepConfig> | { state: "visible" | "hidden" | "presence" } | { durationMs: number },
    ) => void;
    onActionTargetChange: (stepId: string, target: AutomationTarget) => void;
}

export const WaitFields: React.FC<WaitFieldsProps> = ({
    task,
    issues,
    onWaitConfigChange,
    onActionTargetChange,
}) => {
    const { config } = task;

    // ── wait_dom ────────────────────────────────────────────────────────────
    if (config.kind === "wait_dom") {
        const selectorError = getFieldError(issues, ["config.target.selector", "config.target"]);
        const selectorWarning = getFieldWarning(issues, ["config.target.selector", "config.target"]);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                <DomTargetEditor
                    target={config.target}
                    onChange={(target) => onActionTargetChange(task.id, target)}
                    error={selectorError}
                    warning={selectorWarning}
                />

                <FormField label="Wait State">
                    <div className="relative">
                        <select
                            value={config.state}
                            onChange={(e) => onWaitConfigChange(task.id, { state: e.target.value as "visible" | "hidden" | "presence" })}
                            className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="visible">visible</option>
                            <option value="hidden">hidden</option>
                            <option value="presence">presence</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">arrow_drop_down</span>
                    </div>
                </FormField>
            </div>
        );
    }

    // ── wait_visual ─────────────────────────────────────────────────────────
    if (config.kind === "wait_visual") {
        const targetError = getFieldError(issues, ["config.target.assetId", "config.target.text", "config.target"]);
        const targetWarning = getFieldWarning(issues, ["config.target.assetId", "config.target.text", "config.target"]);
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                <VisualTargetEditor
                    target={config.target}
                    onChange={(target) => onActionTargetChange(task.id, target)}
                    error={targetError}
                    warning={targetWarning}
                />

                <FormField label="Wait State">
                    <div className="relative">
                        <select
                            value={config.state}
                            onChange={(e) => onWaitConfigChange(task.id, { state: e.target.value as "visible" | "hidden" | "presence" })}
                            className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="visible">visible</option>
                            <option value="hidden">hidden</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">arrow_drop_down</span>
                    </div>
                </FormField>
            </div>
        );
    }

    // ── wait_tab ─────────────────────────────────────────────────────────────
    if (config.kind === "wait_tab") {
        const patternError = getFieldError(issues, "config.pattern");
        const patternWarning = getFieldWarning(issues, "config.pattern");

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                <FormField label="Tab Match Mode">
                    <div className="relative">
                        <select
                            value={config.mode}
                            onChange={(e) =>
                                onWaitConfigChange(task.id, {
                                    mode: e.target.value as WaitTabStepConfig["mode"],
                                })
                            }
                            className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="new_tab">New Tab</option>
                            <option value="url_match">URL Match</option>
                            <option value="title_match">Title Match</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">arrow_drop_down</span>
                    </div>
                </FormField>

                {config.mode !== "new_tab" && (
                    <FormField label="Match Pattern" error={patternError} warning={patternWarning}>
                        <input
                            type="text"
                            value={config.pattern ?? ""}
                            placeholder={config.mode === "url_match" ? "e.g. https://example.com/*" : "e.g. Dashboard - App"}
                            onChange={(e) =>
                                onWaitConfigChange(task.id, { pattern: e.target.value } as Partial<WaitTabStepConfig>)
                            }
                            className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                                patternError
                                    ? "border-error ring-1 ring-error/20 text-error placeholder:text-error/40"
                                    : patternWarning
                                      ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                      : "border-white/10 text-on-surface focus:border-primary"
                            }`}
                        />
                    </FormField>
                )}
            </div>
        );
    }

    // ── delay ────────────────────────────────────────────────────────────────
    if (config.kind === "delay") {
        const durationError = getFieldError(issues, "config.durationMs");
        const durationWarning = getFieldWarning(issues, "config.durationMs");

        return (
            <div className="grid grid-cols-1 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                <FormField label="Duration (ms)" error={durationError} warning={durationWarning}>
                    <div className="relative">
                        <input
                            type="number"
                            min={0}
                            value={(config as DelayStepConfig).durationMs}
                            onChange={(e) =>
                                onWaitConfigChange(task.id, { durationMs: Number(e.target.value || 0) })
                            }
                            className={`w-full font-mono bg-surface-container-low border rounded-lg px-3.5 py-2.5 pr-12 text-sm outline-none transition-all ${
                                durationError
                                    ? "border-error text-error"
                                    : durationWarning
                                      ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                      : "border-white/10 text-on-surface focus:border-primary"
                            }`}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">ms</span>
                    </div>
                </FormField>
            </div>
        );
    }

    return null;
};
