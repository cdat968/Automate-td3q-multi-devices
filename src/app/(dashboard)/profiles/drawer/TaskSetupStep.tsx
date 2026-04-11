"use client";

import React, { useState } from "react";

const PRESET_TASKS = [
  { id: "tk_login",    name: "Login & Auth",           icon: "login",          type: "Action",  desc: "Authenticate into the game" },
  { id: "tk_nav",      name: "Navigate to Zone",        icon: "near_me",       type: "Action",  desc: "Move character to target area" },
  { id: "tk_farm",     name: "Execute Farm Loop",        icon: "loop",          type: "Loop",    desc: "Repeat farming actions" },
  { id: "tk_collect",  name: "Collect Rewards",          icon: "inventory",     type: "Action",  desc: "Pick up loot/rewards" },
  { id: "tk_rest",     name: "Safety Check & Rest",      icon: "health_and_safety", type: "Wait", desc: "Anti-detection pause" },
  { id: "tk_detect",   name: "Detect UI Element",        icon: "visibility",    type: "Detect",  desc: "Visual recognition check" },
  { id: "tk_branch",   name: "Conditional Branch",       icon: "call_split",    type: "Branch",  desc: "If/else flow control" },
];

const TYPE_COLOR: Record<string, string> = {
  Action: "text-primary border-primary/30 bg-primary/10",
  Loop:   "text-secondary border-secondary/30 bg-secondary/10",
  Wait:   "text-outline border-white/10 bg-surface-variant/30",
  Detect: "text-tertiary border-tertiary/30 bg-tertiary/10",
  Branch: "text-error border-error/30 bg-error/10",
};

export interface TaskSetupData {
  selectedTaskIds: string[];
}

interface Props {
  data: TaskSetupData;
  onChange: (data: TaskSetupData) => void;
}

export default function TaskSetupStep({ data, onChange }: Props) {
  const [search, setSearch] = useState("");

  const toggle = (id: string) => {
    const newIds = data.selectedTaskIds.includes(id)
      ? data.selectedTaskIds.filter((x) => x !== id)
      : [...data.selectedTaskIds, id];
    onChange({ ...data, selectedTaskIds: newIds });
  };

  const filtered = PRESET_TASKS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div>
        <h3 className="section-title text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">checklist</span>
          Task Setup
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Select preset task templates to include in the automation sequence. You can reorder and configure them after creation.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none">
          search
        </span>
        <input
          type="text"
          id="task-setup-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-full bg-surface-container-lowest border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/50"
        />
      </div>

      {/* Selected count badge */}
      {data.selectedTaskIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 flex items-center justify-between animate-in fade-in duration-200">
          <span className="text-xs text-primary font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {data.selectedTaskIds.length} task{data.selectedTaskIds.length > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => onChange({ ...data, selectedTaskIds: [] })}
            className="text-[10px] text-outline hover:text-error transition-colors font-bold"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-outline text-sm">
            <span className="material-symbols-outlined text-3xl block mb-2 opacity-40">search_off</span>
            No matching tasks
          </div>
        ) : (
          filtered.map((task) => {
            const isSelected = data.selectedTaskIds.includes(task.id);
            return (
              <button
                key={task.id}
                type="button"
                id={`task-option-${task.id}`}
                onClick={() => toggle(task.id)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all text-left group
                  ${isSelected
                    ? "bg-primary/8 border-primary/30 shadow-sm shadow-primary/10"
                    : "bg-surface-container-lowest border-white/5 hover:border-white/15 hover:bg-surface-container-low"
                  }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${isSelected ? "bg-primary border-primary" : "border-outline/50 group-hover:border-outline"}`}
                >
                  {isSelected && <span className="material-symbols-outlined text-on-primary text-[13px]">check</span>}
                </div>

                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors
                  ${isSelected ? "bg-primary/15 border-primary/20" : "bg-surface-container border-white/5"}`}
                >
                  <span className={`material-symbols-outlined text-sm transition-colors ${isSelected ? "text-primary" : "text-outline group-hover:text-on-surface-variant"}`}>
                    {task.icon}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold transition-colors ${isSelected ? "text-primary" : "text-on-surface"}`}>
                    {task.name}
                  </p>
                  <p className="text-[11px] text-outline leading-tight mt-0.5">{task.desc}</p>
                </div>

                {/* Type badge */}
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${TYPE_COLOR[task.type] ?? ""}`}>
                  {task.type}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Empty state callout */}
      {data.selectedTaskIds.length === 0 && (
        <p className="text-[11px] text-outline text-center">
          Select at least one task to continue, or skip to create an empty profile.
        </p>
      )}
    </div>
  );
}
