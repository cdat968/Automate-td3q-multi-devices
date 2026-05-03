import type { AgentFleetItemView } from "../_types/agent-types";

export const INITIAL_AGENTS: AgentFleetItemView[] = [
    {
        id: "agt-001",
        name: "Alpha-Node-01",
        hostname: "mac-mini-m2",
        agentType: "local_dev",
        platform: "macos",
        runtimeModeLabel: "Local Native",
        runtimeTypes: ["browser"],
        status: "busy",
        agentVersion: "v1.2.4",

        connection: {
            websocketStatus: "connected",
            sessionId: "sess-9a8f7c",
            connectedAt: "2026-05-02T10:15:00Z",
            lastHeartbeatAt: "2026-05-02T10:15:12Z",
            latencyMs: 14,
            backendUrl: "wss://api.gameflow.local/ws",
        },

        readiness: {
            status: "ready",
            lastCheckedAt: "2026-05-02T10:14:50Z",
            checks: [
                {
                    key: "chromium",
                    label: "Chromium",
                    status: "ok",
                    message: "v112.x",
                },
                {
                    key: "opencv",
                    label: "OpenCV",
                    status: "ok",
                    message: "4.8.x",
                },
                {
                    key: "ruffle",
                    label: "Ruffle Extension",
                    status: "ok",
                    message: "enabled",
                },
                {
                    key: "templates",
                    label: "Template Assets",
                    status: "ok",
                    message: "synced",
                },
                {
                    key: "artifactDir",
                    label: "Artifact Directory",
                    status: "ok",
                },
                { key: "token", label: "Token", status: "ok" },
            ],
        },

        capabilities: [
            "browser-runtime",
            "chromium",
            "ruffle",
            "visual-detection",
            "template-matching",
            "diagnostics-overlay",
            "artifact-upload",
            "websocket-control",
        ],

        supportedScenarios: ["td3q.attendance"],

        assignment: {
            profileId: "profile-farming-pro-v4",
            profileName: "Farming_Pro_v4",
            scenarioId: "td3q.attendance",
            scenarioName: "TD3Q Attendance",
            presetId: "td3q.default-browser",
            presetName: "TD3Q Default Browser",
        },

        currentRun: {
            runId: "run-3312",
            scenarioId: "td3q.attendance",
            scenarioName: "TD3Q Attendance",
            presetId: "td3q.default-browser",
            presetName: "TD3Q Default Browser",
            status: "running",
            startedAt: "2026-05-02T10:00:00Z",
            currentState: "ATTENDANCE_DAILY_DONE",
            lastEvent: "Detected Template: daily_done.png",
        },

        telemetry: {
            cpuPercent: 42,
            memoryUsedMb: 1228,
            memoryTotalMb: 8192,
            uptimeSec: 1216800,
            chromiumProcessCount: 2,
        },

        isSchedulingPaused: false,
        createdAt: "2026-05-01T08:00:00Z",
        updatedAt: "2026-05-02T10:15:12Z",
    },
    {
        id: "agt-002",
        name: "Delta-Bot-09",
        hostname: "win-docker-host",
        agentType: "docker",
        platform: "windows",
        runtimeModeLabel: "Docker",
        runtimeTypes: ["browser"],
        status: "idle",
        agentVersion: "v1.2.4",

        connection: {
            websocketStatus: "connected",
            sessionId: "sess-1b2c3d",
            connectedAt: "2026-05-02T10:20:00Z",
            lastHeartbeatAt: "2026-05-02T10:20:05Z",
            latencyMs: 28,
            backendUrl: "wss://api.gameflow.local/ws",
        },

        readiness: {
            status: "ready",
            lastCheckedAt: "2026-05-02T10:19:50Z",
            checks: [
                { key: "chromium", label: "Chromium", status: "ok" },
                { key: "opencv", label: "OpenCV", status: "ok" },
                { key: "ruffle", label: "Ruffle Extension", status: "ok" },
                { key: "templates", label: "Template Assets", status: "ok" },
                {
                    key: "artifactDir",
                    label: "Artifact Directory",
                    status: "ok",
                },
                { key: "token", label: "Token", status: "ok" },
            ],
        },

        capabilities: [
            "browser-runtime",
            "chromium",
            "ruffle",
            "visual-detection",
            "template-matching",
            "diagnostics-overlay",
            "artifact-upload",
            "websocket-control",
        ],

        supportedScenarios: ["td3q.attendance"],

        assignment: {
            profileId: "profile-farming-lite-v2",
            profileName: "Farming_Lite_v2",
            scenarioId: "td3q.attendance",
            scenarioName: "TD3Q Attendance",
            presetId: "td3q.default-browser",
            presetName: "TD3Q Default Browser",
        },

        telemetry: {
            cpuPercent: 12,
            memoryUsedMb: 640,
            memoryTotalMb: 4096,
            uptimeSec: 86400,
            chromiumProcessCount: 0,
        },

        isSchedulingPaused: false,
        createdAt: "2026-05-01T08:30:00Z",
        updatedAt: "2026-05-02T10:20:05Z",
    },
    {
        id: "agt-003",
        name: "Zeta-Node-05",
        hostname: "ubuntu-worker-1",
        agentType: "remote_vps",
        platform: "linux",
        runtimeModeLabel: "Remote VPS Agent",
        runtimeTypes: ["browser"],
        status: "error",
        agentVersion: "v1.2.3",

        connection: {
            websocketStatus: "disconnected",
            sessionId: "sess-lost-77",
            connectedAt: "2026-05-02T09:40:00Z",
            lastHeartbeatAt: "2026-05-02T10:01:00Z",
            latencyMs: undefined,
            backendUrl: "wss://api.gameflow.local/ws",
            disconnectReason: "WebSocket heartbeat timeout",
        },

        readiness: {
            status: "not_ready",
            lastCheckedAt: "2026-05-02T10:01:00Z",
            checks: [
                {
                    key: "chromium",
                    label: "Chromium",
                    status: "failed",
                    message: "Chromium executable not found",
                },
                { key: "opencv", label: "OpenCV", status: "ok" },
                { key: "ruffle", label: "Ruffle Extension", status: "ok" },
                { key: "templates", label: "Template Assets", status: "ok" },
                {
                    key: "artifactDir",
                    label: "Artifact Directory",
                    status: "ok",
                },
                { key: "token", label: "Token", status: "ok" },
            ],
        },

        capabilities: [
            "browser-runtime",
            "ruffle",
            "visual-detection",
            "template-matching",
            "artifact-upload",
            "websocket-control",
        ],

        supportedScenarios: ["td3q.attendance"],

        assignment: {
            profileId: "profile-combat-aggro",
            profileName: "Combat_Aggro",
            scenarioId: "td3q.attendance",
            scenarioName: "TD3Q Attendance",
            presetId: "td3q.default-browser",
            presetName: "TD3Q Default Browser",
        },

        telemetry: {
            cpuPercent: 5,
            memoryUsedMb: 300,
            memoryTotalMb: 4096,
            uptimeSec: 8100,
            chromiumProcessCount: 0,
        },

        isSchedulingPaused: false,
        createdAt: "2026-05-01T09:00:00Z",
        updatedAt: "2026-05-02T10:01:00Z",
    },
];
