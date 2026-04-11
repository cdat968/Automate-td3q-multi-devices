"use client";

import React from "react";
import { FormField } from "../../../shared/FormField";
import type { VisualTarget } from "../../../../types/automation-step";

interface VisualTargetEditorProps {
    target: VisualTarget;
    onChange: (target: VisualTarget) => void;
    error?: string;
    warning?: string;
}

function getVisualTargetValue(target: VisualTarget): string {
    switch (target.kind) {
        case "visual-template":
        case "visual-feature":
            return target.assetId;
        case "ocr-text":
            return target.text;
        default:
            return "";
    }
}

export const VisualTargetEditor: React.FC<VisualTargetEditorProps> = ({
    target,
    onChange,
    error,
    warning,
}) => {
    const targetValue = getVisualTargetValue(target);

    return (
        <>
            <FormField label="Visual Target Kind">
                <div className="relative">
                    <select
                        value={target.kind}
                        onChange={(e) => {
                            const kind = e.target.value as VisualTarget["kind"];
                            const newTarget: VisualTarget =
                                kind === "ocr-text"
                                    ? { kind: "ocr-text", text: "" }
                                    : { kind, assetId: "" };
                            onChange(newTarget);
                        }}
                        className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                        <option value="visual-template">Template Match</option>
                        <option value="visual-feature">Feature Match</option>
                        <option value="ocr-text">OCR Text</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">arrow_drop_down</span>
                </div>
            </FormField>

            <FormField
                label={target.kind === "ocr-text" ? "OCR Text Pattern" : "Asset ID"}
                error={error}
                warning={warning}
            >
                <input
                    type="text"
                    value={targetValue}
                    placeholder={target.kind === "ocr-text" ? "e.g. Start Game" : "e.g. btn_start.png"}
                    onChange={(e) => {
                        const val = e.target.value;
                        const newTarget: VisualTarget =
                            target.kind === "ocr-text"
                                ? { kind: "ocr-text", text: val }
                                : { kind: target.kind, assetId: val };
                        onChange(newTarget);
                    }}
                    className={`w-full bg-surface-container-low border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                        error
                            ? "border-error ring-1 ring-error/20 text-error placeholder:text-error/40"
                            : warning
                              ? "border-amber-500/50 text-on-surface focus:border-amber-500"
                              : "border-white/10 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
                    }`}
                />
            </FormField>
        </>
    );
};
