// (dashboard)/home/page.tsx
import Badge from "@components/ui/Badge";

export const metadata = { title: "Home Dashboard | GameFlow AutoPilot" };

export default function HomePage() {
    return (
        <>
            {/* Row 1: Page header */}
            <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="page-title text-on-surface">
                        Good evening, Operator
                    </h2>
                    <p className="text-on-surface-variant text-sm mt-1">
                        Your automation network is running smoothly with no
                        critical alerts.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button className="px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold hover:bg-surface-variant transition-all">
                        View Logs
                    </button>
                    <button className="btn-primary px-5 py-2.5 text-sm">
                        Run Script
                    </button>
                    <button className="px-3 py-2.5 rounded-xl bg-surface-container-high flex items-center gap-2 hover:bg-surface-bright transition-all">
                        <span className="material-symbols-outlined text-primary">
                            add_circle
                        </span>
                        <span className="material-symbols-outlined">
                            expand_more
                        </span>
                    </button>
                </div>
            </section>

            {/* Row 2: KPI Cards — using .dashboard-grid */}
            <section className="dashboard-grid">
                {[
                    {
                        icon: "important_devices",
                        label: "Active Devices",
                        value: "24",
                        trend: "+3 this week",
                        trendColor: "text-tertiary",
                        bar: "w-4/5 bg-primary",
                    },
                    {
                        icon: "play_circle",
                        label: "Running Scripts",
                        value: "12",
                        trend: "3 queued",
                        trendColor: "text-outline",
                        bar: null,
                    },
                    {
                        icon: "check_circle",
                        label: "Success Rate",
                        value: "98.4%",
                        trend: "Last 7 days",
                        trendColor: "text-outline",
                        bar: "w-[98%] bg-tertiary",
                    },
                    {
                        icon: "schedule",
                        label: "Automation Hours Saved",
                        value: "186h",
                        trend: "+12h Today",
                        trendColor: "text-tertiary",
                        bar: null,
                    },
                ].map((card) => (
                    <div
                        key={card.label}
                        className="card p-5 flex flex-col justify-between group hover:bg-surface-container-high transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <span className="material-symbols-outlined">
                                    {card.icon}
                                </span>
                            </div>
                            <span
                                className={`text-[10px] font-bold ${card.trendColor}`}
                            >
                                {card.trend}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                                {card.label}
                            </p>
                            <h3 className="text-3xl font-extrabold mt-1">
                                {card.value}
                            </h3>
                        </div>
                        {card.bar && (
                            <div className="mt-4 w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full ${card.bar}`} />
                            </div>
                        )}
                    </div>
                ))}
            </section>

            {/* Row 3: Live Ops & Health — using .dashboard-row */}
            <section className="dashboard-row">
                {/* Live Operations table */}
                <div className="card overflow-hidden flex flex-col">
                    <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5">
                        <h3 className="section-title">
                            Live Operations Overview
                        </h3>
                        <div className="flex bg-surface-container-lowest p-1 rounded-lg">
                            {["All", "Running", "Queued", "Failed"].map(
                                (tab) => (
                                    <button
                                        key={tab}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${tab === "All" ? "bg-surface-variant" : "text-outline hover:text-on-surface"}`}
                                    >
                                        {tab}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold text-outline uppercase tracking-widest bg-surface-container-lowest/30">
                                    {[
                                        "Script Name",
                                        "Device Group",
                                        "Game Profile",
                                        "Status",
                                        "Runtime",
                                        "Heartbeat",
                                        "",
                                    ].map((h) => (
                                        <th key={h} className="px-6 py-4">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-xs divide-y divide-white/5">
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-primary">
                                        ResourceFarm_V4
                                    </td>
                                    <td className="px-6 py-4 text-outline">
                                        Cluster-Alpha
                                    </td>
                                    <td className="px-6 py-4">Elden Ring</td>
                                    <td className="px-6 py-4">
                                        <Badge status="running" />
                                    </td>
                                    <td className="px-6 py-4 font-telemetry text-outline">
                                        04h 22m
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-outline">
                                        2s ago
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 hover:bg-surface-variant rounded-lg">
                                            <span className="material-symbols-outlined text-sm">
                                                more_vert
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-primary">
                                        Daily_Login_Bot
                                    </td>
                                    <td className="px-6 py-4 text-outline">
                                        Mobile-VM-02
                                    </td>
                                    <td className="px-6 py-4">Genshin</td>
                                    <td className="px-6 py-4">
                                        <Badge status="healthy" />
                                    </td>
                                    <td className="px-6 py-4 font-telemetry text-outline">
                                        00h 15m
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-outline">
                                        12s ago
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 hover:bg-surface-variant rounded-lg">
                                            <span className="material-symbols-outlined text-sm">
                                                more_vert
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-primary">
                                        Market_Sniper_PRO
                                    </td>
                                    <td className="px-6 py-4 text-outline">
                                        Workstation-01
                                    </td>
                                    <td className="px-6 py-4">WOW Classic</td>
                                    <td className="px-6 py-4">
                                        <Badge status="error" />
                                    </td>
                                    <td className="px-6 py-4 font-telemetry text-outline">
                                        --
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-outline">
                                        Timeout
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 hover:bg-surface-variant rounded-lg">
                                            <span className="material-symbols-outlined text-sm">
                                                more_vert
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Health */}
                <div className="card p-6 flex flex-col gap-6">
                    <h3 className="section-title">System Health</h3>
                    <div className="grid grid-cols-2 gap-8">
                        {[
                            {
                                label: "CPU",
                                value: "42%",
                                stroke: "#adc6ff",
                                dash: "42",
                            },
                            {
                                label: "Memory",
                                value: "68%",
                                stroke: "#4ae176",
                                dash: "68",
                            },
                        ].map((gauge) => (
                            <div
                                key={gauge.label}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="relative w-24 h-24">
                                    <svg
                                        className="w-full h-full -rotate-90"
                                        viewBox="0 0 36 36"
                                    >
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#2d3449"
                                            strokeDasharray="100, 100"
                                            strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={gauge.stroke}
                                            strokeDasharray={`${gauge.dash}, 100`}
                                            strokeLinecap="round"
                                            strokeWidth="3"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-bold">
                                            {gauge.value}
                                        </span>
                                        <span className="text-[8px] text-outline uppercase font-bold tracking-widest">
                                            {gauge.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        {[
                            {
                                label: "Queue Load",
                                value: "14/50 scripts",
                                width: "28%",
                            },
                            {
                                label: "Error Retry Rate",
                                value: "0.8%",
                                width: "12%",
                            },
                        ].map((bar) => (
                            <div key={bar.label}>
                                <div className="flex justify-between text-[10px] mb-1.5">
                                    <span className="text-outline uppercase font-bold tracking-widest">
                                        {bar.label}
                                    </span>
                                    <span className="font-bold">
                                        {bar.value}
                                    </span>
                                </div>
                                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary-container h-full"
                                        style={{ width: bar.width }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-tertiary" />
                            <span className="text-xs font-bold text-on-surface">
                                System Stable
                            </span>
                        </div>
                        <span className="text-[10px] text-outline">
                            v2.4.1-Stable
                        </span>
                    </div>
                </div>
            </section>

            {/* Row 4: Timeline & Alerts */}
            <section className="dashboard-row">
                <div className="card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="section-title">
                            Device Activity Timeline
                        </h3>
                        <div className="flex gap-3">
                            <span className="flex items-center gap-1 text-[10px] text-outline font-bold">
                                <span className="w-2 h-2 rounded-full bg-primary" />{" "}
                                Scripts
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-outline font-bold">
                                <span className="w-2 h-2 rounded-full bg-tertiary" />{" "}
                                Success
                            </span>
                        </div>
                    </div>
                    <div className="h-48 flex items-end gap-2 px-2">
                        {[30, 45, 60, 35, 75, 55, 85, 40, 25, 95, 50, 30].map(
                            (h, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-primary/30 rounded-t-sm hover:bg-primary/50 transition-colors"
                                    style={{ height: `${h}%` }}
                                />
                            ),
                        )}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-outline px-2 font-bold tracking-widest">
                        <span>08:00 AM</span>
                        <span>12:00 PM</span>
                        <span>04:00 PM</span>
                        <span>08:00 PM</span>
                    </div>
                </div>

                <div className="card flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="section-title">
                            Alerts &amp; Incidents
                        </h3>
                        <span className="text-[10px] font-bold bg-error/10 text-error px-2 py-1 rounded uppercase">
                            Live Feed
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto font-telemetry p-4 space-y-4">
                        {[
                            {
                                time: "18:42:01",
                                level: "CRITICAL",
                                borderColor: "border-error",
                                textColor: "text-error",
                                msg: "VM-Cluster-Alpha connection lost. Attempting reconnection...",
                            },
                            {
                                time: "18:35:12",
                                level: "INFO",
                                borderColor: "border-primary",
                                textColor: "text-primary",
                                msg: "Script ResourceFarm_V4 execution started.",
                            },
                            {
                                time: "18:20:55",
                                level: "SUCCESS",
                                borderColor: "border-tertiary",
                                textColor: "text-tertiary",
                                msg: "Daily tasks completed for Profile_User_11.",
                            },
                            {
                                time: "18:15:00",
                                level: "INFO",
                                borderColor: "border-primary",
                                textColor: "text-primary",
                                msg: "Scheduled maintenance window passed successfully.",
                            },
                        ].map((log) => (
                            <div
                                key={log.time}
                                className={`flex gap-3 items-start border-l-2 pl-3 ${log.borderColor}`}
                            >
                                <div className="text-[10px] text-outline shrink-0 mt-0.5">
                                    {log.time}
                                </div>
                                <div className="text-[11px]">
                                    <span
                                        className={`font-bold ${log.textColor}`}
                                    >
                                        {log.level}:
                                    </span>{" "}
                                    {log.msg}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 bg-surface-container-lowest text-center">
                        <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                            Open Full Console
                        </button>
                    </div>
                </div>
            </section>

            {/* Row 5: Top Profiles & Quick Actions */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h3 className="section-title mb-6">Top Game Profiles</h3>
                    <div className="space-y-3">
                        {[
                            {
                                name: "Elden Ring: Rune Farm",
                                devices: "8",
                                rate: "99.2%",
                                runs: "1,240",
                                rateColor: "text-tertiary",
                            },
                            {
                                name: "Starfield: Mining Bot",
                                devices: "4",
                                rate: "97.8%",
                                runs: "840",
                                rateColor: "text-tertiary",
                            },
                            {
                                name: "WOW Classic: Auctioneer",
                                devices: "12",
                                rate: "91.4%",
                                runs: "2,105",
                                rateColor: "text-error",
                            },
                        ].map((p) => (
                            <div
                                key={p.name}
                                className="flex items-center gap-4 bg-surface-container p-3 rounded-xl hover:bg-surface-bright transition-all cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-lg bg-surface-container-high shrink-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-sm">
                                        sports_esports
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold truncate-text">
                                        {p.name}
                                    </h4>
                                    <span className="text-[10px] text-outline">
                                        {p.devices} Devices Active
                                    </span>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <span
                                        className={`text-xs font-bold ${p.rateColor}`}
                                    >
                                        {p.rate} Success
                                    </span>
                                    <span className="text-[10px] text-outline">
                                        {p.runs} runs
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="section-title mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                            { icon: "add_to_queue", label: "Add Device" },
                            { icon: "data_object", label: "Create Script" },
                            { icon: "content_copy", label: "Clone Profile" },
                            { icon: "event_available", label: "Schedule Run" },
                            { icon: "history_edu", label: "Open Logs" },
                            { icon: "group_add", label: "Invite Team" },
                        ].map((action) => (
                            <button
                                key={action.label}
                                className="flex flex-col items-center justify-center p-4 bg-surface-container hover:bg-primary/20 hover:text-primary rounded-xl border border-white/5 transition-all group"
                            >
                                <span className="material-symbols-outlined mb-2 text-2xl group-hover:scale-110 transition-transform">
                                    {action.icon}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider leading-tight text-center">
                                    {action.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
