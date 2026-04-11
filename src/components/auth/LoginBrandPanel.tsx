// LoginBrandPanel.tsx — Server Component (no state, pure display)
// Left panel: logo, hero copy, feature bullets, floating stat cards

export default function LoginBrandPanel() {
    const features = [
        { icon: "hub", label: "Multi-device orchestration" },
        { icon: "monitoring", label: "Stable execution monitoring" },
        { icon: "account_tree", label: "Marketplace-ready architecture" },
    ];

    const stats = [
        {
            icon: "devices",
            iconColorClass: "text-tertiary",
            bgClass: "bg-tertiary-container/20",
            value: "24",
            label: "Devices Online",
            extraClass: "animate-float",
        },
        {
            icon: "bolt",
            iconColorClass: "text-primary",
            bgClass: "bg-primary-container/20",
            value: "98.4%",
            label: "Stable Runs",
            extraClass: "animate-float",
        },
    ];

    return (
        <div className="relative w-full md:w-1/2 min-h-[353px] md:min-h-screen flex items-center justify-center p-8 md:p-16 overflow-hidden bg-gradient-to-br from-[#0b1326] via-[#060e20] to-[#131b2e]">
            {/* Background blur orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[100px]" />

            <div className="relative z-10 max-w-xl">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
                        <span
                            className="material-symbols-outlined text-on-primary text-3xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            terminal
                        </span>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tighter text-on-surface uppercase">
                        GameFlow AutoPilot
                    </span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl md:text-6xl font-bold text-on-surface leading-tight mb-6">
                    Control Your Game{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
                        Automation
                    </span>
                </h1>

                <p className="text-lg text-on-surface-variant mb-10 max-w-md">
                    Manage devices, run scripts, and monitor health from a
                    unified, enterprise-grade command center.
                </p>

                {/* Feature bullets */}
                <ul className="space-y-4 mb-12">
                    {features.map(({ icon, label }) => (
                        <li key={icon} className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-xl">
                                {icon}
                            </span>
                            <span className="text-on-surface-variant font-medium uppercase tracking-wider text-xs">
                                {label}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* Floating stat cards */}
                <div className="hidden md:grid grid-cols-2 gap-6 relative">
                    {stats.map(
                        ({
                            icon,
                            iconColorClass,
                            bgClass,
                            value,
                            label,
                            extraClass,
                        }) => (
                            <div
                                key={icon}
                                className={`glass-card p-6 rounded-2xl flex items-center gap-4 ${extraClass}`}
                            >
                                <div className={`p-3 rounded-lg ${bgClass}`}>
                                    <span
                                        className={`material-symbols-outlined ${iconColorClass}`}
                                        style={{
                                            fontVariationSettings: "'FILL' 1",
                                        }}
                                    >
                                        {icon}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-on-surface">
                                        {value}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
                                        {label}
                                    </div>
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}
