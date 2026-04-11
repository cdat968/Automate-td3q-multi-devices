"use client";

import React from "react";
import type { BasicInfoData } from "./BasicInfoStep";
import type { TaskSetupData } from "./TaskSetupStep";
import type { AssignmentData } from "./AssignmentStep";

interface Props {
  basic: BasicInfoData;
  tasks: TaskSetupData;
  assignment: AssignmentData;
}

const TASK_NAMES: Record<string, string> = {
  tk_login:   "Login & Auth",
  tk_nav:     "Navigate to Zone",
  tk_farm:    "Execute Farm Loop",
  tk_collect: "Collect Rewards",
  tk_rest:    "Safety Check & Rest",
  tk_detect:  "Detect UI Element",
  tk_branch:  "Conditional Branch",
};

const TASK_ICONS: Record<string, string> = {
  tk_login:   "login",
  tk_nav:     "near_me",
  tk_farm:    "loop",
  tk_collect: "inventory",
  tk_rest:    "health_and_safety",
  tk_detect:  "visibility",
  tk_branch:  "call_split",
};

const DEVICE_NAMES: Record<string, string> = {
  d1: "BlueStacks #1",
  d2: "BlueStacks #2",
  d3: "LDPlayer R1",
  d4: "MuMu Emulator",
  d5: "Win Device #1",
};

const SCHEDULE_LABELS: Record<string, string> = {
  manual:   "Manual Only",
  interval: "Fixed Interval",
  cron:     "Cron Schedule",
  daily:    "Daily at Fixed Time",
};

// ── Row component ──────────────────────────────────────────────
function ReviewRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      {icon && (
        <span className="material-symbols-outlined text-outline text-base mt-0.5 shrink-0">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-outline font-bold mb-0.5">{label}</p>
        <div className="text-sm text-on-surface font-semibold">{value}</div>
      </div>
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────
function ReviewSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-white/5 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-surface-container-low border-b border-white/5">
        <span className="material-symbols-outlined text-primary text-base">{icon}</span>
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{title}</span>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function ReviewStep({ basic, tasks, assignment }: Props) {
  const hasIssues =
    !basic.profileName.trim() ||
    !basic.targetGame ||
    tasks.selectedTaskIds.length === 0 ||
    assignment.selectedDeviceIds.length === 0;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div>
        <h3 className="section-title text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
          Review &amp; Confirm
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Verify all settings before creating the profile.
        </p>
      </div>

      {/* Validation banner */}
      {hasIssues ? (
        <div className="flex items-start gap-3 p-4 bg-error/8 border border-error/25 rounded-xl animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-error shrink-0 text-lg">warning</span>
          <div>
            <p className="text-xs font-bold text-error mb-1">Some fields are incomplete</p>
            <ul className="text-[11px] text-on-error-container space-y-0.5 list-disc list-inside">
              {!basic.profileName.trim() && <li>Profile name is required</li>}
              {!basic.targetGame && <li>Target game is required</li>}
              {tasks.selectedTaskIds.length === 0 && <li>Select at least one task (or skip)</li>}
              {assignment.selectedDeviceIds.length === 0 && <li>Assign at least one device</li>}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-tertiary/8 border border-tertiary/25 rounded-xl animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-tertiary shrink-0 text-lg">check_circle</span>
          <p className="text-xs font-bold text-tertiary">All required fields are complete. Ready to create!</p>
        </div>
      )}

      {/* ── Section 1: Basic Info ── */}
      <ReviewSection title="Basic Info" icon="badge">
        <ReviewRow
          label="Profile Name"
          icon="label"
          value={
            basic.profileName.trim()
              ? <span className="text-on-surface">{basic.profileName}</span>
              : <span className="text-error/80 italic">Not set</span>
          }
        />
        <ReviewRow
          label="Target Game"
          icon="sports_esports"
          value={
            basic.targetGame
              ? <span className="text-on-surface">{basic.targetGame}</span>
              : <span className="text-error/80 italic">Not selected</span>
          }
        />
        {basic.icon && (
          <ReviewRow
            label="Profile Icon"
            icon="image"
            value={
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">{basic.icon}</span>
                <span className="text-outline text-xs">{basic.icon}</span>
              </span>
            }
          />
        )}
        {basic.description.trim() && (
          <ReviewRow
            label="Description"
            icon="notes"
            value={<span className="text-on-surface-variant text-xs leading-relaxed">{basic.description}</span>}
          />
        )}
        {basic.tags.trim() && (
          <ReviewRow
            label="Tags"
            icon="sell"
            value={
              <div className="flex flex-wrap gap-1 mt-0.5">
                {basic.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
            }
          />
        )}
      </ReviewSection>

      {/* ── Section 2: Tasks ── */}
      <ReviewSection title="Task Sequence" icon="checklist">
        {tasks.selectedTaskIds.length === 0 ? (
          <div className="py-4 text-center text-outline text-xs italic">
            No tasks selected — empty sequence
          </div>
        ) : (
          <div className="py-2 space-y-1">
            {tasks.selectedTaskIds.map((id, idx) => (
              <div key={id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="material-symbols-outlined text-sm text-primary shrink-0">
                  {TASK_ICONS[id] ?? "task_alt"}
                </span>
                <span className="text-sm text-on-surface font-semibold">{TASK_NAMES[id] ?? id}</span>
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      {/* ── Section 3: Assignment ── */}
      <ReviewSection title="Assignment" icon="devices">
        <ReviewRow
          label="Devices"
          icon="smartphone"
          value={
            assignment.selectedDeviceIds.length === 0
              ? <span className="text-error/80 italic">None selected</span>
              : (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {assignment.selectedDeviceIds.map((id) => (
                    <span key={id} className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-[10px] font-bold border border-white/10">
                      {DEVICE_NAMES[id] ?? id}
                    </span>
                  ))}
                </div>
              )
          }
        />
        <ReviewRow
          label="Schedule"
          icon="event_repeat"
          value={
            <span className="text-on-surface">
              {SCHEDULE_LABELS[assignment.schedule] ?? assignment.schedule}
              {assignment.schedule === "daily" && assignment.startTime && (
                <span className="text-outline ml-2 text-xs font-mono">@ {assignment.startTime}</span>
              )}
              {assignment.schedule === "interval" && assignment.intervalMins && (
                <span className="text-outline ml-2 text-xs font-mono">every {assignment.intervalMins} min</span>
              )}
              {assignment.schedule === "cron" && assignment.cronExpr && (
                <span className="text-outline ml-2 text-xs font-mono">{assignment.cronExpr}</span>
              )}
            </span>
          }
        />
      </ReviewSection>

      {/* Final note */}
      <p className="text-[11px] text-outline text-center leading-relaxed pb-2">
        Clicking <span className="text-primary font-bold">Create Profile</span> will save this configuration and make it immediately available in the profile list.
      </p>
    </div>
  );
}
