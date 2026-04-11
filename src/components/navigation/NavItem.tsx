"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
}

export default function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all active:scale-95 ${
        isActive
          ? "text-blue-400 bg-blue-500/10"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
      }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {label}
    </Link>
  );
}
