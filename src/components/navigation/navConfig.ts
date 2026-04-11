// Navigation config — single source of truth for all sidebar links
export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export const navItems: NavItem[] = [
  { href: "/home", icon: "home", label: "Home" },
  { href: "/devices", icon: "important_devices", label: "Devices" },
  { href: "/profiles", icon: "sports_esports", label: "Game Profiles" },
  { href: "/scripts", icon: "description", label: "Scripts" },
  { href: "/runs", icon: "play_arrow", label: "Runs" },
  { href: "/logs", icon: "terminal", label: "Logs" },
  { href: "/marketplace", icon: "storefront", label: "Marketplace" },
  { href: "/settings", icon: "settings", label: "Settings" },
];
