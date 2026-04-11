import React from "react";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  icon?: string;
  error?: string;
  rightSlot?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export default function FormField({
  id,
  label,
  type = "text",
  placeholder,
  icon,
  error,
  rightSlot,
  inputProps,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant"
        >
          {label}
        </label>
        {rightSlot}
      </div>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          className={`w-full bg-surface-container-lowest border-none rounded-xl px-4 py-4 text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-high transition-all outline-none ${error ? "ring-2 ring-red-500/50" : ""}`}
          {...inputProps}
        />
        {icon && (
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/50">
            {icon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
