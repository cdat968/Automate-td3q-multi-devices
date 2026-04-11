"use client";

import React from "react";

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ["Task Sequence", "Stability", "Assignment", "Preview", "Versions", "Logs"];

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex gap-8 mt-8 border-b border-white/5">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`pb-3 text-sm font-bold transition-all border-b-[3px] ${
            activeTab === tab
              ? "border-primary text-primary glow-text-primary"
              : "border-transparent text-outline hover:text-on-surface-variant"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
