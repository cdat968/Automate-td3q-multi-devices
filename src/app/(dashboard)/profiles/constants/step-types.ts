// profiles/constants/step-types.ts

import type { StepType } from "../types/automation-step";

export const STEP_TYPE_OPTIONS: Array<{
    value: StepType;
    label: string;
    icon: string;
    description: string;
}> = [
    {
        value: "dom_click",
        label: "DOM Click",
        icon: "touch_app",
        description: "Click a web element using a selector",
    },
    {
        value: "dom_type",
        label: "DOM Type",
        icon: "keyboard",
        description: "Type text into a web input",
    },
    {
        value: "visual_click",
        label: "Visual Click",
        icon: "ads_click",
        description: "Click using visual template matching",
    },
    {
        value: "visual_type",
        label: "Visual Type",
        icon: "keyboard",
        description: "Type text triggered by visual detection",
    },
    {
        value: "wait_dom",
        label: "Wait DOM",
        icon: "hourglass_top",
        description: "Wait for a DOM element state",
    },
    {
        value: "wait_visual",
        label: "Wait Visual",
        icon: "visibility",
        description: "Wait for a visual object to appear",
    },
    {
        value: "wait_tab",
        label: "Wait Tab",
        icon: "tab",
        description: "Wait for a browser tab condition",
    },
    {
        value: "delay",
        label: "Delay",
        icon: "timer",
        description: "Pause for a fixed duration",
    },
    {
        value: "navigation",
        label: "Navigate",
        icon: "language",
        description: "Go to a specific URL",
    },
    {
        value: "tab_management",
        label: "Tabs",
        icon: "tab",
        description: "Manage browser tabs",
    },
    {
        value: "assertion",
        label: "Assert",
        icon: "verified",
        description: "Verify state or milestone",
    },
    {
        value: "loop",
        label: "Loop",
        icon: "all_inclusive",
        description: "Repeat a sequence of steps",
    },
    {
        value: "branch",
        label: "Branch",
        icon: "call_split",
        description: "Conditional logic flow",
    },
];

export const STEP_TYPE_ICON_MAP: Record<StepType, string> = {
    dom_click: "touch_app",
    dom_type: "keyboard",
    visual_click: "ads_click",
    visual_type: "keyboard",
    wait_dom: "hourglass_top",
    wait_visual: "visibility",
    wait_tab: "tab",
    delay: "timer",
    navigation: "language",
    tab_management: "tab",
    assertion: "verified",
    loop: "all_inclusive",
    branch: "call_split",
};

export const STEP_TYPE_LABEL_MAP: Record<StepType, string> = {
    dom_click: "DOM Click",
    dom_type: "DOM Type",
    visual_click: "Visual Click",
    visual_type: "Visual Type",
    wait_dom: "Wait DOM",
    wait_visual: "Wait Visual",
    wait_tab: "Wait Tab",
    delay: "Delay",
    navigation: "Navigate",
    tab_management: "Tabs",
    assertion: "Assert",
    loop: "Loop",
    branch: "Branch",
};