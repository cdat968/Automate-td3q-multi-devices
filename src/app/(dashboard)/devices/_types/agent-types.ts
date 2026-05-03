export type AgentType =
    | "local_dev"
    | "docker"
    | "desktop"
    | "android"
    | "remote_vps";

export type AgentPlatform =
    | "macos"
    | "windows"
    | "linux"
    | "android"
    | "unknown";

export type RuntimeType = "browser" | "windows" | "android";

export type RuntimeAgentStatus =
    | "online"
    | "offline"
    | "idle"
    | "busy"
    | "error"
    | "not_ready";

export type AgentReadinessStatus =
    | "ready"
    | "not_ready"
    | "warning"
    | "unknown";

export type AgentConnectionStatus =
    | "connected"
    | "disconnected"
    | "reconnecting";

export type RuntimeRunStatus =
    | "queued"
    | "assigned"
    | "accepted"
    | "running"
    | "succeeded"
    | "failed"
    | "cancelled"
    | "agent_lost";

export type ReadinessCheckStatus = "ok" | "warning" | "failed" | "skipped";

export type AgentCapability =
    | "browser-runtime"
    | "chromium"
    | "ruffle"
    | "visual-detection"
    | "template-matching"
    | "diagnostics-overlay"
    | "artifact-upload"
    | "websocket-control";

export type AgentConnectionView = {
    websocketStatus: AgentConnectionStatus;
    sessionId?: string;
    connectedAt?: string;
    lastHeartbeatAt?: string;
    latencyMs?: number;
    backendUrl?: string;
    disconnectReason?: string;
};

export type AgentReadinessCheck = {
    key: string;
    label: string;
    status: ReadinessCheckStatus;
    message?: string;
    checkedAt?: string;
};

export type AgentReadinessView = {
    status: AgentReadinessStatus;
    lastCheckedAt?: string;
    checks: AgentReadinessCheck[];
};

export type AgentAssignmentView = {
    profileId?: string;
    profileName?: string;
    scenarioId?: string;
    scenarioName?: string;
    presetId?: string;
    presetName?: string;
};

export type RuntimeRunSummary = {
    runId: string;
    scenarioId: string;
    scenarioName: string;
    presetId: string;
    presetName: string;
    status: RuntimeRunStatus;
    startedAt?: string;
    finishedAt?: string;
    currentState?: string;
    lastEvent?: string;
    errorCode?: string;
    errorMessage?: string;
};

export type AgentTelemetryView = {
    cpuPercent?: number;
    memoryUsedMb?: number;
    memoryTotalMb?: number;
    uptimeSec?: number;
    chromiumProcessCount?: number;
};

export type RuntimeRunEventView = {
    id: string;
    type: string;
    message?: string;
    createdAt: string;
};

export type RuntimeRunArtifactView = {
    id: string;
    kind: "screenshot" | "overlay" | "log" | "trace" | "other";
    url: string;
    createdAt: string;
};

export type AgentFleetItemView = {
    id: string;
    name: string;
    hostname: string;
    agentType: AgentType;
    platform: AgentPlatform;
    runtimeModeLabel: string;
    runtimeTypes: RuntimeType[];
    status: RuntimeAgentStatus;
    agentVersion: string;

    connection: AgentConnectionView;
    readiness: AgentReadinessView;

    capabilities: AgentCapability[];
    supportedScenarios: string[];

    assignment?: AgentAssignmentView;
    currentRun?: RuntimeRunSummary;
    recentEvents?: RuntimeRunEventView[];
    artifacts?: RuntimeRunArtifactView[];

    telemetry?: AgentTelemetryView;

    isSchedulingPaused?: boolean;
    createdAt?: string;
    updatedAt?: string;
};
