"use client";

import React from "react";

const MOCK_DEVICES = [
  { id: "d1", name: "BlueStacks #1",  os: "Android 11", status: "idle",    icon: "smartphone" },
  { id: "d2", name: "BlueStacks #2",  os: "Android 11", status: "running", icon: "smartphone" },
  { id: "d3", name: "LDPlayer R1",    os: "Android 9",  status: "idle",    icon: "tablet_android" },
  { id: "d4", name: "MuMu Emulator",  os: "Android 12", status: "offline", icon: "tablet_android" },
  { id: "d5", name: "Win Device #1",  os: "Windows 11", status: "idle",    icon: "computer" },
];

const SCHEDULE_OPTIONS = [
  { value: "manual",   label: "Manual Only",        icon: "touch_app",   desc: "Run only when triggered by hand" },
  { value: "interval", label: "Fixed Interval",      icon: "timer",       desc: "Repeat every N minutes/hours" },
  { value: "cron",     label: "Cron Schedule",       icon: "event_repeat",desc: "Advanced time expression" },
  { value: "daily",    label: "Daily at Fixed Time",  icon: "schedule",    desc: "Run once per day at a set time" },
];

const STATUS_STYLE: Record<string, string> = {
  idle:    "text-tertiary bg-tertiary/10 border-tertiary/20",
  running: "text-primary bg-primary/10 border-primary/20",
  offline: "text-outline bg-surface-variant/40 border-white/5",
};

export interface AssignmentData {
  selectedDeviceIds: string[];
  schedule: string;
  startTime: string;
  intervalMins: string;
  cronExpr: string;
}

interface Props {
  data: AssignmentData;
  onChange: (data: AssignmentData) => void;
}

export default function AssignmentStep({ data, onChange }: Props) {
  const set = (key: keyof AssignmentData, value: string) =>
    onChange({ ...data, [key]: value });

  const toggleDevice = (id: string) => {
    const next = data.selectedDeviceIds.includes(id)
      ? data.selectedDeviceIds.filter((x) => x !== id)
      : [...data.selectedDeviceIds, id];
    onChange({ ...data, selectedDeviceIds: next });
  };

  const toggleAll = () => {
    const allIdle = MOCK_DEVICES.filter((d) => d.status !== "offline").map((d) => d.id);
    const allSelected = allIdle.every((id) => data.selectedDeviceIds.includes(id));
    onChange({ ...data, selectedDeviceIds: allSelected ? [] : allIdle });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div>
        <h3 className="section-title text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">devices</span>
          Device Assignment
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Choose which devices will run this profile and set a schedule.
        </p>
      </div>

      {/* --- Devices --- */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
            Devices <span className="text-error ml-0.5">*</span>
          </label>
          <button
            type="button"
            onClick={toggleAll}
            className="text-[10px] text-primary hover:text-primary/80 font-bold transition-colors"
          >
            {MOCK_DEVICES.filter((d) => d.status !== "offline").every((d) => data.selectedDeviceIds.includes(d.id))
              ? "Deselect all"
              : "Select all idle"}
          </button>
        </div>

        <div className="space-y-2">
          {MOCK_DEVICES.map((device) => {
            const isOffline  = device.status === "offline";
            const isSelected = data.selectedDeviceIds.includes(device.id);

            return (
              <button
                key={device.id}
                type="button"
                id={`device-option-${device.id}`}
                disabled={isOffline}
                onClick={() => !isOffline && toggleDevice(device.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                  ${isOffline  ? "opacity-40 cursor-not-allowed bg-surface-container-lowest border-white/5" :
                    isSelected ? "bg-primary/8 border-primary/30 shadow-sm shadow-primary/10" :
                                 "bg-surface-container-lowest border-white/5 hover:border-white/15 hover:bg-surface-container-low"
                  }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${isSelected ? "bg-primary border-primary" : "border-outline/50"}`}
                >
                  {isSelected && <span className="material-symbols-outlined text-on-primary text-[13px]">check</span>}
                </div>

                {/* Device icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors
                  ${isSelected ? "bg-primary/15 border-primary/20" : "bg-surface-container border-white/5"}`}
                >
                  <span className={`material-symbols-outlined text-sm ${isSelected ? "text-primary" : "text-outline"}`}>
                    {device.icon}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isSelected ? "text-primary" : "text-on-surface"}`}>
                    {device.name}
                  </p>
                  <p className="text-[11px] text-outline">{device.os}</p>
                </div>

                {/* Status badge */}
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLE[device.status]}`}>
                  {device.status}
                </span>
              </button>
            );
          })}
        </div>

        {data.selectedDeviceIds.length > 0 && (
          <p className="text-[11px] text-primary font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {data.selectedDeviceIds.length} device{data.selectedDeviceIds.length > 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* --- Schedule --- */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-3">
          Run Schedule
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SCHEDULE_OPTIONS.map((opt) => {
            const isActive = data.schedule === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                id={`schedule-${opt.value}`}
                onClick={() => set("schedule", opt.value)}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all
                  ${isActive
                    ? "bg-primary/10 border-primary/30 ring-2 ring-primary/15"
                    : "bg-surface-container-lowest border-white/5 hover:border-white/15"
                  }`}
              >
                <span className={`material-symbols-outlined text-lg ${isActive ? "text-primary" : "text-outline"}`}>
                  {opt.icon}
                </span>
                <span className={`text-xs font-bold ${isActive ? "text-primary" : "text-on-surface"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-outline leading-tight">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional schedule fields */}
      {data.schedule === "daily" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">
            Start Time (local)
          </label>
          <input
            type="time"
            id="schedule-start-time"
            value={data.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
          />
        </div>
      )}

      {data.schedule === "interval" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">
            Interval (minutes)
          </label>
          <div className="relative">
            <input
              type="number"
              id="schedule-interval-mins"
              value={data.intervalMins}
              onChange={(e) => set("intervalMins", e.target.value)}
              min={1}
              placeholder="60"
              className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 pr-16 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-outline font-bold">
              min
            </span>
          </div>
        </div>
      )}

      {data.schedule === "cron" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">
            Cron Expression
          </label>
          <input
            type="text"
            id="schedule-cron-expr"
            value={data.cronExpr}
            onChange={(e) => set("cronExpr", e.target.value)}
            placeholder="0 22 * * *  (every day at 10 PM)"
            className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono placeholder:text-outline/40"
          />
          <p className="text-[10px] text-outline mt-1.5">
            Standard 5-field cron format: minute hour day month weekday
          </p>
        </div>
      )}
    </div>
  );
}
