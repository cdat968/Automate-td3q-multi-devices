"use client";

import React from "react";

interface FormFieldProps {
    label: string;
    children: React.ReactNode;
    labelExtra?: React.ReactNode; // For things like confidence percentages
    className?: string;
    error?: string;
    warning?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    children,
    labelExtra,
    className = "",
    error,
    warning,
}) => {
    return (
        <div className={className}>
            <label className="block text-[10px] text-on-surface-variant font-bold mb-1.5 uppercase tracking-wider flex justify-between">
                <span>{label}</span>
                {labelExtra}
            </label>
            {children}
            {error ? (
                <p className="text-[10px] text-error font-medium mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">
                        warning
                    </span>{" "}
                    {error}
                </p>
            ) : warning ? (
                <p className="text-[10px] text-amber-500 font-medium mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">
                        info
                    </span>{" "}
                    {warning}
                </p>
            ) : null}
        </div>
    );
};
