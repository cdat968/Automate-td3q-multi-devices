import type { PersistedAutomationStep } from "./persisted-step";

export interface PersistedGameProfile {
    schemaVersion: string;
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
    steps: PersistedAutomationStep[];
    assignment: PersistedProfileAssignment;
    metrics?: PersistedProfileMetrics;
    createdAt: string;
    updatedAt: string;
}

export interface PersistedProfileAssignment {
    deviceIds: string[];
    scheduleMode: "manual" | "interval" | "cron" | "daily";
    startTime?: string;
    intervalMins?: number;
    cronExpr?: string;
    visibility?: "private" | "team" | "public";
    executionMode?: "sequential" | "parallel";
}

export interface PersistedProfileMetrics {
    successRate?: number;
    totalRuns?: number;
    lastRunAt?: string;
}
