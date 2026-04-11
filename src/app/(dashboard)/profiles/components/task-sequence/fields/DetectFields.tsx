"use client";

import React from "react";
import { FormField } from "../../shared/FormField";
import type {
    AutomationStep,
    TabSwitchStepConfig,
    AssertionStepConfig,
    AssertionKind,
    AutomationTarget,
    VisualTarget,
    DetectionConfig,
    DomTarget,
} from "../../../types/automation-step";
import type { ValidationIssue } from "../../../utils/step-validation";
import { getFieldError, getFieldWarning } from "../../../utils/validation-helpers";
import { DomTargetEditor } from "./targets/DomTargetEditor";

interface DetectFieldsProps {
    task: AutomationStep;
    issues: ValidationIssue[];
    onDetectConfigChange: (stepId: string, patch: Partial<DetectionConfig>) => void;
    onActionTargetChange: (stepId: string, target: AutomationTarget) => void;
    // Fix #1: dedicated URL handler for navigation — never shared with action kinds
    onNavigationUrlChange: (stepId: string, url: string) => void;
    // Fix #2: dedicated assertion handlers — each field mapped to its own prop
    onAssertionTypeChange: (stepId: string, type: AssertionStepConfig["type"]) => void;
    onAssertionKindChange: (stepId: string, assertionKind: AssertionKind) => void;
    onAssertionExpectedValueChange: (stepId: string, expectedValue: string) => void;
    onWaitConfigChange: (
        stepId: string,
        patch: Partial<TabSwitchStepConfig>,
    ) => void;
}

export const DetectFields: React.FC<DetectFieldsProps> = ({
    task,
    issues,
    onActionTargetChange,
    onNavigationUrlChange,
    onAssertionTypeChange,
    onAssertionKindChange,
    onAssertionExpectedValueChange,
    onWaitConfigChange,
}) => {
    const { config } = task;

    // ── navigation ──────────────────────────────────────────────────────────
    // Fix #1: uses dedicated onNavigationUrlChange, not onActionInputValueChange
    if (config.kind === "navigation") {
        const urlError = getFieldError(issues, "config.url");
        const urlWarning = getFieldWarning(issues, "config.url");

        return (
            <div className="grid grid-cols-1 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                <FormField label="URL" error={urlError} warning={urlWarning}>
                    <input
                        type="url"
                        value={config.url}
                        placeholder="https://example.com"
                        onChange={(e) => onNavigationUrlChange(task.id, e.target.value)}
                        className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                            urlError
                                ? "border-error ring-1 ring-error/20 text-error placeholder:text-error/40"
                                : urlWarning
                                  ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                  : "border-white/10 text-on-surface focus:border-primary"
                        }`}
                    />
                </FormField>
            </div>
        );
    }

    // ── tab_management ───────────────────────────────────────────────────────
    if (config.kind === "tab_management") {
        const titleError = getFieldError(issues, "config.title");
        const titleWarning = getFieldWarning(issues, "config.title");

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                <FormField label="Switch Mode">
                    <div className="relative">
                        <select
                            value={config.mode}
                            onChange={(e) =>
                                onWaitConfigChange(task.id, {
                                    mode: e.target.value as TabSwitchStepConfig["mode"],
                                })
                            }
                            className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="by_index">By Index</option>
                            <option value="by_title">By Title</option>
                            <option value="by_url">By URL</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">arrow_drop_down</span>
                    </div>
                </FormField>

                {config.mode === "by_index" && (
                    <FormField label="Tab Index (0-based)">
                        <input
                            type="number"
                            min={0}
                            value={config.index ?? 0}
                            onChange={(e) =>
                                onWaitConfigChange(task.id, {
                                    index: Number(e.target.value || 0),
                                })
                            }
                            className="w-full font-mono bg-surface-container-low border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all"
                        />
                    </FormField>
                )}

                {config.mode === "by_title" && (
                    <FormField label="Tab Title" error={titleError} warning={titleWarning}>
                        <input
                            type="text"
                            value={config.title ?? ""}
                            placeholder="e.g. Dashboard - App"
                            onChange={(e) =>
                                onWaitConfigChange(task.id, { title: e.target.value })
                            }
                            className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                                titleError
                                    ? "border-error ring-1 ring-error/20 text-error placeholder:text-error/40"
                                    : titleWarning
                                      ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                                      : "border-white/10 text-on-surface focus:border-primary"
                            }`}
                        />
                    </FormField>
                )}

                {config.mode === "by_url" && (
                    <FormField label="Tab URL Pattern">
                        <input
                            type="text"
                            value={config.url ?? ""}
                            placeholder="e.g. https://example.com/dashboard"
                            onChange={(e) =>
                                onWaitConfigChange(task.id, { url: e.target.value })
                            }
                            className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all"
                        />
                    </FormField>
                )}
            </div>
        );
    }

    // ── assertion ────────────────────────────────────────────────────────────
    // Fix #2: each field uses its own dedicated handler
    if (config.kind === "assertion") {
        const assertConfig = config as AssertionStepConfig;
        const targetError = getFieldError(issues, ["config.target.selector", "config.target"]);
        const targetWarning = getFieldWarning(issues, ["config.target.selector", "config.target"]);
        const expectedError = getFieldError(issues, "config.expectedValue");
        const expectedWarning = getFieldWarning(issues, "config.expectedValue");

        // For assertion we only support DOM target inside the editor config logic directly right now.
        // If it isn't defined yet or is something else, we pass a dummy to let DomTargetEditor mount.
        const effectiveDomTarget: DomTarget = assertConfig.target?.kind === "dom"
            ? assertConfig.target
            : { kind: "dom", selector: "" };

        // Whether assertion type requires a target field
        const needsTarget = assertConfig.type === "state_check";

        // Whether assertion kind requires an expected value
        const needsExpectedValue =
            assertConfig.assertionKind === "text_match" ||
            assertConfig.assertionKind === "value_eq" ||
            assertConfig.assertionKind === "value_gt" ||
            assertConfig.assertionKind === "count_eq";

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200 mt-4 p-4 bg-surface-container-lowest/50 rounded-xl border border-white/5">
                {/* Fix #2a: Assertion Type → writes to config.type */}
                <FormField label="Assertion Type">
                    <div className="relative">
                        <select
                            value={assertConfig.type}
                            onChange={(e) =>
                                onAssertionTypeChange(task.id, e.target.value as AssertionStepConfig["type"])
                            }
                            className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="cross_step">Cross Step</option>
                            <option value="state_check">State Check</option>
                            <option value="milestone">Milestone</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">arrow_drop_down</span>
                    </div>
                </FormField>

                {/* Fix #2b: Assertion Kind → writes to config.assertionKind */}
                <FormField label="Assertion Kind">
                    <div className="relative">
                        <select
                            value={assertConfig.assertionKind}
                            onChange={(e) =>
                                onAssertionKindChange(task.id, e.target.value as AssertionKind)
                            }
                            className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="visible">visible</option>
                            <option value="hidden">hidden</option>
                            <option value="text_match">text_match</option>
                            <option value="value_eq">value_eq</option>
                            <option value="value_gt">value_gt</option>
                            <option value="count_eq">count_eq</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">arrow_drop_down</span>
                    </div>
                </FormField>

                {/* Fix #2c: Target — only for state_check, defaults to DOM selector */}
                {needsTarget && (
                    <DomTargetEditor
                        target={effectiveDomTarget}
                        onChange={(target) => onActionTargetChange(task.id, target)}
                        error={targetError}
                        warning={targetWarning}
                    />
                )}

                {/* Fix #2d: Expected Value — only when kind requires it */}
                {needsExpectedValue && (
                    <FormField
                        label="Expected Value"
                        error={expectedError}
                        warning={expectedWarning}
                        className="col-span-1 md:col-span-2"
                    >
                        <input
                            type="text"
                            value={
                                assertConfig.expectedValue !== undefined
                                    ? String(assertConfig.expectedValue)
                                    : ""
                            }
                            placeholder="e.g. 42, true, Hello World"
                            onChange={(e) =>
                                onAssertionExpectedValueChange(task.id, e.target.value)
                            }
                            className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                                expectedError
                                    ? "border-error ring-1 ring-error/20 text-error placeholder:text-error/40"
                                    : expectedWarning
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
