type AgentStatsCardsProps = {
    totalAgents: number;
    onlineAgents: number;
    idleReadyAgents: number;
    errorAgents: number;
};

export function AgentStatsCards({
    totalAgents,
    onlineAgents,
    idleReadyAgents,
    errorAgents,
}: AgentStatsCardsProps) {
    const cards = [
        {
            icon: "dns",
            label: "Total Agents",
            value: totalAgents,
            subtitle: "Across all environments",
            color: "text-primary",
            border: "",
        },
        {
            icon: "cable",
            label: "Online / Connected",
            value: onlineAgents,
            subtitle: "WebSocket active",
            color: "text-primary",
            border: "",
        },
        {
            icon: "hourglass_empty",
            label: "Idle / Ready",
            value: idleReadyAgents,
            subtitle: "Awaiting scenarios",
            color: "text-on-surface-variant",
            border: "",
        },
        {
            icon: "warning",
            label: "Error / Not Ready",
            value: errorAgents,
            subtitle: "Intervention required",
            color: "text-error",
            border: "border-l-[3px] border-l-error",
        },
    ];

    return (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={`bg-surface-container-low rounded-xl p-6 relative overflow-hidden group hover:bg-surface-container-high transition-colors duration-300 ${card.border}`}
                >
                    <div className="absolute -right-4 -top-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110 group-hover:rotate-6">
                        <span className="material-symbols-outlined text-8xl">
                            {card.icon}
                        </span>
                    </div>

                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 font-mono">
                        {card.label}
                    </p>

                    <div
                        className={`text-5xl font-display font-black tracking-tighter ${card.color}`}
                    >
                        {card.value}
                    </div>

                    <div className="mt-5 flex items-center gap-2 text-[10px] font-mono text-on-surface-variant uppercase">
                        {card.label.includes("Error") ? (
                            <span className="material-symbols-outlined text-[14px] text-error animate-pulse">
                                error
                            </span>
                        ) : (
                            <span
                                className={`w-1.5 h-1.5 rounded-full bg-current ${card.color}`}
                            />
                        )}
                        {card.subtitle}
                    </div>
                </div>
            ))}
        </section>
    );
}
