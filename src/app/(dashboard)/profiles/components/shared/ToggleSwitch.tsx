"use client";

import React from "react";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (e: React.MouseEvent) => void;
  title?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, title }) => {
  return (
    <button
      onClick={onChange}
      title={title}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "bg-surface-variant overflow-hidden"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-4" : "translate-x-0 bg-outline"
        }`}
      />
    </button>
  );
};
