import { AgentBulkActionsDropdown } from "./AgentBulkActionsDropdown";
import { AgentFilterDropdown } from "./AgentFilterDropdown";

type AgentManagerHeaderProps = {
    filterOpen: boolean;
    bulkOpen: boolean;
    onToggleFilter: () => void;
    onToggleBulk: () => void;
    onBulkAction: (action: string) => void;
    onPairAgent: () => void;
};

export function AgentManagerHeader({
    filterOpen,
    bulkOpen,
    onToggleFilter,
    onToggleBulk,
    onBulkAction,
    onPairAgent,
}: AgentManagerHeaderProps) {
    return (
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold font-mono mb-1">
                    Fleet Orchestration
                </p>

                <h2 className="page-title text-on-surface text-4xl font-display font-black tracking-tight">
                    Agent Manager
                </h2>

                <p className="text-on-surface-variant mt-2 max-w-xl text-sm leading-relaxed">
                    Manage Agent Runtime Services. Agents self-connect to the
                    backend via WebSocket. The Web UI orchestrates tasks but
                    does not execute automation directly.
                </p>
            </div>

            <div className="flex items-center gap-4 shrink-0 relative z-40">
                <button
                    onClick={onToggleFilter}
                    className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-lg border border-outline-variant/30 hover:bg-surface-container-highest transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center gap-2 text-sm font-semibold"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        filter_list
                    </span>
                    Filter
                </button>

                {filterOpen && <AgentFilterDropdown />}

                <div className="relative">
                    <button
                        onClick={onToggleBulk}
                        className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-lg border border-outline-variant/30 hover:bg-surface-container-highest transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center gap-2 text-sm font-semibold"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            inventory_2
                        </span>
                        Bulk Actions
                    </button>

                    {bulkOpen && (
                        <AgentBulkActionsDropdown onAction={onBulkAction} />
                    )}
                </div>

                <button
                    onClick={onPairAgent}
                    className="px-6 py-2.5 bg-linear-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_rgba(89,238,80,0.4)] text-sm tracking-wide"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        add
                    </span>
                    Pair Agent
                </button>
            </div>
        </section>
    );
}
