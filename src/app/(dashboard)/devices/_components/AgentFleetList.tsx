import type {
    AgentFleetItemView,
    RuntimeAgentStatus,
    AgentReadinessStatus,
} from "../_types/agent-types";

type AgentFleetListProps = {
    agents: AgentFleetItemView[];
    selectedIds: Set<string>;
    activeAgentId: string | null;
    onSelectAgent: (agentId: string) => void;
    onToggleSelect: (agentId: string) => void;
    onToggleSelectAll: () => void;
    getStatusClass: (
        status: RuntimeAgentStatus,
        readiness: AgentReadinessStatus,
    ) => string;
};

function formatAgentStatusLabel(status: RuntimeAgentStatus) {
    const labels: Record<RuntimeAgentStatus, string> = {
        online: "Online",
        offline: "Offline",
        idle: "Idle",
        busy: "Busy",
        error: "Error",
        not_ready: "Not Ready",
    };

    return labels[status];
}

function formatReadinessLabel(readiness: AgentReadinessStatus) {
    const labels: Record<AgentReadinessStatus, string> = {
        ready: "Ready",
        not_ready: "Not Ready",
        warning: "Warning",
        unknown: "Unknown",
    };

    return labels[readiness];
}

function getCurrentRunName(agent: AgentFleetItemView) {
    return agent.currentRun?.scenarioName ?? "None";
}

function getCurrentRunState(agent: AgentFleetItemView) {
    return agent.currentRun?.status ?? "idle";
}

function getAssignedProfileName(agent: AgentFleetItemView) {
    return agent.assignment?.profileName ?? "Unassigned";
}

function isConnectionError(agent: AgentFleetItemView) {
    return (
        agent.status === "error" ||
        agent.status === "not_ready" ||
        agent.status === "offline" ||
        agent.readiness.status === "not_ready" ||
        agent.connection.websocketStatus === "disconnected" ||
        agent.currentRun?.status === "failed" ||
        agent.currentRun?.status === "agent_lost"
    );
}

function isRunning(agent: AgentFleetItemView) {
    return agent.currentRun?.status === "running" || agent.status === "busy";
}

function getShortRunId(agent: AgentFleetItemView) {
    const runId = agent.currentRun?.runId;

    if (!runId) return "-";

    const numericPart = runId.match(/\d+$/)?.[0];

    return numericPart ? `#${numericPart}` : runId;
}

function formatHeartbeatDuration(iso?: string) {
    if (!iso) return "-";

    const timestamp = new Date(iso).getTime();
    if (Number.isNaN(timestamp)) return "-";

    const diffMs = Math.max(0, Date.now() - timestamp);
    const totalSeconds = Math.floor(diffMs / 1000);

    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes < 60) {
        return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
}

function getLastHeartbeatView(agent: AgentFleetItemView) {
    if (isConnectionError(agent)) {
        return {
            label: formatHeartbeatDuration(agent.connection.lastHeartbeatAt),
            className:
                "py-4 px-4 text-[10px] font-mono text-error font-bold text-center",
        };
    }

    if (isRunning(agent)) {
        return {
            label: `${formatHeartbeatDuration(agent.connection.lastHeartbeatAt)} ago`,
            className:
                "py-4 px-4 text-[10px] font-mono text-on-surface-variant text-center",
        };
    }

    return {
        label: "live",
        className:
            "py-4 px-4 text-[10px] font-mono text-tertiary font-bold text-center",
    };
}

function AgentStatusPill({ agent }: { agent: AgentFleetItemView }) {
    if (isConnectionError(agent)) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-error/10 text-error text-[9px] font-black uppercase tracking-tighter border border-error/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-error glow-dot-error" />
                Conn Error
            </div>
        );
    }

    if (isRunning(agent)) {
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
}

export function AgentFleetList({
    agents,
    selectedIds,
    activeAgentId,
    onSelectAgent,
    onToggleSelect,
    onToggleSelectAll,
    getStatusClass,
}: AgentFleetListProps) {
    return (
        <>
            <style>{`
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
            <div className="min-w-0 bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 shadow-lg">
                <div className="overflow-hidden">
                    <table className="w-full table-fixed text-left border-collapse">
                        <thead>
                            <tr className="border-b border-outline-variant/20 bg-surface-container/50">
                                <th className="py-5 px-6 w-12">
                                    <input
                                        className="rounded bg-surface-container-lowest border-outline-variant/50 cursor-pointer transition-colors hover:border-primary focus:ring-primary/20 accent-primary"
                                        type="checkbox"
                                        checked={
                                            selectedIds.size ===
                                                agents.length &&
                                            agents.length > 0
                                        }
                                        onChange={onToggleSelectAll}
                                    />
                                </th>

                                {[
                                    "Agent",
                                    "Status",
                                    "Assigned",
                                    "Last Heartbeat",
                                    "Action",
                                ].map((header) => (
                                    <th
                                        key={header}
                                        className="py-5 px-4 text-[10px] uppercase tracking-widest font-black text-on-surface-variant font-mono text-center"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-outline-variant/10 text-sm">
                            {agents.map((agent) => (
                                <tr
                                    key={agent.id}
                                    onClick={() => onSelectAgent(agent.id)}
                                    className={`group transition-all duration-200 cursor-pointer ${
                                        activeAgentId === agent.id
                                            ? "bg-surface-container-high/40 border-l-[3px] border-l-primary"
                                            : "hover:bg-surface-container-high/20 border-l-[3px] border-l-transparent"
                                    }`}
                                >
                                    <td
                                        className="py-4 px-6"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        <input
                                            className="rounded bg-surface-container-lowest border-outline-variant/50 cursor-pointer transition-colors hover:border-primary focus:ring-primary/20 accent-primary"
                                            type="checkbox"
                                            checked={selectedIds.has(agent.id)}
                                            onChange={() =>
                                                onToggleSelect(agent.id)
                                            }
                                        />
                                    </td>

                                    <td className="py-4 px-4 min-w-0">
                                        <div className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                                            {agent.name}
                                        </div>
                                        <div className="text-[10px] font-mono text-on-surface-variant mt-0.5 truncate">
                                            {agent.id}
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <AgentStatusPill agent={agent} />
                                    </td>

                                    <td className="py-4 px-4 min-w-0">
                                        <span className="max-w-35 truncate inline-block px-2 py-1 bg-surface-container-highest border border-outline-variant/20 rounded-md text-[11px] font-medium text-on-surface-variant">
                                            {getAssignedProfileName(agent)}
                                        </span>
                                    </td>

                                    <td
                                        className={
                                            getLastHeartbeatView(agent)
                                                .className
                                        }
                                    >
                                        {getLastHeartbeatView(agent).label}
                                    </td>

                                    <td className="py-4 px-4 text-right flex justify-center">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onSelectAgent(agent.id);
                                            }}
                                            className="p-1.5 hover:bg-surface-container-highest rounded-lg text-primary transition-colors"
                                            aria-label={`View ${agent.name}`}
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                chevron_right
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
