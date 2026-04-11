// profiles/utils/step-adapter.ts
// NOTE: This adapter is for migrating legacy task data that used the old
// "action" | "wait" | "detect" type enum. New steps use config.kind directly.

import type { AutomationStep, StepType } from "../types/automation-step";
import {
    createDefaultRuntimePolicy,
    createDefaultStepConfig,
} from "./step-factory";

// ⚠️ Maps legacy "action/wait/detect" strings to valid StepType values
type LegacyTask = {
    id: string;
    step: number;
    name: string;
    type: string;
    status: string;
    icon?: string;
    color?: string;
};

function normalizeStepType(type: string): StepType {
    const t = type.toLowerCase();

    // 1. Current schema kinds — passed through as-is
    const CURRENT_KINDS: Record<string, StepType> = {
        dom_click: "dom_click",
        dom_type: "dom_type",
        visual_click: "visual_click",
        visual_type: "visual_type",
        wait_dom: "wait_dom",
        wait_visual: "wait_visual",
        wait_tab: "wait_tab",
        delay: "delay",
        assertion: "assertion",
        navigation: "navigation",
        tab_management: "tab_management",
        loop: "loop",
        branch: "branch",
    };
    if (t in CURRENT_KINDS) return CURRENT_KINDS[t];

    // 2. Legacy aliases — explicit mapping with documented intent
    // "action" → dom_click (generic DOM interaction; safest narrowing)
    if (t === "action") return "dom_click";
    // "wait" → wait_dom (generic wait; assumes DOM context)
    if (t === "wait") return "wait_dom";
    // "detect" → visual_click (legacy visual detection action)
    // NOTE: This is an opinionated mapping. If detect was used for
    // assertion/navigation, the user must correct the step kind manually.
    if (t === "detect") return "visual_click";

    // 3. Unknown type — log a warning and fall back to dom_click
    // This prevents silent misrepresentation of step meaning
    console.warn(
        `[step-adapter] Unknown step type "${type}" encountered during migration. ` +
        `Falling back to "dom_click". Please correct this step manually.`,
    );
    return "dom_click";
}

function normalizeStatus(status: string): "enabled" | "disabled" {
    const s = status.toLowerCase();
    if (s === "enabled" || s === "running") return "enabled";
    if (s === "disabled") return "disabled";
    return "enabled";
}

export function adaptLegacyTaskToStep(task: LegacyTask): AutomationStep {
    const type = normalizeStepType(task.type);

    return {
        id: task.id,
        order: task.step,
        name: task.name,
        type,
        status: normalizeStatus(task.status),

        description: "",
        label: "",
        condition: null,

        runtime: createDefaultRuntimePolicy(),

        config: createDefaultStepConfig(type),

        ui: {
            collapsed: true,
            icon: task.icon,
            colorHint: undefined,
        },
    };
}

export function adaptLegacyTasks(tasks: LegacyTask[]): AutomationStep[] {
    return tasks
        .map(adaptLegacyTaskToStep)
        .sort((a, b) => a.order - b.order);
}