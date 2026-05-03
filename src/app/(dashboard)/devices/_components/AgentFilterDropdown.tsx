export function AgentFilterDropdown() {
    const statusFilters = [
        "Online",
        "Offline",
        "Idle",
        "Busy",
        "Error",
        "Not Ready",
    ];

    const runtimeFilters = [
        "Browser",
        "Android",
        "Windows",
        "Docker",
        "Local Native",
    ];

    const readinessFilters = [
        "Ready",
        "Missing Chromium",
        "Missing OpenCV",
        "Missing Ruffle",
        "Missing Templates",
        "Invalid Token",
    ];

    const currentRunFilters = [
        "No Active Run",
        "Running",
        "Failed",
        "Cancelled",
    ];

    return (
        <div className="absolute top-full right-40 mt-3 w-120 bg-surface-container-highest border border-outline-variant/20 rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.6)] p-6 z-50 animate-dropdown-enter">
            <div className="grid grid-cols-2 gap-6">
                <FilterGroup
                    title="Status"
                    items={statusFilters}
                    hoverClassName="hover:bg-primary/20 hover:text-primary"
                />

                <FilterGroup
                    title="Runtime"
                    items={runtimeFilters}
                    hoverClassName="hover:bg-primary/20 hover:text-primary"
                />

                <FilterGroup
                    title="Readiness"
                    items={readinessFilters}
                    hoverClassName="hover:bg-error/20 hover:text-error"
                />

                <FilterGroup
                    title="Current Run"
                    items={currentRunFilters}
                    hoverClassName="hover:bg-secondary/20 hover:text-secondary"
                />
            </div>
        </div>
    );
}

type FilterGroupProps = {
    title: string;
    items: string[];
    hoverClassName: string;
};

function FilterGroup({ title, items, hoverClassName }: FilterGroupProps) {
    return (
        <div>
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                {title}
            </h4>

            <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                    <span
                        key={item}
                        className={`px-2.5 py-1 text-[10px] font-medium bg-surface-container-low border border-white/5 rounded-md text-on-surface ${hoverClassName} transition-colors cursor-pointer`}
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}
