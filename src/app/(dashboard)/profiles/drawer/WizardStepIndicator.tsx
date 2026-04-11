"use client";

import React from "react";

const STEPS = [
  { label: "Basic Info",   icon: "badge" },
  { label: "Task Setup",   icon: "checklist" },
  { label: "Assignment",   icon: "devices" },
  { label: "Review",       icon: "fact_check" },
];

interface Props {
  currentStep: number; // 1-based
}

export default function WizardStepIndicator({ currentStep }: Props) {
  return (
    <div className="px-6 py-5 border-b border-white/5 bg-surface-container-lowest">
      {/* Step track */}
      <div className="relative flex items-center justify-between">
        {/* Connector line behind the bubbles */}
        <div className="absolute top-4 left-4 right-4 h-0.5 z-0">
          <div className="w-full h-full bg-surface-variant rounded-full" />
          <div
            className="absolute inset-y-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {STEPS.map((s, idx) => {
          const stepNum = idx + 1;
          const isDone    = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={s.label} className="relative z-10 flex flex-col items-center gap-1.5">
              {/* Bubble */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${isCurrent
                    ? "bg-primary text-on-primary ring-4 ring-primary/25 scale-110 shadow-lg shadow-primary/40"
                    : isDone
                      ? "bg-primary text-on-primary"
                      : "bg-surface-variant text-outline"
                  }`}
              >
                {isDone
                  ? <span className="material-symbols-outlined text-[15px]">check</span>
                  : <span className="material-symbols-outlined text-[15px]">{s.icon}</span>
                }
              </div>

              {/* Label */}
              <span
                className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-200
                  ${isCurrent ? "text-primary" : isDone ? "text-primary/70" : "text-outline"}`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
