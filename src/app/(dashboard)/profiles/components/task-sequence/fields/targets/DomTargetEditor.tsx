"use client";

import React from "react";
import { FormField } from "../../../shared/FormField";
import type { DomTarget } from "../../../../types/automation-step";

interface DomTargetEditorProps {
    target: DomTarget;
    onChange: (target: DomTarget) => void;
    error?: string;
    warning?: string;
}

export const DomTargetEditor: React.FC<DomTargetEditorProps> = ({
    target,
    onChange,
    error,
    warning,
}) => {
    return (
        <>
            <FormField label="CSS Selector" error={error} warning={warning} className="col-span-1 md:col-span-2">
                <input
                    type="text"
                    value={target.selector ?? ""}
                    placeholder="e.g. #submit-btn, .nav-link, [data-id='x']"
                    onChange={(e) =>
                        onChange({
                            kind: "dom",
                            selector: e.target.value,
                            useXpath: target.useXpath,
                        })
                    }
                    className={`w-full font-mono bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                        error
                            ? "border-error ring-1 ring-error/20 text-error placeholder:text-error/40"
                            : warning
                              ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                              : "border-white/10 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
                    }`}
                />
            </FormField>
            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                <input
                    type="checkbox"
                    checked={target.useXpath ?? false}
                    onChange={(e) =>
                        onChange({
                            kind: "dom",
                            selector: target.selector,
                            useXpath: e.target.checked,
                        })
                    }
                    className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-xs text-on-surface-variant font-medium">Use XPath expression</span>
            </label>
        </>
    );
};
