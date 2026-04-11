"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import NewProfileDrawer, {
    type NewProfileFormData,
} from "./drawer/NewProfileDrawer";
import { ProfileListPanel } from "./components/layout/ProfileListPanel";
import { ProfileDetailHeader } from "./components/layout/ProfileDetailHeader";
import { TaskSequencePanel } from "./components/task-sequence/TaskSequencePanel";
import {
    AutomationStep,
    AutomationTarget,
    AssertionKind,
    AssertionStepConfig,
    BranchStepConfig,
    DetectionConfig,
    LoopStepConfig,
    ScreenshotOnFailureMode,
    StepConfig,
    StepCondition,
    StepType,
    TabSwitchStepConfig,
    VisualTarget,
    WaitDomStepConfig,
    WaitTabStepConfig,
    WaitVisualStepConfig,
    LoopStepConfig as LoopConfig,
    BranchStepConfig as BranchConfig,
} from "./types/automation-step";
import { createDefaultStep, changeStepType } from "./utils/step-factory";
import { 
    isDomTarget, 
    isVisualTarget, 
    hasDomTarget, 
    hasVisualTarget 
} from "./utils/editor-invariants";
import { validateSteps, type ValidationIssue } from "./utils/step-validation";
import { useNotification } from "../../../contexts/NotificationContext";
import { runFlow } from "./runtime/run-flow";
import { MockDeviceAdapter } from "./adapters/mock/mock-device-adapter";
import type { ExecutionContext } from "./types/execution-context";

import {
    ProfileEditorState,
    EditorDraftModel,
    EditorUiState,
    EditorValidationState,
    EditorExecutionState,
} from "./types/editor-state";

const initialProfiles = [
    {
        id: "p1",
        name: "Morning Farm",
        game: "RuneScape Mobile",
        devices: 12,
        status: "Active",
        success: "98.2%",
        runs: 1240,
        statusColor: "text-success",
    },
    {
        id: "p2",
        name: "Login Cycle",
        game: "Genshin Impact",
        devices: 5,
        status: "Paused",
        success: "—",
        runs: 0,
        statusColor: "text-outline",
    },
];

const initialTasks: AutomationStep[] = [
    {
        id: "step-1",
        name: "App Start",
        type: "dom_click",
        status: "enabled",
        order: 1,
        runtime: {
            timeoutSec: 10,
            retryCount: 2,
            failAction: "stop_flow",
            screenshotOnFailure: "full_screen",
        },
        config: {
            kind: "dom_click",
            target: { kind: "dom", selector: "#start_btn" }
        },
    },
    {
        id: "step-2",
        name: "Wait for Lobby",
        type: "delay",
        status: "enabled",
        order: 2,
        runtime: {
            timeoutSec: 10,
            retryCount: 0,
            failAction: "stop_flow",
            screenshotOnFailure: "none",
        },
        config: {
            kind: "delay",
            durationMs: 5000
        },
    },
];

/**
 * Reset state for a new validation pass.
 * Does NOT touch execution state.
 */
const INITIAL_VALIDATION_STATE: EditorValidationState = {
    status: "idle",
    issues: [],
};

/**
 * Reset state for a new dry-run attempt.
 * Does NOT touch validation issues.
 */
const INITIAL_EXECUTION_STATE: EditorExecutionState = {
    status: "idle",
    message: undefined,
    failedStepId: null,
};

const DEFAULT_UI_STATE: Omit<EditorUiState, "activeTab" | "isDrawerOpen"> = {
    expandedStepId: null,
    isValidating: false,
    isDryRunning: false,
    isAddStepOpen: false,
};

export default function ProfilesClient() {
    const { notify } = useNotification();
    const [profiles, setProfiles] = useState(initialProfiles);
    const [activeProfileId, setActiveProfileId] = useState("p1");

    // Per-profile draft cache
    const [profileDrafts, setProfileDrafts] = useState<
        Record<string, AutomationStep[]>
    >({
        p1: initialTasks,
    });

    // Unified Editor State (Phase A)
    const [editorState, setEditorState] = useState<ProfileEditorState>({
        draft: {
            tasks: initialTasks,
        },
        ui: {
            activeTab: "Task Sequence",
            isDrawerOpen: false,
            ...DEFAULT_UI_STATE,
        },
        validation: INITIAL_VALIDATION_STATE,
        execution: INITIAL_EXECUTION_STATE,
    });

    // Source-of-truth refs to avoid closure staleness
    const latestTasksRef = useRef<AutomationStep[]>(initialTasks);
    const latestDraftsRef = useRef<Record<string, AutomationStep[]>>({
        p1: initialTasks,
    });

    // Defensive sync (fallback)
    useEffect(() => {
        latestTasksRef.current = editorState.draft.tasks;
    }, [editorState.draft.tasks]);

    useEffect(() => {
        latestDraftsRef.current = profileDrafts;
    }, [profileDrafts]);

    // Refs for DOM/Event handling
    const addStepRef = useRef<HTMLDivElement>(null);

    const handleProfileSelect = useCallback(
        (nextId: string) => {
            if (nextId === activeProfileId) return;

            // Synchronously derive from ref truth
            const currentTasks = latestTasksRef.current;
            const updatedDrafts = {
                ...latestDraftsRef.current,
                [activeProfileId]: currentTasks,
            };

            latestDraftsRef.current = updatedDrafts;
            setProfileDrafts(updatedDrafts);

            const nextTasks = updatedDrafts[nextId] || [];
            // Synchronize task ref immediately during switch
            latestTasksRef.current = nextTasks;

            setEditorState((prev) => ({
                ...prev,
                draft: { tasks: nextTasks },
                ui: { ...prev.ui, ...DEFAULT_UI_STATE, isDrawerOpen: false },
                validation: INITIAL_VALIDATION_STATE,
            }));

            setActiveProfileId(nextId);
        },
        [activeProfileId],
    );

    const handleCreateProfile = useCallback(
        (data: NewProfileFormData) => {
            const newId = `p${Date.now()}`;
            const newProfile = {
                id: newId,
                name: data.basic.profileName || "New Profile",
                game: data.basic.targetGame || "Unknown Game",
                devices: data.assignment.selectedDeviceIds.length,
                status: "Active",
                success: "—",
                runs: 0,
                statusColor: "text-tertiary",
            };

            const nextTasks: AutomationStep[] = [];
            const updatedDrafts = {
                ...latestDraftsRef.current,
                [activeProfileId]: latestTasksRef.current,
                [newId]: nextTasks,
            };

            latestDraftsRef.current = updatedDrafts;
            // Synchronize task ref immediately during create
            latestTasksRef.current = nextTasks;

            setProfileDrafts(updatedDrafts);
            setProfiles((prev) => [...prev, newProfile]);

            setEditorState((prev) => ({
                ...prev,
                draft: { tasks: nextTasks },
                ui: { ...prev.ui, ...DEFAULT_UI_STATE, isDrawerOpen: false },
                validation: INITIAL_VALIDATION_STATE,
            }));

            setActiveProfileId(newId);
        },
        [activeProfileId],
    );

    // Close Add Step mapping on explicit outside clicks
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (addStepRef.current && !addStepRef.current.contains(event.target as Node)) {
                setEditorState((prev) => ({
                    ...prev,
                    ui: { ...prev.ui, isAddStepOpen: false },
                }));
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const updateStep = useCallback(
        (stepId: string, updater: (step: AutomationStep) => AutomationStep) => {
            setEditorState((prev) => {
                const nextTasks = prev.draft.tasks.map((step) =>
                    step.id === stepId ? updater(step) : step,
                );
                // Synchronous synchronization
                latestTasksRef.current = nextTasks;

                return {
                    ...prev,
                    draft: { ...prev.draft, tasks: nextTasks },
                    validation: INITIAL_VALIDATION_STATE,
                };
            });
        },
        [],
    );

    // ─────────────────────────────────────────────────────────────
    // Common field handlers
    // ─────────────────────────────────────────────────────────────
    const handleStepNameChange = useCallback((stepId: string, name: string) => {
        updateStep(stepId, (step) => ({ ...step, name }));
    }, [updateStep]);

    const handleStepDescriptionChange = useCallback((stepId: string, description: string) => {
        updateStep(stepId, (step) => ({ ...step, description }));
    }, [updateStep]);

    const handleStepLabelChange = useCallback((stepId: string, label: string) => {
        updateStep(stepId, (step) => ({ ...step, label }));
    }, [updateStep]);

    const handleTimeoutChange = useCallback((stepId: string, timeoutSec: number) => {
        updateStep(stepId, (step) => ({
            ...step,
            runtime: { ...step.runtime, timeoutSec },
        }));
    }, [updateStep]);

    const handleRetryCountChange = useCallback((stepId: string, retryCount: number) => {
        updateStep(stepId, (step) => ({
            ...step,
            runtime: { ...step.runtime, retryCount },
        }));
    }, [updateStep]);

    const handleRetryDelayChange = useCallback((stepId: string, retryDelayMs: number) => {
        updateStep(stepId, (step) => ({
            ...step,
            runtime: { ...step.runtime, retryDelayMs },
        }));
    }, [updateStep]);

    const handleScreenshotModeChange = useCallback((stepId: string, mode: ScreenshotOnFailureMode) => {
        updateStep(stepId, (step) => ({
            ...step,
            runtime: { ...step.runtime, screenshotOnFailure: mode },
        }));
    }, [updateStep]);

    const handleConditionChange = useCallback((stepId: string, condition: StepCondition | null) => {
        updateStep(stepId, (step) => ({ ...step, condition }));
    }, [updateStep]);

    const handleStepClick = useCallback((taskId: string) => {
        setEditorState((prev) => ({
            ...prev,
            ui: {
                ...prev.ui,
                expandedStepId: prev.ui.expandedStepId === taskId ? null : taskId,
            },
        }));
    }, []);

    // Live-editor implies drafts receive instant mutation. "Done" is solely a UI collapse/acknowledgement action
    const handleDoneConfig = useCallback((stepId: string) => {
        setEditorState((prev) => {
            const step = prev.draft.tasks.find((t) => t.id === stepId);
            notify("success", `Configuration for "${step?.name || "Unknown"}" complete.`);
            return {
                ...prev,
                ui: { ...prev.ui, expandedStepId: null },
            };
        });
    }, [notify]);

    // "Close" acts identically to "Done" without notifying success. No real revert exists.
    const handleCloseConfig = useCallback((stepId: string) => {
        void stepId; // intentional no-op on data — just close
        setEditorState((prev) => ({
            ...prev,
            ui: { ...prev.ui, expandedStepId: null },
        }));
    }, []);

    const toggleTaskStatus = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditorState((prev) => {
            const nextTasks: AutomationStep[] = prev.draft.tasks.map((t): AutomationStep =>
                t.id === taskId
                    ? { ...t, status: t.status === "enabled" ? "disabled" : "enabled" }
                    : t,
            );
            // Fix #4: always keep latestTasksRef in sync
            latestTasksRef.current = nextTasks;

            return {
                ...prev,
                draft: { ...prev.draft, tasks: nextTasks },
                validation: INITIAL_VALIDATION_STATE,
            };
        });
    };

    const deleteTask = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditorState((prev) => {
            const nextTasks = prev.draft.tasks
                .filter((t) => t.id !== taskId)
                .map((t, index) => ({ ...t, order: index + 1 }));
            latestTasksRef.current = nextTasks;

            return {
                ...prev,
                draft: { ...prev.draft, tasks: nextTasks },
                ui: {
                    ...prev.ui,
                    expandedStepId: prev.ui.expandedStepId === taskId ? null : prev.ui.expandedStepId,
                },
                validation: INITIAL_VALIDATION_STATE,
            };
        });
    };

    const handleTaskTypeChange = useCallback((stepId: string, newType: StepType) => {
        setEditorState((prev) => {
            const nextTasks = prev.draft.tasks.map((step) =>
                step.id === stepId ? changeStepType(step, newType) : step,
            );
            latestTasksRef.current = nextTasks;

            return {
                ...prev,
                draft: { ...prev.draft, tasks: nextTasks },
                validation: INITIAL_VALIDATION_STATE,
            };
        });
    }, []);

    const handleAddStep = (type: string) => {
        setEditorState((prev) => {
            const newTask = createDefaultStep(type as StepType, prev.draft.tasks.length + 1);
            const nextTasks = [...prev.draft.tasks, newTask];
            latestTasksRef.current = nextTasks;

            return {
                ...prev,
                draft: { ...prev.draft, tasks: nextTasks },
                ui: {
                    ...prev.ui,
                    expandedStepId: newTask.id,
                    isAddStepOpen: false,
                },
                validation: INITIAL_VALIDATION_STATE,
            };
        });
    };

    const runValidation = () => {
        const tasksToValidate = latestTasksRef.current;

        setEditorState((prev) => ({
            ...prev,
            ui: { ...prev.ui, isValidating: true },
            validation: INITIAL_VALIDATION_STATE,
        }));

        setTimeout(() => {
            const result = validateSteps(tasksToValidate);
            const hasWarnings = result.issues.some((i) => i.severity === "warning");

            setEditorState((prev) => ({
                ...prev,
                ui: { ...prev.ui, isValidating: false },
                validation: {
                    status: result.valid ? "success" : "error",
                    issues: result.issues,
                },
            }));

            if (result.valid) {
                notify(hasWarnings ? "warning" : "success", hasWarnings ? "Flow is valid, but has warnings." : "Profile flow is valid.");
            } else {
                const errorCount = result.issues.filter(
                    (i) => i.severity === "error"
                ).length;
                notify(
                    "error",
                    `Validation failed: Found ${errorCount} error${errorCount > 1 ? "s" : ""
                    }.`,
                );

                const firstError = result.issues.find((i) => i.severity === "error");
                if (firstError?.stepId) {
                    setEditorState((prev) => ({
                        ...prev, ui: { ...prev.ui, expandedStepId: firstError.stepId ?? null }
                    }));
                    
                    // Wait for state flush and 300ms animation transition
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            const errorElement = document.getElementById(
                                `step-card-${firstError.stepId}`,
                            );
                            if (errorElement) {
                                errorElement.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                });
                            }
                        });
                    }, 350);
                }
            }
        }, 300);
    };

    const simulateDryRun = async () => {
        const currentTasks = latestTasksRef.current;

        setEditorState((prev) => ({
            ...prev,
            ui: { ...prev.ui, isDryRunning: true },
            execution: {
                status: "idle",
                message: "Starting simulation...",
                failedStepId: null,
            }
        }));
        notify("info", "Starting dry run...");

        try {
            const adapter = new MockDeviceAdapter();
            const context: ExecutionContext = {
                runId: `dry-run-${Date.now()}`,
                profileId: activeProfileId,
                deviceId: "mock-device",
                platform: "mock",
                variables: {},
                memory: {},
                now: Date.now(),
            };

            const flowResult = await runFlow(currentTasks, context, adapter);

            setEditorState((prev) => ({
                ...prev,
                ui: { 
                    ...prev.ui, 
                    isDryRunning: false, 
                    expandedStepId: flowResult.failedStepId ?? prev.ui.expandedStepId 
                },
                execution: {
                    status: flowResult.ok ? "success" : "error",
                    message: flowResult.ok
                        ? "Dry run completed successfully!"
                        : (flowResult.results.find(r => !r.ok)?.message || "Execution failed."),
                    failedStepId: flowResult.failedStepId ?? null,
                },
            }));

            if (!flowResult.ok && flowResult.failedStepId) {
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        const errorElement = document.getElementById(
                            `step-card-${flowResult.failedStepId}`,
                        );
                        if (errorElement) {
                            errorElement.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                            });
                        }
                    });
                }, 350);
            }

            if (flowResult.ok) {
                notify("success", "Dry run completed successfully!");
            } else {
                notify("error", "Dry run failed. See validation panel for details.");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unexpected simulation error";
            setEditorState((prev) => ({
                ...prev,
                ui: { ...prev.ui, isDryRunning: false },
                execution: { status: "error", message, failedStepId: null }
            }));
            notify("error", `Simulation error: ${message}`);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Config Field Handlers for Specific Step Types
    // ─────────────────────────────────────────────────────────────

    // Editor Invariant: type === config.kind is strictly preserved.
    // changeStepType guarantees the initial alignment. Update handlers 
    // utilize strict type guards to ensure target kinds match config kinds.

    const handleActionTargetChange = useCallback((stepId: string, target: AutomationTarget) => {
        updateStep(stepId, (step) => {
            const { config } = step;
            
            if (hasDomTarget(config) && isDomTarget(target)) {
                return { ...step, config: { ...config, target } };
            }
            
            if (hasVisualTarget(config) && isVisualTarget(target)) {
                return { ...step, config: { ...config, target } };
            }
            
            return step;
        });
    }, [updateStep]);

    // Fix #2: assertion.expectedValue — only for dom_type/visual_type/assertion
    const handleActionInputValueChange = useCallback((stepId: string, value: string) => {
        updateStep(stepId, (step) => {
            const { config } = step;
            if (config.kind === "dom_type" || config.kind === "visual_type") {
                return { ...step, config: { ...config, value } };
            }
            return step; // assertion uses dedicated handler below
        });
    }, [updateStep]);

    // Fix #1: Navigation URL — dedicated handler, never reused by other kinds
    const handleNavigationUrlChange = useCallback((stepId: string, url: string) => {
        updateStep(stepId, (step) => {
            if (step.config.kind !== "navigation") return step;
            return { ...step, config: { ...step.config, url } };
        });
    }, [updateStep]);

    // Fix #2: Assertion handlers — each field mapped explicitly
    const handleAssertionTypeChange = useCallback(
        (stepId: string, type: AssertionStepConfig["type"]) => {
            updateStep(stepId, (step) => {
                if (step.config.kind !== "assertion") return step;
                return { ...step, config: { ...step.config, type } };
            });
        },
        [updateStep],
    );

    const handleAssertionKindChange = useCallback(
        (stepId: string, assertionKind: AssertionKind) => {
            updateStep(stepId, (step) => {
                if (step.config.kind !== "assertion") return step;
                return { ...step, config: { ...step.config, assertionKind } };
            });
        },
        [updateStep],
    );

    const handleAssertionExpectedValueChange = useCallback(
        (stepId: string, expectedValue: string) => {
            updateStep(stepId, (step) => {
                if (step.config.kind !== "assertion") return step;
                return { ...step, config: { ...step.config, expectedValue } };
            });
        },
        [updateStep],
    );

    // Fix #5: wait_dom state includes "presence" (matches domain type)
    const handleWaitConfigChange = useCallback(
        (
            stepId: string,
            patch:
                | Partial<WaitTabStepConfig>
                | Partial<TabSwitchStepConfig>
                | { state: "visible" | "hidden" | "presence" }
                | { durationMs: number },
        ) => {
            updateStep(stepId, (step) => {
                const { config } = step;
                switch (config.kind) {
                    case "wait_dom":
                        if ("state" in patch) {
                            return {
                                ...step,
                                config: {
                                    ...config,
                                    state: patch.state as WaitDomStepConfig["state"],
                                },
                            };
                        }
                        return step;
                    case "wait_visual":
                        if ("state" in patch) {
                            return {
                                ...step,
                                config: {
                                    ...config,
                                    state: patch.state as WaitVisualStepConfig["state"],
                                },
                            };
                        }
                        return step;
                    case "wait_tab":
                        return {
                            ...step,
                            config: {
                                ...config,
                                ...(patch as Partial<WaitTabStepConfig>),
                            },
                        };
                    case "tab_management":
                        return {
                            ...step,
                            config: {
                                ...config,
                                ...(patch as Partial<TabSwitchStepConfig>),
                            },
                        };
                    case "delay":
                        if ("durationMs" in patch) {
                            return {
                                ...step,
                                config: {
                                    ...config,
                                    durationMs: (patch as { durationMs: number }).durationMs,
                                },
                            };
                        }
                        return step;
                    default:
                        return step;
                }
            });
        },
        [updateStep],
    );

    const handleDetectConfigChange = useCallback((stepId: string, patch: Partial<DetectionConfig>) => {
        updateStep(stepId, (step) => {
            const { config } = step;
            if (hasVisualTarget(config) || (config.kind === "assertion" && config.detection)) {
                const currentDetection = config.detection || ({} as DetectionConfig);
                return {
                    ...step,
                    config: {
                        ...config,
                        detection: { ...currentDetection, ...patch } as DetectionConfig
                    }
                };
            }
            return step;
        });
    }, [updateStep]);

    const handleLoopConfigChange = useCallback((stepId: string, patch: Partial<LoopConfig>) => {
        updateStep(stepId, (step) => {
            if (step.config.kind !== "loop") return step;
            return { ...step, config: { ...step.config, ...patch } };
        });
    }, [updateStep]);

    const handleBranchConfigChange = useCallback((stepId: string, patch: Partial<BranchConfig>) => {
        updateStep(stepId, (step) => {
            if (step.config.kind !== "branch") return step;
            return { ...step, config: { ...step.config, ...patch } };
        });
    }, [updateStep]);

    const activeProfile = profiles.find((p) => p.id === activeProfileId);

    return (
        <div className="flex gap-6 h-full min-h-[calc(100dvh-var(--header-height)-3rem)] relative w-full overflow-hidden">
            <NewProfileDrawer
                isOpen={editorState.ui.isDrawerOpen}
                onClose={() => setEditorState((prev) => ({ ...prev, ui: { ...prev.ui, isDrawerOpen: false } }))}
                onSubmit={handleCreateProfile}
            />

            <ProfileListPanel
                profiles={profiles}
                activeProfileId={activeProfileId}
                onProfileClick={handleProfileSelect}
                onNewProfile={() => setEditorState((prev) => ({ ...prev, ui: { ...prev.ui, isDrawerOpen: true } }))}
            />

            <div className="flex-1 flex flex-col gap-6 overflow-y-auto min-w-0 pb-10 scroll-smooth">
                <ProfileDetailHeader
                    profileName={activeProfile?.name || "New Profile"}
                    activeTab={editorState.ui.activeTab}
                    onTabChange={(tab) => setEditorState((prev) => ({ ...prev, ui: { ...prev.ui, activeTab: tab } }))}
                />

                {editorState.ui.activeTab !== "Task Sequence" ? (
                    <div className="card p-6 border border-white/5 bg-surface-container/50 shadow-xl flex-1 flex flex-col items-center justify-center min-h-[400px]">
                        <span className="material-symbols-outlined text-4xl text-outline mb-3 opacity-50">data_object</span>
                        <h3 className="text-on-surface-variant font-bold">{editorState.ui.activeTab}</h3>
                    </div>
                ) : (
                    <TaskSequencePanel
                        draft={editorState.draft}
                        ui={editorState.ui}
                        validation={editorState.validation}
                        execution={editorState.execution}
                        onValidate={runValidation}
                        onDryRun={simulateDryRun}
                        onToggleAddStep={() => setEditorState((prev) => ({ ...prev, ui: { ...prev.ui, isAddStepOpen: !prev.ui.isAddStepOpen } }))}
                        onAddStep={handleAddStep}
                        onStepClick={handleStepClick}
                        onSaveConfig={handleDoneConfig}
                        onCancelConfig={handleCloseConfig}
                        onToggleStatus={toggleTaskStatus}
                        onDelete={deleteTask}
                        onTypeChange={handleTaskTypeChange}
                        addStepRef={addStepRef}
                        onStepNameChange={handleStepNameChange}
                        onStepDescriptionChange={handleStepDescriptionChange}
                        onStepLabelChange={handleStepLabelChange}
                        onTimeoutChange={handleTimeoutChange}
                        onRetryCountChange={handleRetryCountChange}
                        onRetryDelayChange={handleRetryDelayChange}
                        onScreenshotModeChange={handleScreenshotModeChange}
                        onConditionChange={handleConditionChange}
                        onActionTargetChange={handleActionTargetChange}
                        onActionInputValueChange={handleActionInputValueChange}
                        onNavigationUrlChange={handleNavigationUrlChange}
                        onAssertionTypeChange={handleAssertionTypeChange}
                        onAssertionKindChange={handleAssertionKindChange}
                        onAssertionExpectedValueChange={handleAssertionExpectedValueChange}
                        onWaitConfigChange={handleWaitConfigChange}
                        onDetectConfigChange={handleDetectConfigChange}
                        onLoopConfigChange={handleLoopConfigChange}
                        onBranchConfigChange={handleBranchConfigChange}
                    />
                )}
            </div>
        </div>
    );
}
