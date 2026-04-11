"use client";

import React from "react";

const GAMES = [
  "Genshin Impact",
  "Elden Ring",
  "WOW Classic",
  "Starfield",
  "Arena Master",
];

const ICONS = [
  { value: "sports_esports", label: "Controller" },
  { value: "military_tech",  label: "Medal" },
  { value: "auto_fix_normal", label: "Magic" },
  { value: "trending_up",    label: "Trend" },
  { value: "bolt",           label: "Lightning" },
];

interface Props {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
}

export interface BasicInfoData {
  profileName: string;
  targetGame: string;
  icon: string;
  description: string;
  tags: string;
}

export default function BasicInfoStep({ data, onChange }: Props) {
  const set = (key: keyof BasicInfoData, value: string) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Section header */}
      <div>
        <h3 className="section-title text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">badge</span>
          Basic Information
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Set the identity and metadata for this automation profile.
        </p>
      </div>

      {/* Profile Name */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">
          Profile Name <span className="text-error ml-0.5">*</span>
        </label>
        <input
          type="text"
          id="profile-name-input"
          value={data.profileName}
          onChange={(e) => set("profileName", e.target.value)}
          placeholder="e.g. Genshin Nightly Farm"
          className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/50"
        />
      </div>

      {/* Target Game */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">
          Target Game <span className="text-error ml-0.5">*</span>
        </label>
        <div className="relative">
          <select
            id="target-game-select"
            value={data.targetGame}
            onChange={(e) => set("targetGame", e.target.value)}
            className="w-full bg-surface-container-lowest border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select a game...</option>
            {GAMES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            arrow_drop_down
          </span>
        </div>
      </div>

      {/* Profile Icon */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">
          Profile Icon
        </label>
        <div className="flex gap-2 flex-wrap">
          {ICONS.map((ic) => (
            <button
              key={ic.value}
              type="button"
              onClick={() => set("icon", ic.value)}
              title={ic.label}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all
                ${data.icon === ic.value
                  ? "bg-primary/15 border-primary text-primary ring-2 ring-primary/20 scale-105"
                  : "bg-surface-container-lowest border-white/10 text-outline hover:border-white/20 hover:text-on-surface"
                }`}
            >
              <span className="material-symbols-outlined text-xl">{ic.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">
          Description <span className="text-outline text-[9px] ml-1">(optional)</span>
        </label>
        <textarea
          id="profile-description"
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Briefly describe what this profile does..."
          rows={3}
          className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-outline/50 leading-relaxed"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">
          Tags <span className="text-outline text-[9px] ml-1">(comma separated)</span>
        </label>
        <input
          type="text"
          id="profile-tags"
          value={data.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="e.g. farming, daily, pvp"
          className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/50"
        />
        {data.tags && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
