import type { AutomationStep } from "./automation-step";


export type ProfileStatus = "draft" | "active" | "paused" | "error";
export type ProfileVisibility = "private" | "team" | "public";
export type ScheduleMode = "manual" | "interval" | "cron" | "daily";

export interface GameProfile {
    id: string;
    name: string;
    game: string;
    description?: string;
    tags: string[];
    icon?: string;
    status: "draft" | "active" | "paused" | "error";
    version: string;
    ownerId?: string;
    workspaceId?: string;
    steps: AutomationStep[];
    assignment: ProfileAssignment;
    metrics?: ProfileMetrics;
    createdAt: string;
    updatedAt: string;
}

export interface ProfileAssignment {
    deviceIds: string[];
    scheduleMode: "manual" | "interval" | "cron" | "daily";
    startTime?: string;
    intervalMins?: number;
    cronExpr?: string;
    visibility?: "private" | "team" | "public";
    executionMode?: "sequential" | "parallel";
}

export interface ProfileMetrics {
    successRate?: number;
    totalRuns?: number;
    lastRunAt?: string;
}


export interface NewProfileDraft {
    basic: {
        name: string;
        game: string;
        description?: string;
        tags: string[];
        icon?: string;
        status?: ProfileStatus;
        version?: string;
        ownerId?: string;
        workspaceId?: string;
    };
    steps: AutomationStep[];
    assignment: ProfileAssignment;
}