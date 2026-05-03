"use client";

import React, { useState, useEffect } from "react";
import { useNotification } from "@/contexts/NotificationContext";
import { INITIAL_AGENTS } from "./_data/mock-agents";
import type {
    AgentFleetItemView,
    RuntimeAgentStatus,
    AgentReadinessStatus,
} from "./_types/agent-types";
import { AgentStatsCards } from "./_components/AgentStatsCards";
import { AgentFleetList } from "./_components/AgentFleetList";
import { AgentBottomActionBar } from "./_components/AgentBottomActionBar";
import { AgentManagerHeader } from "./_components/AgentManagerHeader";

// --- Mock Data ---

// type Agent = {
//   id: string;
//   name: string;
//   hostname: string;
//   runtimeMode:
//   | "Local Native"
//   | "Docker"
//   | "Desktop"
//   | "Android"
//   | "Remote VPS Agent";
//   status: "Online" | "Offline" | "Idle" | "Busy" | "Error" | "Not Ready";
//   readiness: "Ready" | "Not Ready";
//   lastHeartbeat: string;
//   currentRun: string;
//   assignedProfile: string;
//   agentVersion: string;
//   wsStatus: "Connected" | "Disconnected";
//   sessionId: string;
//   latency: string;
//   backendUrl: string;
//   connectedAt: string;
//   env: {
//     chromium: "OK" | "Missing";
//     opencv: "OK" | "Missing";
//     ruffle: "OK" | "Missing";
//     templates: "OK" | "Missing";
//     artifactDir: "Writable" | "Error";
//     token: "Valid" | "Invalid";
//   };
//   capabilities: {
//     browser: boolean;
//     chromium: boolean;
//     ruffle: boolean;
//     visual: boolean;
//     template: boolean;
//     overlay: boolean;
//     artifact: boolean;
//   };
//   runInfo: {
//     runId: string;
//     scenario: string;
//     preset: string;
//     state: "Running" | "Idle" | "Failed" | "Cancelled";
//     startedAt: string;
//     lastEvent: string;
//   };
//   telemetry: {
//     cpu: string;
//     memory: string;
//     uptime: string;
//     chromiumCount: number;
//   };
// };
type Agent = AgentFleetItemView;

// const INITIAL_AGENTS: Agent[] = [
//   {
//     id: "agt-001",
//     name: "Alpha-Node-01",
//     hostname: "mac-mini-m2",
//     runtimeMode: "Local Native",
//     status: "Busy",
//     readiness: "Ready",
//     lastHeartbeat: "2ms ago",
//     currentRun: "TD3Q Attendance",
//     assignedProfile: "Farming_Pro_v4",
//     agentVersion: "v1.2.4",
//     wsStatus: "Connected",
//     sessionId: "sess-9a8f7c",
//     latency: "14ms",
//     backendUrl: "wss://api.gameflow.local/ws",
//     connectedAt: "2026-05-02T10:15:00Z",
//     env: {
//       chromium: "OK",
//       opencv: "OK",
//       ruffle: "OK",
//       templates: "OK",
//       artifactDir: "Writable",
//       token: "Valid",
//     },
//     capabilities: {
//       browser: true,
//       chromium: true,
//       ruffle: true,
//       visual: true,
//       template: true,
//       overlay: true,
//       artifact: true,
//     },
//     runInfo: {
//       runId: "run-3312",
//       scenario: "TD3Q Attendance",
//       preset: "TD3Q Default Browser",
//       state: "Running",
//       startedAt: "15m ago",
//       lastEvent: "Detected Template: daily_done.png",
//     },
//     telemetry: {
//       cpu: "42%",
//       memory: "1.2 GB / 8 GB",
//       uptime: "14d 2h",
//       chromiumCount: 2,
//     },
//   },
//   {
//     id: "agt-002",
//     name: "Delta-Bot-09",
//     hostname: "win-docker-host",
//     runtimeMode: "Docker",
//     status: "Error",
//     readiness: "Not Ready",
//     lastHeartbeat: "Disconnected",
//     currentRun: "None",
//     assignedProfile: "Combat_Aggro",
//     agentVersion: "v1.2.3",
//     wsStatus: "Disconnected",
//     sessionId: "-",
//     latency: "-",
//     backendUrl: "wss://api.gameflow.local/ws",
//     connectedAt: "-",
//     env: {
//       chromium: "Missing",
//       opencv: "OK",
//       ruffle: "OK",
//       templates: "OK",
//       artifactDir: "Writable",
//       token: "Valid",
//     },
//     capabilities: {
//       browser: false,
//       chromium: false,
//       ruffle: true,
//       visual: true,
//       template: true,
//       overlay: false,
//       artifact: true,
//     },
//     runInfo: {
//       runId: "-",
//       scenario: "-",
//       preset: "-",
//       state: "Idle",
//       startedAt: "-",
//       lastEvent: "Crash: Chromium executable not found",
//     },
//     telemetry: {
//       cpu: "5%",
//       memory: "300 MB / 4 GB",
//       uptime: "2h 15m",
//       chromiumCount: 0,
//     },
//   },
//   {
//     id: "agt-003",
//     name: "Zeta-Node-05",
//     hostname: "ubuntu-server-1",
//     runtimeMode: "Desktop",
//     status: "Idle",
//     readiness: "Ready",
//     lastHeartbeat: "14m ago",
//     currentRun: "None",
//     assignedProfile: "Unassigned",
//     agentVersion: "v1.2.4",
//     wsStatus: "Connected",
//     sessionId: "sess-1b2c3d",
//     latency: "45ms",
//     backendUrl: "wss://api.gameflow.local/ws",
//     connectedAt: "2026-05-01T08:00:00Z",
//     env: {
//       chromium: "OK",
//       opencv: "OK",
//       ruffle: "OK",
//       templates: "OK",
//       artifactDir: "Writable",
//       token: "Valid",
//     },
//     capabilities: {
//       browser: true,
//       chromium: true,
//       ruffle: true,
//       visual: true,
//       template: true,
//       overlay: true,
//       artifact: true,
//     },
//     runInfo: {
//       runId: "-",
//       scenario: "-",
//       preset: "-",
//       state: "Idle",
//       startedAt: "-",
//       lastEvent: "Job finished successfully",
//     },
//     telemetry: {
//       cpu: "12%",
//       memory: "800 MB / 16 GB",
//       uptime: "30d 12h",
//       chromiumCount: 0,
//     },
//   },
// ];

export default function AgentManagerPage() {
    const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeAgentId, setActiveAgentId] = useState<string | null>(
        "agt-001",
    );
    const [filterOpen, setFilterOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [modal, setModal] = useState<
        | "pair"
        | "assign"
        | "start"
        | "restart"
        | "cancel"
        | "emergency"
        | "logs"
        | "screenshot"
        | null
    >(null);

    // Detail Panel State
    const [detailExpanded, setDetailExpanded] = useState(false);
    const [sectionsOpen, setSectionsOpen] = useState({
        identity: true,
        connection: true,
        readiness: true,
        capabilities: false,
        run: true,
        telemetry: false,
    });

    // Mock Async States
    const [isProcessing, setIsProcessing] = useState(false);
    const [pairStep, setPairStep] = useState<1 | 2 | 3>(1); // 1: Setup, 2: Waiting, 3: Ready

    const { notify } = useNotification();

    const selectedAgents = agents.filter((agent) => selectedIds.has(agent.id));

    const selectedReadyCount = selectedAgents.filter(
        (agent) => agent.readiness.status === "ready",
    ).length;

    const selectedBusyCount = selectedAgents.filter(
        (agent) => agent.status === "busy",
    ).length;

    const selectedErrorCount = selectedAgents.filter(
        (agent) =>
            agent.status === "error" ||
            agent.status === "not_ready" ||
            agent.readiness.status === "not_ready",
    ).length;

    const activeAgent = agents.find((a) => a.id === activeAgentId);

    const handleSelectAgent = (agentId: string) => {
        setActiveAgentId(agentId);

        // Optional: reset detail view when switching device
        setDetailExpanded(false);

        // Optional: reset opened sections to default layout
        setSectionsOpen({
            identity: true,
            connection: true,
            readiness: true,
            capabilities: false,
            run: true,
            telemetry: false,
        });
    };

    // Stats
    const totalAgents = agents.length;
    const onlineAgents = agents.filter((a) =>
        ["online", "idle", "busy"].includes(a.status),
    ).length;

    const idleReadyAgents = agents.filter(
        (a) => a.status === "idle" && a.readiness.status === "ready",
    ).length;

    const errorAgents = agents.filter(
        (a) =>
            ["error", "not_ready"].includes(a.status) ||
            a.readiness.status === "not_ready",
    ).length;

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === agents.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(agents.map((a) => a.id)));
    };

    const toggleSection = (section: keyof typeof sectionsOpen) => {
        setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // Status mapping
    const getStatusClass = (
        status: RuntimeAgentStatus,
        readiness: AgentReadinessStatus,
    ) => {
        if (
            status === "error" ||
            status === "not_ready" ||
            readiness === "not_ready"
        ) {
            return "bg-error/10 text-error animate-pulse shadow-[0_0_10px_rgba(255,115,81,0.2)] border border-error/20";
        }

        if (status === "busy") {
            return "bg-secondary-container/80 text-secondary border border-secondary/20 shadow-[0_0_10px_rgba(135,239,121,0.1)]";
        }

        if (status === "online" || status === "idle") {
            return "bg-primary/10 text-primary shadow-[0_0_10px_rgba(89,238,80,0.1)] border border-primary/20";
        }

        return "bg-surface-variant text-outline-variant";
    };

    const getStatusDot = (
        status: RuntimeAgentStatus,
        readiness: AgentReadinessStatus,
    ) => {
        if (
            status === "error" ||
            status === "not_ready" ||
            readiness === "not_ready"
        ) {
            return "text-error";
        }

        if (status === "busy") {
            return "text-secondary animate-pulse";
        }

        if (status === "online" || status === "idle") {
            return "text-primary animate-pulse";
        }

        return "text-outline-variant";
    };

    const formatAgentStatusLabel = (status: RuntimeAgentStatus) => {
        const labels: Record<RuntimeAgentStatus, string> = {
            online: "Online",
            offline: "Offline",
            idle: "Idle",
            busy: "Busy",
            error: "Error",
            not_ready: "Not Ready",
        };

        return labels[status];
    };

    const formatReadinessLabel = (readiness: AgentReadinessStatus) => {
        const labels: Record<AgentReadinessStatus, string> = {
            ready: "Ready",
            not_ready: "Not Ready",
            warning: "Warning",
            unknown: "Unknown",
        };

        return labels[readiness];
    };

    const getAgentCurrentRunName = (agent: Agent) =>
        agent.currentRun?.scenarioName ?? "None";

    const getAgentCurrentRunState = (agent: Agent) =>
        agent.currentRun?.status ?? "idle";

    const getAgentProfileName = (agent: Agent) =>
        agent.assignment?.profileName ?? "Unassigned";

    const isAgentConnectionError = (agent: Agent) => {
        return (
            agent.status === "error" ||
            agent.status === "not_ready" ||
            agent.status === "offline" ||
            agent.readiness.status === "not_ready" ||
            agent.connection.websocketStatus === "disconnected" ||
            agent.currentRun?.status === "failed" ||
            agent.currentRun?.status === "agent_lost"
        );
    };

    const isAgentRunning = (agent: Agent) => {
        return (
            agent.currentRun?.status === "running" || agent.status === "busy"
        );
    };

    const getShortRunId = (agent: Agent) => {
        const runId = agent.currentRun?.runId;

        if (!runId) return "-";

        const numericPart = runId.match(/\d+$/)?.[0];

        return numericPart ? `#${numericPart}` : runId;
    };

    const renderAgentStatusPill = (agent: Agent) => {
        if (isAgentConnectionError(agent)) {
            return (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-error/10 text-error text-[9px] font-black uppercase tracking-tighter border border-error/20 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-error glow-dot-error" />
                    Conn Error
                </div>
            );
        }

        if (isAgentRunning(agent)) {
            return (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-tighter border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary glow-dot-busy animate-pulse-soft" />
                    Running: {getShortRunId(agent)}
                </div>
            );
        }

        return (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-tertiary/10 text-tertiary text-[9px] font-black uppercase tracking-tighter border border-tertiary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary glow-dot-ready" />
                Awaiting Task
            </div>
        );
    };

    const renderAssignedBadge = (agent: Agent) => {
        return (
            <div className="inline-flex max-w-full items-center gap-1.5 px-2 py-1 rounded-full bg-surface-container-highest border border-outline-variant/20 text-[9px] font-black uppercase tracking-tighter text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px] text-primary">
                    assignment
                </span>
                <span className="truncate">{getAgentProfileName(agent)}</span>
            </div>
        );
    };

    const getDetailHeartbeatView = (agent: Agent) => {
        if (isAgentConnectionError(agent)) {
            return {
                label: "14m 2s",
                className: "text-xs font-bold font-mono text-error",
            };
        }

        if (isAgentRunning(agent)) {
            return {
                label: "2s ago",
                className: "text-xs font-mono text-on-surface-variant",
            };
        }

        return {
            label: "live",
            className: "text-xs font-bold font-mono text-tertiary",
        };
    };

    const renderDetailFieldValue = (value: React.ReactNode) => {
        if (typeof value === "string" || typeof value === "number") {
            return (
                <p className="text-xs font-bold text-on-surface truncate">
                    {value}
                </p>
            );
        }

        return <div className="min-w-0">{value}</div>;
    };

    const getReadinessCheckView = (
        status: Agent["readiness"]["checks"][number]["status"],
    ) => {
        if (status === "ok") {
            return {
                containerClass:
                    "flex items-center justify-between p-3 bg-tertiary/5 border border-tertiary/20 rounded-xl",
                iconClass: "text-tertiary",
                metaClass: "text-tertiary",
                icon: "check_circle",
                meta: "OK",
            };
        }

        if (status === "failed") {
            return {
                containerClass:
                    "flex items-center justify-between p-3 bg-error/5 border border-error/20 rounded-xl text-error",
                iconClass: "text-error",
                metaClass: "text-error",
                icon: "error",
                meta: "ERROR",
            };
        }

        if (status === "warning") {
            return {
                containerClass:
                    "flex items-center justify-between p-3 bg-secondary/5 border border-secondary/20 rounded-xl",
                iconClass: "text-secondary",
                metaClass: "text-secondary",
                icon: "warning",
                meta: "WARN",
            };
        }

        return {
            containerClass:
                "flex items-center justify-between p-3 bg-surface-container-highest/40 border border-outline-variant/20 rounded-xl",
            iconClass: "text-on-surface-variant",
            metaClass: "text-on-surface-variant",
            icon: "remove_circle",
            meta: "SKIP",
        };
    };

    // Handlers
    const handleAction = (action: string) => {
        setBulkOpen(false);
        if (action === "Restart Agent Service") setModal("restart");
        else if (action === "Cancel Current Runs") setModal("cancel");
        else if (action === "Disable / Forget Agent")
            setModal("emergency"); // Reusing dangerous modal
        else if (action === "Run Doctor") {
            setIsProcessing(true);
            notify("info", "Running Diagnostics (Doctor)...");
            setTimeout(() => {
                setIsProcessing(false);
                notify("success", "Doctor finished. All agents healthy.");
            }, 2000);
        } else {
            notify("info", `Action: ${action} triggered`);
        }
    };

    const handleAsyncAction = (
        successMessage: string,
        type: "success" | "warning" | "info" = "success",
    ) => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setModal(null);
            notify(type, successMessage);
        }, 1500);
    };

    // Pair Flow Simulation
    useEffect(() => {
        if (modal === "pair" && pairStep === 2) {
            const timer = setTimeout(() => setPairStep(3), 3000);
            return () => clearTimeout(timer);
        }
    }, [modal, pairStep]);

    return (
        <>
            <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-modal-enter {
          animation: fadeInScale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-dropdown-enter {
          animation: slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .kinetic-gradient {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
        }
          @keyframes pulseSoft {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.55;
                transform: scale(0.82);
            }
            }

            .animate-pulse-soft {
            animation: pulseSoft 1.25s ease-in-out infinite;
            }

            .glow-dot-busy {
            box-shadow: 0 0 8px var(--color-primary);
            }

            .glow-dot-ready {
            box-shadow: 0 0 8px var(--color-tertiary);
            }

            .glow-dot-error {
            box-shadow: 0 0 8px var(--color-error);
            }
      `}</style>

            {/* Page Header */}
            {/* Page Header / Toolbar */}
            <AgentManagerHeader
                filterOpen={filterOpen}
                bulkOpen={bulkOpen}
                onToggleFilter={() => setFilterOpen((value) => !value)}
                onToggleBulk={() => setBulkOpen((value) => !value)}
                onBulkAction={handleAction}
                onPairAgent={() => {
                    setModal("pair");
                    setPairStep(1);
                }}
            />

            {/* Summary KPIs */}
            <AgentStatsCards
                totalAgents={totalAgents}
                onlineAgents={onlineAgents}
                idleReadyAgents={idleReadyAgents}
                errorAgents={errorAgents}
            />

            {/* Main Content Area */}

            {/* flex gap-6 items-start pb-32 */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)] gap-6 items-start pb-32">
                {/* Agent Table */}
                <AgentFleetList
                    agents={agents}
                    selectedIds={selectedIds}
                    activeAgentId={activeAgentId}
                    onSelectAgent={handleSelectAgent}
                    onToggleSelect={toggleSelect}
                    onToggleSelectAll={toggleSelectAll}
                    getStatusClass={getStatusClass}
                />

                {/* Dynamic Detail Panel */}
                {/* flex-col w-[440px] */}
                {activeAgent && (
                    <aside className="hidden xl:flex min-w-0 flex-col bg-surface-container-low rounded-xl sticky top-24 overflow-hidden shrink-0 border border-outline-variant/10 shadow-2xl transition-all duration-300 animate-modal-enter h-[calc(100vh-140px)] min-h-[560px]">
                        {/* Panel Header */}
                        <div className="p-6 border-b border-outline-variant/10 bg-surface-container/30 shrink-0">
                            <div className="flex items-center justify-between mb-5">
                                <div className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />{" "}
                                    Live Telemetry
                                </div>
                                <button
                                    onClick={() =>
                                        setDetailExpanded(!detailExpanded)
                                    }
                                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-outline-variant/20 bg-surface-container-lowest/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_12px_rgba(89,238,80,0.12)] active:scale-95"
                                >
                                    <span>
                                        {detailExpanded
                                            ? "Show Less"
                                            : "View More"}
                                    </span>

                                    <span className="material-symbols-outlined text-[14px] leading-none transition-transform duration-200">
                                        {detailExpanded
                                            ? "expand_less"
                                            : "expand_more"}
                                    </span>
                                </button>
                            </div>

                            <div className="flex items-start gap-5">
                                <div className="w-12 h-12 rounded-xl bg-surface-container-highest border border-white/5 flex items-center justify-center text-primary shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                    <span className="material-symbols-outlined text-3xl">
                                        {activeAgent.runtimeModeLabel ===
                                        "Docker"
                                            ? "dns"
                                            : activeAgent.runtimeModeLabel ===
                                                "Desktop"
                                              ? "desktop_windows"
                                              : "memory"}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-display font-black text-xl text-on-surface tracking-tight leading-none mb-1.5">
                                        {activeAgent.name}
                                    </h3>
                                    <div className="text-xs text-on-surface-variant font-mono">
                                        {activeAgent.id}
                                    </div>
                                </div>
                            </div>

                            {/* Immediate Actions Bar (Always Visible) */}
                            <div className="grid grid-cols-4 gap-2 mt-6">
                                <button
                                    onClick={() => setModal("logs")}
                                    title="View Logs"
                                    className="py-2.5 bg-surface-container-highest hover:bg-primary/20 hover:text-primary rounded-lg text-on-surface-variant flex items-center justify-center transition-all duration-200 border border-transparent hover:border-primary/20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        terminal
                                    </span>
                                </button>
                                <button
                                    onClick={() => setModal("screenshot")}
                                    title="View Screenshot"
                                    className="py-2.5 bg-surface-container-highest hover:bg-primary/20 hover:text-primary rounded-lg text-on-surface-variant flex items-center justify-center transition-all duration-200 border border-transparent hover:border-primary/20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        image
                                    </span>
                                </button>
                                <button
                                    onClick={() => setModal("restart")}
                                    title="Restart Agent"
                                    className="py-2.5 bg-surface-container-highest hover:bg-error/20 hover:text-error rounded-lg text-error/70 flex items-center justify-center transition-all duration-200 border border-transparent hover:border-error/30"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        refresh
                                    </span>
                                </button>
                                <button
                                    onClick={() => setModal("cancel")}
                                    title="Cancel Run"
                                    className="py-2.5 bg-surface-container-highest hover:bg-error/20 hover:text-error rounded-lg text-error/70 flex items-center justify-center transition-all duration-200 border border-transparent hover:border-error/30"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        block
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Details Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 min-h-0">
                            {!detailExpanded ? (
                                /* Compact Default View */
                                <div className="space-y-5">
                                    <div className="grid grid-cols-[110px_1fr] gap-y-3 text-sm">
                                        <span className="text-on-surface-variant font-medium">
                                            Hostname
                                        </span>
                                        <span className="text-on-surface truncate">
                                            {activeAgent.hostname}
                                        </span>
                                        <span className="text-on-surface-variant font-medium">
                                            Runtime Mode
                                        </span>
                                        <span className="text-on-surface">
                                            {activeAgent.runtimeModeLabel}
                                        </span>
                                        <span className="text-on-surface-variant font-medium">
                                            Status
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${getStatusDot(activeAgent.status, activeAgent.readiness.status)}`}
                                            />
                                            <span
                                                className={`font-bold ${getStatusDot(activeAgent.status, activeAgent.readiness.status).replace("animate-pulse", "")}`}
                                            >
                                                {formatAgentStatusLabel(
                                                    activeAgent.status,
                                                )}
                                            </span>
                                        </div>
                                        <span className="text-on-surface-variant font-medium">
                                            Readiness
                                        </span>
                                        <span
                                            className={`font-bold ${activeAgent.readiness.status === "ready" ? "text-primary" : "text-error"}`}
                                        >
                                            {formatReadinessLabel(
                                                activeAgent.readiness.status,
                                            )}
                                        </span>
                                        <span className="text-on-surface-variant font-medium">
                                            Heartbeat
                                        </span>
                                        <span className="text-on-surface font-mono text-xs">
                                            {
                                                activeAgent.connection
                                                    .lastHeartbeatAt
                                            }
                                        </span>
                                        <span className="text-on-surface-variant font-medium">
                                            Profile
                                        </span>
                                        <span className="text-on-surface truncate">
                                            {
                                                activeAgent.assignment
                                                    ?.profileName
                                            }
                                        </span>
                                    </div>

                                    <div className="p-4 bg-surface-container-highest border border-outline-variant/10 rounded-xl shadow-inner">
                                        <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-mono mb-2">
                                            Current Run:{" "}
                                            {getAgentCurrentRunName(
                                                activeAgent,
                                            )}
                                        </h4>
                                        {activeAgent.currentRun ? (
                                            <div className="text-xs text-primary font-mono leading-relaxed truncate">
                                                &gt;{" "}
                                                {activeAgent.currentRun
                                                    ?.lastEvent ??
                                                    "No active runtime event"}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-on-surface-variant italic">
                                                Awaiting dispatch...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Expanded Collapsible View */
                                <div className="space-y-2">
                                    {[
                                        {
                                            id: "identity",
                                            label: "1. Identity",
                                            fields: [
                                                {
                                                    label: "Agent ID",
                                                    value: activeAgent.id,
                                                },
                                                {
                                                    label: "Agent Name",
                                                    value: activeAgent.name,
                                                },
                                                {
                                                    label: "Hostname",
                                                    value: activeAgent.hostname,
                                                },
                                                {
                                                    label: "Architecture",
                                                    value: `${activeAgent.platform.toUpperCase()} · ${activeAgent.runtimeModeLabel}`,
                                                },
                                                {
                                                    label: "Version",
                                                    value: activeAgent.agentVersion,
                                                },
                                                {
                                                    label: "Status",
                                                    value: renderAgentStatusPill(
                                                        activeAgent,
                                                    ),
                                                },
                                                {
                                                    label: "Assigned",
                                                    value: renderAssignedBadge(
                                                        activeAgent,
                                                    ),
                                                },
                                            ],
                                        },
                                        {
                                            id: "connection",
                                            label: "2. Connection",
                                            fields: [
                                                {
                                                    label: "WS Status",
                                                    value: (
                                                        <span
                                                            className={`text-xs font-bold font-mono ${
                                                                activeAgent
                                                                    .connection
                                                                    .websocketStatus ===
                                                                "connected"
                                                                    ? "text-tertiary"
                                                                    : activeAgent
                                                                            .connection
                                                                            .websocketStatus ===
                                                                        "reconnecting"
                                                                      ? "text-secondary"
                                                                      : "text-error"
                                                            }`}
                                                        >
                                                            {
                                                                activeAgent
                                                                    .connection
                                                                    .websocketStatus
                                                            }
                                                        </span>
                                                    ),
                                                },
                                                {
                                                    label: "Session ID",
                                                    value:
                                                        activeAgent.connection
                                                            .sessionId ?? "-",
                                                },
                                                {
                                                    label: "Connected At",
                                                    value:
                                                        activeAgent.connection
                                                            .connectedAt ?? "-",
                                                },
                                                {
                                                    label: "Last Heartbeat",
                                                    value: (
                                                        <span
                                                            className={
                                                                getDetailHeartbeatView(
                                                                    activeAgent,
                                                                ).className
                                                            }
                                                        >
                                                            {
                                                                getDetailHeartbeatView(
                                                                    activeAgent,
                                                                ).label
                                                            }
                                                        </span>
                                                    ),
                                                },
                                                {
                                                    label: "Latency",
                                                    value:
                                                        activeAgent.connection
                                                            .latencyMs == null
                                                            ? "-"
                                                            : `${activeAgent.connection.latencyMs}ms`,
                                                },
                                                {
                                                    label: "Backend URL",
                                                    value:
                                                        activeAgent.connection
                                                            .backendUrl ?? "-",
                                                },
                                            ],
                                        },
                                    ].map((group) => (
                                        <div
                                            key={group.id}
                                            className="border border-outline-variant/10 rounded-lg overflow-hidden bg-surface-container-lowest/30"
                                        >
                                            <button
                                                onClick={() =>
                                                    toggleSection(
                                                        group.id as any,
                                                    )
                                                }
                                                className="w-full px-4 py-3 flex items-center justify-between bg-surface-container/50 hover:bg-surface-container-high/50 transition-colors"
                                            >
                                                <span className="text-xs font-bold text-on-surface uppercase tracking-widest font-mono">
                                                    {group.label}
                                                </span>

                                                <span
                                                    className="material-symbols-outlined text-on-surface-variant text-sm transition-transform duration-200"
                                                    style={{
                                                        transform: sectionsOpen[
                                                            group.id as keyof typeof sectionsOpen
                                                        ]
                                                            ? "rotate(180deg)"
                                                            : "",
                                                    }}
                                                >
                                                    expand_more
                                                </span>
                                            </button>

                                            {sectionsOpen[
                                                group.id as keyof typeof sectionsOpen
                                            ] && (
                                                <div className="p-4 grid grid-cols-2 gap-3 text-xs border-t border-outline-variant/10">
                                                    {group.fields.map(
                                                        (field, index) => {
                                                            const isLastFullWidth =
                                                                group.fields
                                                                    .length %
                                                                    2 ===
                                                                    1 &&
                                                                index ===
                                                                    group.fields
                                                                        .length -
                                                                        1;

                                                            return (
                                                                <div
                                                                    key={
                                                                        field.label
                                                                    }
                                                                    className={`bg-surface-container-lowest/50 p-3 rounded-xl border border-outline-variant/10 min-w-0 ${
                                                                        isLastFullWidth
                                                                            ? "col-span-2"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <p className="text-[9px] text-on-surface-variant font-bold uppercase mb-1">
                                                                        {
                                                                            field.label
                                                                        }
                                                                    </p>

                                                                    {renderDetailFieldValue(
                                                                        field.value,
                                                                    )}
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Readiness Section Custom */}
                                    <div className="border border-outline-variant/10 rounded-lg overflow-hidden bg-surface-container-lowest/50">
                                        <button
                                            onClick={() =>
                                                toggleSection("readiness")
                                            }
                                            className="w-full px-4 py-3 flex items-center justify-between bg-surface-container/50 hover:bg-surface-container-high/50 transition-colors"
                                        >
                                            <span className="text-xs font-bold text-on-surface uppercase tracking-widest font-mono">
                                                3. Env Readiness
                                            </span>
                                            <span
                                                className="material-symbols-outlined text-on-surface-variant text-sm transition-transform duration-200"
                                                style={{
                                                    transform:
                                                        sectionsOpen.readiness
                                                            ? "rotate(180deg)"
                                                            : "",
                                                }}
                                            >
                                                expand_more
                                            </span>
                                        </button>
                                        {sectionsOpen.readiness && (
                                            <div className="p-4 space-y-3 text-xs border-t border-outline-variant/10">
                                                {activeAgent.readiness.checks.map(
                                                    (check) => {
                                                        const checkView =
                                                            getReadinessCheckView(
                                                                check.status,
                                                            );

                                                        return (
                                                            <div
                                                                key={check.key}
                                                                className={
                                                                    checkView.containerClass
                                                                }
                                                            >
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    <span
                                                                        className={`material-symbols-outlined ${checkView.iconClass} text-lg`}
                                                                    >
                                                                        {
                                                                            checkView.icon
                                                                        }
                                                                    </span>

                                                                    <div className="min-w-0">
                                                                        <span className="block text-[11px] font-bold text-on-surface truncate">
                                                                            {
                                                                                check.label
                                                                            }
                                                                        </span>

                                                                        {check.message && (
                                                                            <p className="mt-0.5 text-[9px] text-on-surface-variant font-mono truncate">
                                                                                {
                                                                                    check.message
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <span
                                                                    className={`shrink-0 text-[9px] font-mono ${checkView.metaClass}`}
                                                                >
                                                                    {check.message ??
                                                                        checkView.meta}
                                                                </span>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Capabilities Section Custom */}
                                    <div className="border border-outline-variant/10 rounded-lg overflow-hidden bg-surface-container-lowest/50">
                                        <button
                                            onClick={() =>
                                                toggleSection("capabilities")
                                            }
                                            className="w-full px-4 py-3 flex items-center justify-between bg-surface-container/50 hover:bg-surface-container-high/50 transition-colors"
                                        >
                                            <span className="text-xs font-bold text-on-surface uppercase tracking-widest font-mono">
                                                4. Capabilities
                                            </span>
                                            <span
                                                className="material-symbols-outlined text-on-surface-variant text-sm transition-transform duration-200"
                                                style={{
                                                    transform:
                                                        sectionsOpen.capabilities
                                                            ? "rotate(180deg)"
                                                            : "",
                                                }}
                                            >
                                                expand_more
                                            </span>
                                        </button>
                                        {sectionsOpen.capabilities && (
                                            <div className="p-4 flex flex-wrap gap-2 border-t border-outline-variant/10">
                                                {activeAgent.capabilities.map(
                                                    (capability) => (
                                                        <span
                                                            key={capability}
                                                            className="px-2 py-1 text-[10px] rounded border bg-primary/10 border-primary/20 text-primary"
                                                        >
                                                            {capability}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Current Run Custom */}
                                    <div className="border border-outline-variant/10 rounded-lg overflow-hidden bg-surface-container-lowest/50">
                                        <button
                                            onClick={() => toggleSection("run")}
                                            className="w-full px-4 py-3 flex items-center justify-between bg-surface-container/50 hover:bg-surface-container-high/50 transition-colors"
                                        >
                                            <span className="text-xs font-bold text-on-surface uppercase tracking-widest font-mono">
                                                5. Current Run
                                            </span>
                                            <span
                                                className="material-symbols-outlined text-on-surface-variant text-sm transition-transform duration-200"
                                                style={{
                                                    transform: sectionsOpen.run
                                                        ? "rotate(180deg)"
                                                        : "",
                                                }}
                                            >
                                                expand_more
                                            </span>
                                        </button>
                                        {sectionsOpen.run && (
                                            <div className="p-4 space-y-3 text-xs border-t border-outline-variant/10">
                                                <div className="flex justify-between">
                                                    <span className="text-on-surface-variant">
                                                        Run ID
                                                    </span>
                                                    <span className="text-on-surface font-mono">
                                                        {activeAgent.currentRun
                                                            ?.runId ?? "-"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-on-surface-variant">
                                                        Scenario
                                                    </span>
                                                    <span className="text-primary font-bold">
                                                        {activeAgent.currentRun
                                                            ?.scenarioName ??
                                                            "-"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-on-surface-variant">
                                                        Preset
                                                    </span>
                                                    <span className="text-on-surface">
                                                        {activeAgent.currentRun
                                                            ?.presetName ?? "-"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-on-surface-variant">
                                                        State
                                                    </span>
                                                    <span className="text-secondary font-bold">
                                                        {activeAgent.currentRun
                                                            ?.status ?? "idle"}
                                                    </span>
                                                </div>
                                                <div className="p-3 bg-surface-container-highest rounded border border-outline-variant/10 shadow-inner font-mono text-primary text-[10px]">
                                                    &gt;{" "}
                                                    {activeAgent.currentRun
                                                        ?.lastEvent ??
                                                        "No active runtime event"}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>

            {/* Bulk Action Bottom Bar (Multi-Select) */}
            <AgentBottomActionBar
                selectedCount={selectedIds.size}
                readyCount={selectedReadyCount}
                busyCount={selectedBusyCount}
                errorCount={selectedErrorCount}
                onAssign={() => setModal("assign")}
                onStart={() => setModal("start")}
                onPauseScheduling={() =>
                    notify("info", "Scheduling paused for selected agents.")
                }
                onEmergencyStop={() => setModal("emergency")}
            />

            {/* --- Modals --- */}
            {modal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md transition-opacity duration-300">
                    <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden max-w-2xl w-full flex flex-col max-h-[90vh] animate-modal-enter">
                        {/* Header */}
                        <div className="p-5 border-b border-outline-variant/10 bg-surface-container/50 flex justify-between items-center">
                            <h3 className="font-display font-black text-xl text-on-surface tracking-tight">
                                {modal === "pair" && "Pair New Agent"}
                                {modal === "assign" &&
                                    "Assign Profile / Preset"}
                                {modal === "start" && "Start Scenario on Fleet"}
                                {modal === "restart" && "Confirm Agent Restart"}
                                {modal === "cancel" &&
                                    "Confirm Scenario Cancellation"}
                                {modal === "emergency" && (
                                    <span className="text-error">
                                        EMERGENCY STOP
                                    </span>
                                )}
                                {modal === "logs" &&
                                    `Terminal Logs: ${activeAgent?.name}`}
                                {modal === "screenshot" &&
                                    `Latest Screenshot: ${activeAgent?.name}`}
                            </h3>
                            <button
                                onClick={() => !isProcessing && setModal(null)}
                                disabled={isProcessing}
                                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    close
                                </span>
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            {/* Pair Modal Flow */}
                            {modal === "pair" && (
                                <div className="space-y-8">
                                    {/* Step Indicator */}
                                    <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-6">
                                        <div
                                            className={`flex items-center gap-2 ${pairStep >= 1 ? "text-primary" : "text-on-surface-variant"}`}
                                        >
                                            <span
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pairStep >= 1 ? "bg-primary/20 border border-primary/40" : "bg-surface-variant border border-outline-variant/20"}`}
                                            >
                                                1
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-widest font-mono">
                                                Config
                                            </span>
                                        </div>
                                        <div
                                            className={`h-px w-8 ${pairStep >= 2 ? "bg-primary/40" : "bg-outline-variant/20"}`}
                                        />
                                        <div
                                            className={`flex items-center gap-2 ${pairStep >= 2 ? "text-primary" : "text-on-surface-variant"}`}
                                        >
                                            <span
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pairStep >= 2 ? "bg-primary/20 border border-primary/40" : "bg-surface-variant border border-outline-variant/20"}`}
                                            >
                                                2
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-widest font-mono">
                                                Connect
                                            </span>
                                        </div>
                                        <div
                                            className={`h-px w-8 ${pairStep === 3 ? "bg-primary/40" : "bg-outline-variant/20"}`}
                                        />
                                        <div
                                            className={`flex items-center gap-2 ${pairStep === 3 ? "text-primary" : "text-on-surface-variant"}`}
                                        >
                                            <span
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pairStep === 3 ? "bg-primary/20 border border-primary/40" : "bg-surface-variant border border-outline-variant/20"}`}
                                            >
                                                3
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-widest font-mono">
                                                Ready
                                            </span>
                                        </div>
                                    </div>

                                    {pairStep === 1 && (
                                        <div className="space-y-6 animate-modal-enter">
                                            <div>
                                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block font-mono">
                                                    Choose Agent Type
                                                </label>
                                                <select className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3.5 text-sm font-medium text-on-surface outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50">
                                                    <option>
                                                        Local Dev Agent
                                                    </option>
                                                    <option>
                                                        Docker Agent
                                                    </option>
                                                    <option>
                                                        Desktop Agent
                                                    </option>
                                                    <option>
                                                        Android Agent
                                                    </option>
                                                    <option>
                                                        Remote VPS Agent
                                                    </option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-inner">
                                                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-mono">
                                                        Pairing Code
                                                    </div>
                                                    <div className="font-mono text-3xl text-primary font-black tracking-widest">
                                                        QD-482913
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-inner">
                                                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-mono">
                                                        Backend WS URL
                                                    </div>
                                                    <div className="font-mono text-sm text-on-surface mt-2 break-all">
                                                        wss://api.gameflow.local/ws
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setPairStep(2)}
                                                className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl text-sm font-bold shadow-[0_4px_20px_rgba(89,238,80,0.2)] hover:opacity-90 transition-opacity"
                                            >
                                                Generate Token & Instructions
                                            </button>
                                        </div>
                                    )}

                                    {pairStep >= 2 && (
                                        <div className="space-y-6 animate-modal-enter">
                                            <div>
                                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block font-mono">
                                                    Connection Instructions
                                                    (.env Example)
                                                </label>
                                                <pre className="bg-surface-container-lowest p-5 rounded-xl text-xs font-mono text-on-surface-variant border border-outline-variant/10 overflow-x-auto selection:bg-primary/30 shadow-inner leading-relaxed">
                                                    <span className="text-primary">
                                                        AGENT_ID
                                                    </span>
                                                    =local-dev-agent-01{"\n"}
                                                    <span className="text-primary">
                                                        AGENT_TOKEN
                                                    </span>
                                                    =
                                                    <span className="text-secondary">
                                                        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                                                    </span>
                                                    {"\n"}
                                                    <span className="text-primary">
                                                        AGENT_WS_URL
                                                    </span>
                                                    =wss://api.gameflow.local/ws
                                                </pre>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block font-mono">
                                                    Docker Command Example
                                                </label>
                                                <pre className="bg-surface-container-lowest p-5 rounded-xl text-xs font-mono text-on-surface-variant border border-outline-variant/10 overflow-x-auto whitespace-pre-wrap selection:bg-primary/30 shadow-inner leading-relaxed">
                                                    docker run -e
                                                    AGENT_ID=local-dev-agent-01
                                                    -e AGENT_TOKEN=eyJhbG... -e
                                                    AGENT_WS_URL=wss://api.gameflow.local/ws
                                                    td3q-agent:latest
                                                </pre>
                                            </div>

                                            {pairStep === 2 ? (
                                                <div className="p-5 bg-surface-container-low border border-primary/20 rounded-xl flex items-center gap-4 shadow-[0_0_20px_rgba(89,238,80,0.05)]">
                                                    <span className="material-symbols-outlined text-primary text-2xl animate-spin">
                                                        sync
                                                    </span>
                                                    <div>
                                                        <div className="text-sm font-bold text-primary">
                                                            Waiting for Agent
                                                            Connection...
                                                        </div>
                                                        <div className="text-xs text-on-surface-variant mt-1">
                                                            Start the agent
                                                            locally. It will
                                                            self-connect to the
                                                            orchestrator.
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-5 bg-surface-container-low border border-primary/40 rounded-xl flex items-center gap-4 shadow-[0_0_20px_rgba(89,238,80,0.15)] animate-modal-enter">
                                                    <span className="material-symbols-outlined text-primary text-3xl">
                                                        check_circle
                                                    </span>
                                                    <div>
                                                        <div className="text-sm font-bold text-primary">
                                                            Agent Connected
                                                            Successfully
                                                        </div>
                                                        <div className="text-xs text-on-surface-variant mt-1 font-mono">
                                                            Readiness check
                                                            passed. Chromium,
                                                            OpenCV, Ruffle OK.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Assign / Start Modals */}
                            {(modal === "assign" || modal === "start") && (
                                <div className="space-y-6">
                                    {modal === "start" && (
                                        <div className="p-5 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-inner mb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="material-symbols-outlined text-primary">
                                                    flight_takeoff
                                                </span>
                                                <h4 className="text-sm font-bold text-on-surface">
                                                    Readiness Preflight Check
                                                </h4>
                                            </div>
                                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                                Dispatching to{" "}
                                                <span className="font-bold text-on-surface">
                                                    {selectedIds.size} selected
                                                    agents
                                                </span>
                                                . Offline, busy, or unready
                                                agents will be automatically
                                                skipped. Commands are routed
                                                through the WebSocket
                                                orchestrator.
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block font-mono">
                                            Automation Scenario
                                        </label>
                                        <select className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3.5 text-sm font-medium text-on-surface outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50">
                                            <option>
                                                TD3Q Attendance Module
                                            </option>
                                            <option>TD3Q Daily Quests</option>
                                            <option>TD3Q Mail Collector</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block font-mono">
                                            Configuration Preset
                                        </label>
                                        <select className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3.5 text-sm font-medium text-on-surface outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50">
                                            <option>
                                                Production - Headless (Fast)
                                            </option>
                                            <option>
                                                Debug - Visible Overlay
                                            </option>
                                            <option>
                                                Validation - Strict Match
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Warning Modals */}
                            {(modal === "restart" ||
                                modal === "cancel" ||
                                modal === "emergency") && (
                                <div className="text-center py-8">
                                    <div className="relative inline-block mb-6">
                                        <span className="material-symbols-outlined text-[72px] text-error relative z-10">
                                            warning
                                        </span>
                                        <div className="absolute inset-0 bg-error blur-2xl opacity-20 animate-pulse rounded-full" />
                                    </div>
                                    <h4 className="font-display font-black text-2xl text-on-surface tracking-tight mb-3">
                                        Are you absolutely sure?
                                    </h4>
                                    <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                                        {modal === "emergency"
                                            ? "This will sever WebSocket connections and forcefully terminate all running processes on the selected nodes. State corruption may occur."
                                            : "This action will interrupt the current running scenario on the target agent process."}
                                    </p>
                                </div>
                            )}

                            {/* View Logs */}
                            {modal === "logs" && (
                                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-5 font-mono text-[11px] leading-relaxed text-on-surface-variant h-80 overflow-y-auto shadow-inner">
                                    <div className="text-primary opacity-80">
                                        [14:02:01] INFO Agent initialized. ID:
                                        agt-001
                                    </div>
                                    <div className="text-on-surface opacity-60">
                                        [14:02:02] DEBUG WS connection
                                        established to
                                        wss://api.gameflow.local/ws
                                    </div>
                                    <div className="text-secondary">
                                        [14:02:05] EVENT Job received: run-3312
                                    </div>
                                    <div className="text-on-surface opacity-60">
                                        [14:02:06] DEBUG Launching Chromium
                                        runtime...
                                    </div>
                                    <div className="text-primary opacity-80">
                                        [14:02:08] INFO Detector matched:
                                        popup_header.png (Confidence: 0.96)
                                    </div>
                                    <div className="text-on-surface opacity-60">
                                        [14:02:09] DEBUG Executing precise click
                                        at coords (450, 300)
                                    </div>
                                    <div className="text-on-surface mt-2 animate-pulse font-black text-sm">
                                        _
                                    </div>
                                </div>
                            )}

                            {/* View Screenshot */}
                            {modal === "screenshot" && (
                                <div className="aspect-video bg-surface-container-lowest border border-outline-variant/10 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-50 mb-3 z-10">
                                        screen_search_desktop
                                    </span>
                                    <p className="text-xs text-on-surface-variant font-mono z-10">
                                        Live Visual Telemetry Placeholder
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-5 border-t border-outline-variant/10 bg-surface-container/30 flex justify-end gap-4 shrink-0">
                            <button
                                onClick={() => setModal(null)}
                                disabled={isProcessing}
                                className="px-6 py-2.5 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-xl transition-all disabled:opacity-50"
                            >
                                {modal === "pair" ||
                                modal === "logs" ||
                                modal === "screenshot"
                                    ? pairStep === 3
                                        ? "Done"
                                        : "Close"
                                    : "Cancel"}
                            </button>

                            {(modal === "assign" || modal === "start") && (
                                <button
                                    onClick={() =>
                                        handleAsyncAction(
                                            "Action dispatched successfully.",
                                            "success",
                                        )
                                    }
                                    disabled={isProcessing}
                                    className="px-8 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(89,238,80,0.2)] hover:opacity-90 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isProcessing && (
                                        <span className="material-symbols-outlined text-[16px] animate-spin">
                                            sync
                                        </span>
                                    )}
                                    Confirm & Dispatch
                                </button>
                            )}

                            {(modal === "restart" ||
                                modal === "cancel" ||
                                modal === "emergency") && (
                                <button
                                    onClick={() =>
                                        handleAsyncAction(
                                            "Command sent to target agents.",
                                            "warning",
                                        )
                                    }
                                    disabled={isProcessing}
                                    className="px-8 py-2.5 bg-error text-on-error rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(255,115,81,0.2)] hover:bg-error/90 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isProcessing && (
                                        <span className="material-symbols-outlined text-[16px] animate-spin">
                                            sync
                                        </span>
                                    )}
                                    Yes, Execute Override
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
