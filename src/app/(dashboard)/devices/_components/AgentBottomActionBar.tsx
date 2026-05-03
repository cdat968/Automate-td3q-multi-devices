type AgentBottomActionBarProps = {
    selectedCount: number;
    readyCount: number;
    busyCount: number;
    errorCount: number;
    onAssign: () => void;
    onStart: () => void;
    onPauseScheduling: () => void;
    onEmergencyStop: () => void;
};

export function AgentBottomActionBar({
    selectedCount,
    readyCount,
    busyCount,
    errorCount,
    onAssign,
    onStart,
    onPauseScheduling,
    onEmergencyStop,
}: AgentBottomActionBarProps) {
    if (selectedCount <= 0) return null;

    return (
        <div className="fixed inset-x-4 bottom-6 z-50 flex justify-center pointer-events-none">
            <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 overflow-x-auto p-2 bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant/20 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] animate-modal-enter">
                <div className="min-w-[220px] shrink-0 px-6 py-2 flex flex-col justify-center border-r border-outline-variant/20">
                    <span className="font-display font-black text-on-surface text-lg leading-tight whitespace-nowrap">
                        <span className="text-primary">{selectedCount}</span>{" "}
                        {selectedCount === 1 ? "Agent" : "Agents"} Selected
                    </span>

                    <span className="text-[11px] font-mono font-medium text-on-surface-variant mt-0.5 whitespace-nowrap">
                        {readyCount} Ready · {busyCount} Busy · {errorCount}{" "}
                        Error
                    </span>
                </div>

                <button
                    onClick={onAssign}
                    className="flex shrink-0 min-w-max items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 hover:bg-white/5 rounded-xl text-xs font-bold text-on-surface transition-all duration-200 hover:scale-[1.03]"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        assignment_ind
                    </span>
                    Assign Profile
                </button>

                <button
                    onClick={onStart}
                    className="flex shrink-0 min-w-max items-center justify-center gap-2 whitespace-nowrap px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl text-xs font-bold transition-all duration-300 hover:scale-[1.05] shadow-[0_4px_20px_rgba(89,238,80,0.3)]"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        play_arrow
                    </span>
                    Start Scenario
                </button>

                <button
                    onClick={onPauseScheduling}
                    className="flex shrink-0 min-w-max items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 hover:bg-white/5 rounded-xl text-xs font-bold text-on-surface transition-all duration-200 hover:scale-[1.03]"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        pause
                    </span>
                    Pause Scheduling
                </button>

                <button
                    onClick={onEmergencyStop}
                    className="flex shrink-0 min-w-max items-center justify-center gap-2 whitespace-nowrap px-5 py-2.5 bg-error/10 text-error rounded-xl text-xs font-black hover:bg-error hover:text-on-error transition-all duration-300 hover:scale-[1.05] border border-error/30 shadow-[0_4px_20px_rgba(255,115,81,0.1)]"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        dangerous
                    </span>
                    Emergency Stop
                </button>
            </div>
        </div>
    );
}
