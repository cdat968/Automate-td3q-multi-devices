"use client";

import React from "react";

interface SelectFieldProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[] | { label: string; value: string }[];
  className?: string;
  icon?: string;
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({ value, onChange, options, className = "", icon = "arrow_drop_down", placeholder }) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-on-surface outline-none focus:border-primary shadow-inner transition-all appearance-none cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const label = typeof opt === "string" ? opt : opt.label;
          const val = typeof opt === "string" ? opt : opt.value;
          return (
            <option key={val} value={val} className="text-on-surface">
              {label}
            </option>
          );
        })}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none">
        {icon}
      </span>
    </div>
  );
};
