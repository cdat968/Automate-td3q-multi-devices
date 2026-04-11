"use client";

import { usePathname } from "next/navigation";
import { navItems } from "@/components/navigation/navConfig";

// Derive page title from current path
function getPageTitle(pathname: string): string {
  const item = navItems.find((n) => n.href === pathname);
  if (item) return item.label;
  return "Dashboard";
}

export default function Header() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="fixed top-0 right-0 left-[240px] flex items-center justify-between px-6 h-16 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-sm shadow-black/20 font-medium text-sm">
      <div className="flex items-center gap-4">
        <button className="material-symbols-outlined text-slate-400 hover:bg-white/5 rounded-full p-2 transition-colors">
          menu
        </button>
        <span className="text-blue-400 font-bold">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative group">
          <input
            className="bg-surface-container-lowest border-none rounded-full px-10 py-1.5 text-xs w-64 focus:ring-1 focus:ring-primary transition-all outline-none"
            placeholder="Global search scripts..."
            type="text"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
            search
          </span>
        </div>

        {/* Icon actions */}
        <div className="flex items-center gap-2 text-slate-400">
          <button className="material-symbols-outlined hover:bg-white/5 rounded-full p-2 transition-colors">
            notifications
          </button>
          <button className="material-symbols-outlined hover:bg-white/5 rounded-full p-2 transition-colors">
            help_outline
          </button>
        </div>

        {/* CTA */}
        <button className="bg-primary hover:brightness-110 text-on-primary px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95">
          Quick Add
        </button>
      </div>
    </header>
  );
}
