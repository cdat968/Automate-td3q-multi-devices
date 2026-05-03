type AgentBulkActionsDropdownProps = {
    onAction: (action: string) => void;
};

export function AgentBulkActionsDropdown({
    onAction,
}: AgentBulkActionsDropdownProps) {
    const normalActions = [
        "Run Doctor",
        "Assign Profile / Preset",
        "Start Scenario",
        "Pause Scheduling",
        "Resume Scheduling",
        "Request Logs",
    ];

    const dangerousActions = [
        "Cancel Current Runs",
        "Restart Agent Service",
        "Disable / Forget Agent",
    ];

    return (
        <div className="absolute top-full right-0 mt-3 w-64 bg-surface-container-highest border border-outline-variant/20 rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.6)] overflow-hidden z-50 py-2 animate-dropdown-enter">
            {normalActions.map((action) => (
                <button
                    key={action}
                    onClick={() => onAction(action)}
                    className="w-full text-left px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-white/5 transition-colors"
                >
                    {action}
                </button>
            ))}

            <div className="h-px bg-outline-variant/20 my-2 mx-4" />

            {dangerousActions.map((action) => (
                <button
                    key={action}
                    onClick={() => onAction(action)}
                    className="w-full text-left px-5 py-2.5 text-sm font-medium text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[16px]">
                        warning
                    </span>
                    {action}
                </button>
            ))}
        </div>
    );
}
