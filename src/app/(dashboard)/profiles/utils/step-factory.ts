// profiles/utils/step-factory.ts

import type {
    AutomationStep,
    BranchStepConfig,
    LoopStepConfig,
    StepCondition,
    StepRuntimePolicy,
    StepType,
    StepConfig,
    NavigateStepConfig,
    DomClickStepConfig,
    VisualClickStepConfig,
    WaitDomStepConfig,
    WaitVisualStepConfig,
    DelayStepConfig,
    TabSwitchStepConfig,
    AssertionStepConfig
} from "../types/automation-step";
import type { GameProfile, NewProfileDraft, ProfileAssignment } from "../types/game-profile";
import { STEP_TYPE_ICON_MAP, STEP_TYPE_LABEL_MAP } from "../constants/step-types";

function makeId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultRuntimePolicy(): StepRuntimePolicy {
    return {
        timeoutSec: 10,
        retryCount: 2,
        retryDelayMs: 500,
        failAction: "stop_flow",
        failTarget: null,
        screenshotOnFailure: "full_screen",
        continueOnSuccess: true,
    };
}

export function createDefaultCondition(): StepCondition {
    return {
        source: { kind: "variable", name: "lastDetectResult" },
        operator: "eq",
        value: true,
    };
}

export function createDefaultNavigateConfig(): NavigateStepConfig {
    return { kind: "navigation", url: "https://" };
}

export function createDefaultDomClickConfig(): DomClickStepConfig {
    return {
        kind: "dom_click",
        target: { kind: "dom", selector: "" },
    };
}

export function createDefaultVisualClickConfig(): VisualClickStepConfig {
    return {
        kind: "visual_click",
        target: { kind: "visual-template", assetId: "" },
        detection: {
            kind: "visual-template",
            threshold: 0.85,
            multiScale: false,
            grayscale: true,
            region: null,
        },
    };
}

export function createDefaultWaitVisualConfig(): WaitVisualStepConfig {
    return {
        kind: "wait_visual",
        target: { kind: "visual-template", assetId: "" },
        detection: {
            kind: "visual-template",
            threshold: 0.85,
            multiScale: false,
            grayscale: true,
            region: null,
        },
        state: "visible",
    };
}

export function createDefaultWaitDomConfig(): WaitDomStepConfig {
    return {
        kind: "wait_dom",
        target: { kind: "dom", selector: "" },
        state: "visible",
    };
}

export function createDefaultDelayConfig(): DelayStepConfig {
    return { kind: "delay", durationMs: 1000 };
}

export function createDefaultLoopConfig(): LoopStepConfig {
    return {
        kind: "loop",
        mode: "count",
        count: 10,
        untilCondition: null,
        delayBetweenIterationsMs: 500,
        bodyStepIds: [],
    };
}

export function createDefaultBranchConfig(): BranchStepConfig {
    return {
        kind: "branch",
        ifCondition: createDefaultCondition(),
        onTrue: { type: "next_step" },
        onFalse: { type: "skip_step" },
    };
}

export function createDefaultStepConfig(type: StepType): StepConfig {
    switch (type) {
        case "navigation":
            return createDefaultNavigateConfig();
        case "dom_click":
            return createDefaultDomClickConfig();
        case "dom_type":
            return { kind: "dom_type", target: { kind: "dom", selector: "" }, value: "" };
        case "visual_click":
            return createDefaultVisualClickConfig();
        case "visual_type":
            return {
                kind: "visual_type",
                target: { kind: "visual-template", assetId: "" },
                detection: {
                    kind: "visual-template",
                    threshold: 0.85,
                    multiScale: false,
                    grayscale: true,
                    region: null,
                },
                value: "",
            };
        case "wait_dom":
            return createDefaultWaitDomConfig();
        case "wait_visual":
            return createDefaultWaitVisualConfig();
        case "wait_tab":
            return { kind: "wait_tab", mode: "new_tab" };
        case "delay":
            return createDefaultDelayConfig();
        case "loop":
            return createDefaultLoopConfig();
        case "branch":
            return createDefaultBranchConfig();
        case "tab_management":
            return { kind: "tab_management", mode: "by_title", title: "" };
        case "assertion":
            return { 
                kind: "assertion", 
                type: "state_check", 
                assertionKind: "visible" 
            };
        default: {
            const exhaustiveCheck: never = type;
            throw new Error(`Unsupported step type: ${exhaustiveCheck}`);
        }
    }
}

export function createDefaultStep(type: StepType, order: number): AutomationStep {
    return {
        id: makeId("step"),
        order,
        name: `New ${STEP_TYPE_LABEL_MAP[type]} Step`,
        type,
        status: "enabled",
        description: "",
        label: "",
        condition: null,
        runtime: createDefaultRuntimePolicy(),
        config: createDefaultStepConfig(type),
        ui: {
            collapsed: false,
            icon: STEP_TYPE_ICON_MAP[type],
            colorHint: "primary",
        },
    };
}

export function resequenceSteps(steps: AutomationStep[]): AutomationStep[] {
    return steps.map((step, index) => ({
        ...step,
        order: index + 1,
    }));
}

export function cloneStep(step: AutomationStep, newOrder: number): AutomationStep {
    return {
        ...structuredCloneSafe(step),
        id: makeId("step"),
        order: newOrder,
        name: `${step.name} Copy`,
    };
}

export function changeStepType(step: AutomationStep, nextType: StepType): AutomationStep {
    return {
        ...step,
        type: nextType,
        config: createDefaultStepConfig(nextType),
        ui: {
            ...step.ui,
            icon: STEP_TYPE_ICON_MAP[nextType],
        },
    };
}

export function createDefaultAssignment(): ProfileAssignment {
    return {
        deviceIds: [],
        scheduleMode: "manual",
        startTime: "22:00",
        intervalMins: 60,
        cronExpr: "",
        visibility: "private",
        executionMode: "sequential",
    };
}

export function createEmptyProfileDraft(): NewProfileDraft {
    return {
        basic: {
            name: "",
            game: "",
            description: "",
            tags: [],
            icon: "sports_esports",
            status: "draft",
            version: "v1.0.0",
        },
        steps: [],
        assignment: createDefaultAssignment(),
    };
}

export function createGameProfileFromDraft(draft: NewProfileDraft): GameProfile {
    const now = new Date().toISOString();

    return {
        id: makeId("profile"),
        name: draft.basic.name || "New Profile",
        game: draft.basic.game || "Unknown Game",
        description: draft.basic.description || "",
        tags: draft.basic.tags ?? [],
        icon: draft.basic.icon,
        status: draft.basic.status ?? "draft",
        version: draft.basic.version ?? "v1.0.0",
        ownerId: draft.basic.ownerId,
        workspaceId: draft.basic.workspaceId,
        steps: resequenceSteps(draft.steps),
        assignment: draft.assignment,
        metrics: {
            successRate: undefined,
            totalRuns: 0,
            lastRunAt: undefined,
        },
        createdAt: now,
        updatedAt: now,
    };
}

export function createPresetStep(type: StepType, order: number, name?: string): AutomationStep {
    const step = createDefaultStep(type, order);
    if (name?.trim()) {
        step.name = name.trim();
    }
    return step;
}

function structuredCloneSafe<T>(value: T): T {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
}