"use client";

import React, { useState, useCallback } from "react";
import WizardStepIndicator from "./WizardStepIndicator";
import BasicInfoStep, { type BasicInfoData } from "./BasicInfoStep";
import TaskSetupStep, { type TaskSetupData } from "./TaskSetupStep";
import AssignmentStep, { type AssignmentData } from "./AssignmentStep";
import ReviewStep from "./ReviewStep";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface NewProfileFormData {
  basic: BasicInfoData;
  tasks: TaskSetupData;
  assignment: AssignmentData;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user confirms creation with the final form data */
  onSubmit?: (data: NewProfileFormData) => void;
}

// ─── Default (empty) state ────────────────────────────────────────────────────
const DEFAULT_FORM: NewProfileFormData = {
  basic: {
    profileName: "",
    targetGame: "",
    icon: "sports_esports",
    description: "",
    tags: "",
  },
  tasks: {
    selectedTaskIds: [],
  },
  assignment: {
    selectedDeviceIds: [],
    schedule: "manual",
    startTime: "22:00",
    intervalMins: "60",
    cronExpr: "",
  },
};

const TOTAL_STEPS = 4;

// ─── Step title meta ──────────────────────────────────────────────────────────
const STEP_META = [
  { title: "Basic Info",     subtitle: "Name, game, and identity" },
  { title: "Task Setup",     subtitle: "Choose automation steps"  },
  { title: "Device Assignment", subtitle: "Targets and schedule"  },
  { title: "Review",         subtitle: "Confirm before creating"  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewProfileDrawer({ isOpen, onClose, onSubmit }: Props) {
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState<NewProfileFormData>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);

  // Reset on close
  const handleClose = useCallback(() => {
    onClose();
    // Defer reset so close animation can complete
    setTimeout(() => {
      setStep(1);
      setForm(DEFAULT_FORM);
      setCreating(false);
    }, 300);
  }, [onClose]);

  // Patch helpers
  const patchBasic      = (d: BasicInfoData)   => setForm((f) => ({ ...f, basic: d }));
  const patchTasks      = (d: TaskSetupData)    => setForm((f) => ({ ...f, tasks: d }));
  const patchAssignment = (d: AssignmentData)   => setForm((f) => ({ ...f, assignment: d }));

  // Navigation
  const goNext = () => {
    if (step < TOTAL_STEPS) { setStep((s) => s + 1); return; }
    // Final step — submit
    setCreating(true);
    setTimeout(() => {
      onSubmit?.(form);
      setCreating(false);
      handleClose();
    }, 900);
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const isFinalStep = step === TOTAL_STEPS;
  const meta        = STEP_META[step - 1];

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        className={`fixed inset-0 bg-background/75 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* ── Drawer panel ─────────────────────────────────────── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Create new profile"
        className={`fixed top-0 right-0 bottom-0 w-full md:w-[480px] lg:w-[44%] max-w-[560px]
          bg-surface border-l border-white/5 z-50 shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="px-6 py-5 border-b border-white/5 bg-surface-container-low flex items-center gap-4 shrink-0">
          {/* Glowing icon */}
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold text-on-surface leading-tight">Create New Profile</h2>
            <p className="text-[11px] text-outline mt-0.5 font-medium">
              {meta.subtitle}
            </p>
          </div>

          {/* Step badge */}
          <span className="text-[10px] font-bold text-outline bg-surface-container px-2.5 py-1 rounded-full border border-white/10 shrink-0">
            {step} / {TOTAL_STEPS}
          </span>

          {/* Close */}
          <button
            id="new-profile-drawer-close"
            onClick={handleClose}
            aria-label="Close drawer"
            className="w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </header>

        {/* ── Step indicator ──────────────────────────────────── */}
        <WizardStepIndicator currentStep={step} />

        {/* ── Scrollable content ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* Inner padding + per-step background tint */}
          <div className="p-6 min-h-full">
            {step === 1 && <BasicInfoStep   data={form.basic}      onChange={patchBasic} />}
            {step === 2 && <TaskSetupStep   data={form.tasks}      onChange={patchTasks} />}
            {step === 3 && <AssignmentStep  data={form.assignment} onChange={patchAssignment} />}
            {step === 4 && (
              <ReviewStep
                basic={form.basic}
                tasks={form.tasks}
                assignment={form.assignment}
              />
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="px-6 py-4 border-t border-white/5 bg-surface-container-low flex items-center justify-between gap-3 shrink-0">
          {/* Back */}
          <button
            id="wizard-back-btn"
            onClick={goBack}
            disabled={step === 1}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-on-surface
              disabled:opacity-30 disabled:pointer-events-none
              hover:bg-surface-variant border border-transparent hover:border-white/10
              transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300
                  ${i + 1 === step
                    ? "w-4 h-1.5 bg-primary"
                    : i + 1 < step
                      ? "w-1.5 h-1.5 bg-primary/50"
                      : "w-1.5 h-1.5 bg-surface-variant"
                  }`}
              />
            ))}
          </div>

          {/* Next / Create */}
          <button
            id="wizard-next-btn"
            onClick={goNext}
            disabled={creating}
            className="btn-primary px-6 py-2.5 text-sm shadow-lg shadow-primary/25
              hover:shadow-primary/40 flex items-center gap-2 disabled:opacity-70
              transition-all min-w-[130px] justify-center"
          >
            {creating ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Creating…
              </>
            ) : isFinalStep ? (
              <>
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Create Profile
              </>
            ) : (
              <>
                Next Step
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </footer>
      </aside>
    </>
  );
}
