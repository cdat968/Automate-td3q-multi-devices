// (dashboard)/devices/page.tsx
export const metadata = { title: "Devices Manager | GameFlow AutoPilot" };

export default function DevicesPage() {
  return (
    <>
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-on-surface-variant text-xs mb-1 uppercase tracking-widest font-bold">System Overview</p>
          <h2 className="page-title text-on-surface">Node Fleet Control</h2>
          <p className="text-on-surface-variant mt-2 max-w-lg text-sm">
            Monitor, group, and control all connected automation devices in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-xl border border-outline-variant/20 hover:bg-surface-container-highest transition-all flex items-center gap-2 text-sm font-semibold">
            <span className="material-symbols-outlined text-sm">filter_list</span> Filter
          </button>
          <button className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-xl border border-outline-variant/20 hover:bg-surface-container-highest transition-all flex items-center gap-2 text-sm font-semibold">
            <span className="material-symbols-outlined text-sm">inventory_2</span> Bulk Actions
          </button>
          <button className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Add Device
          </button>
        </div>
      </section>

      {/* Summary KPIs */}
      <section className="dashboard-grid">
        {[
          { icon: "devices",         label: "Total Devices",    value: "142", trend: "+4 since last hour",      trendColor: "text-tertiary",          valueColor: "text-primary",  urgent: false },
          { icon: "wifi",            label: "Online",           value: "128", trend: "90.1% Network Active",    trendColor: "text-on-surface-variant", valueColor: "text-tertiary", urgent: false },
          { icon: "hourglass_empty", label: "Idle",             value: "9",   trend: "Awaiting commands",       trendColor: "text-on-surface-variant", valueColor: "text-slate-400",urgent: false },
          { icon: "warning",         label: "Error / Attention",value: "5",   trend: "Immediate action required",trendColor: "text-error",             valueColor: "text-error",    urgent: true  },
        ].map((card) => (
          <div key={card.label} className={`card p-6 relative overflow-hidden group ${card.urgent ? "border-l-4 border-l-error" : ""}`}>
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-6xl">{card.icon}</span>
            </div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{card.label}</p>
            <div className={`text-4xl font-black tracking-tighter ${card.valueColor}`}>{card.value}</div>
            <div className={`mt-4 flex items-center gap-2 text-[10px] ${card.trendColor}`}>
              {card.urgent
                ? <span className="material-symbols-outlined text-xs status-dot-pulse">error_outline</span>
                : <span className="w-1.5 h-1.5 rounded-full bg-current" />
              }
              {card.trend}
            </div>
          </div>
        ))}
      </section>

      {/* Table + Detail Drawer */}
      <div className="flex gap-6 items-start">
        {/* Device Table */}
        <div className="flex-1 min-w-0 card overflow-hidden">
          {/* Filter bar */}
          <div className="p-4 bg-surface-container-high/50 flex flex-wrap items-center gap-4 border-b border-white/5">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                className="w-full bg-surface-container-lowest border-none rounded-lg pl-10 pr-4 py-2 text-sm focus-ring placeholder:text-on-surface-variant/50 outline-none"
                placeholder="Search by Device Name or ID..."
                type="text"
              />
            </div>
            {[
              "All Status|Online|Error",
              "Game: All|Aetheria Online|Void Crawler",
              "Sort: Heartbeat|Sort: Name",
            ].map((opts) => (
              <select key={opts} className="bg-surface-container-lowest border-none rounded-lg px-4 py-2 text-sm text-on-surface-variant outline-none">
                {opts.split("|").map((o) => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-container-low/30">
                  <th className="py-4 px-6 w-10">
                    <input className="rounded bg-surface-container-lowest border-outline-variant" type="checkbox" />
                  </th>
                  {["Device / ID", "Platform", "Active Game", "Profile", "Status", "Heartbeat", ""].map((h) => (
                    <th key={h} className="py-4 px-4 text-[10px] uppercase tracking-widest font-black text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5 text-xs">
                {[
                  { name: "Alpha-Node-01", uid: "8821-X99", platform: "phone_android",  platformLabel: "Android 12", game: "Aetheria Online", profile: "Farming_Pro_v4", status: "Running",   statusClass: "bg-tertiary/10 text-tertiary",               heartbeat: "2ms ago",     heartbeatClass: "text-tertiary",           rowClass: "" },
                  { name: "Delta-Bot-09",  uid: "4412-Z21", platform: "desktop_windows",platformLabel: "Win 11 x64", game: "Arena Master",    profile: "Combat_Aggro",  status: "Exception", statusClass: "bg-error/10 text-error animate-pulse",       heartbeat: "Disconnected",heartbeatClass: "text-error",              rowClass: "bg-error/5" },
                  { name: "Zeta-Node-05",  uid: "1105-B04", platform: "phone_iphone",   platformLabel: "iOS 16.4",   game: "Idle",            profile: "None",          status: "Idle",      statusClass: "bg-slate-400/10 text-slate-400",              heartbeat: "14m ago",     heartbeatClass: "text-on-surface-variant", rowClass: "border-l-2 border-l-primary" },
                ].map((row) => (
                  <tr key={row.uid} className={`hover:bg-surface-container-high/30 transition-colors cursor-pointer ${row.rowClass}`}>
                    <td className="py-4 px-6"><input className="rounded bg-surface-container-lowest border-outline-variant" type="checkbox" /></td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-on-surface">{row.name}</div>
                      <div className="font-telemetry text-on-surface-variant">UID: {row.uid}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">{row.platform}</span>
                        <span>{row.platformLabel}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">{row.game}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 bg-surface-container-highest rounded text-on-surface-variant">{row.profile}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${row.statusClass} text-[10px] font-black uppercase`}>
                        <span className="w-1 h-1 rounded-full bg-current" />{row.status}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-telemetry ${row.heartbeatClass}`}>{row.heartbeat}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Drawer */}
        <aside className="desktop-only w-[360px] glass-panel rounded-xl sticky top-24 overflow-hidden shrink-0">
          <div className="p-6 border-b border-white/5 bg-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Live Telemetry</div>
              <button className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined text-lg">close</span></button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">dns</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface leading-none">Zeta-Node-05</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary" />
                  <span className="text-[10px] font-bold text-tertiary uppercase">Active Connection</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {[
              { label: "CPU Usage", value: "42%",           width: "42%" },
              { label: "Memory",    value: "1.2 GB / 4 GB", width: "30%" },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase mb-2">
                  <span>{bar.label}</span><span className="text-primary">{bar.value}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: bar.width }} />
                </div>
              </div>
            ))}
            {[
              { label: "Last Activity",    value: "14:22:01.04 UTC", mono: true  },
              { label: "Assigned Script",  value: "Resource_Gatherer_v2", color: "text-tertiary" },
              { label: "Game Profile",     value: "Lvl_50_Warrior" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">{row.label}</span>
                <span className={`text-xs font-bold ${row.mono ? "font-telemetry" : ""} ${row.color ?? "text-on-surface"}`}>{row.value}</span>
              </div>
            ))}
            <div>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Immediate Actions</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "terminal",    label: "Remote Shell",  color: "text-primary" },
                  { icon: "videocam",    label: "Mirror Screen", color: "text-primary" },
                  { icon: "restart_alt", label: "Force Reboot",  color: "text-error"   },
                  { icon: "block",       label: "Kill Scripts",  color: "text-error"   },
                ].map((a) => (
                  <button key={a.label} className="py-3 px-4 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold flex flex-col items-center gap-2 transition-all">
                    <span className={`material-symbols-outlined ${a.color}`}>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bulk Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-surface-container-highest/90 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl z-50">
        <div className="px-6 py-3 text-xs font-bold text-on-surface border-r border-white/10">
          <span className="text-primary">12</span> Devices Selected
        </div>
        <div className="flex items-center gap-1 p-1">
          {[
            { icon: "assignment_ind", label: "Assign Profile", cls: "text-on-surface" },
            { icon: "play_arrow",     label: "Start Script",   cls: "text-tertiary"   },
          ].map((btn) => (
            <button key={btn.label} className={`px-4 py-2 hover:bg-white/5 rounded-xl text-xs font-bold ${btn.cls} flex items-center gap-2 transition-all`}>
              <span className="material-symbols-outlined text-sm">{btn.icon}</span> {btn.label}
            </button>
          ))}
          <button className="px-4 py-2 bg-error-container text-on-error-container rounded-xl text-xs font-black flex items-center gap-2 hover:bg-error-container/80 transition-all">
            <span className="material-symbols-outlined text-sm">pause</span> Pause All
          </button>
        </div>
      </div>
    </>
  );
}
