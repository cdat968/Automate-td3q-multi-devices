"use client";

import React from "react";

interface AddStepMenuProps {
    isOpen: boolean;
    onAddStep: (type: string) => void;
    menuRef: React.RefObject<HTMLDivElement | null>;
}

const STEP_OPTIONS = [
    { type: "action", icon: "play_arrow", desc: "Execute a command" },
    { type: "wait", icon: "timer", desc: "Pause execution" },
    { type: "detect", icon: "visibility", desc: "Visual recognition" },
    { type: "loop", icon: "all_inclusive", desc: "Repeat steps" },
    { type: "branch", icon: "call_split", desc: "Conditional flow" },
];

export const AddStepMenu: React.FC<AddStepMenuProps> = ({
    isOpen,
    onAddStep,
    menuRef,
}) => {
    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="absolute right-0 top-full mt-2 w-48 bg-surface-container-highest border border-white/10 rounded-xl shadow-2xl py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <div className="px-3 pb-2 mb-1 border-b border-white/5">
                <span className="text-[10px] uppercase font-bold text-outline">
                    Step Type
                </span>
            </div>
            {STEP_OPTIONS.map((opt) => (
                <button
                    key={opt.type}
                    onClick={() => onAddStep(opt.type)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-surface-variant text-left transition-colors group"
                >
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-sm">
                        {opt.icon}
                    </span>
                    <div>
                        <div className="text-sm font-bold text-on-surface">
                            {opt.type}
                        </div>
                        <div className="text-[10px] text-on-surface-variant group-hover:text-outline transition-colors leading-tight">
                            {opt.desc}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};
