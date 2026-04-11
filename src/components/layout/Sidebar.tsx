import NavItem from "@/components/navigation/NavItem";
import { navItems } from "@/components/navigation/navConfig";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 flex flex-col z-40 w-[240px] h-screen bg-slate-950 border-r border-white/5 text-sm antialiased tracking-tight">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tighter text-slate-100">
          GameFlow AutoPilot
        </h1>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User badge */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs shrink-0">
            OP
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate">Operator_771</p>
            <p className="text-[10px] text-outline truncate uppercase tracking-widest">
              Premium Tier
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
