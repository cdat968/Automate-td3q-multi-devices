"use client";

import React from "react";
import { ProfileTabs } from "./ProfileTabs";

interface ProfileDetailHeaderProps {
  profileName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ProfileDetailHeader: React.FC<ProfileDetailHeaderProps> = ({
  profileName,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="card pt-6 px-6 bg-surface-container flex-shrink-0">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-outline font-bold mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary status-dot-pulse"></span> Profile Configuration
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">{profileName}</h2>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="px-5 py-2.5 rounded-xl border border-outline-variant/40 text-sm font-bold hover:bg-surface-variant text-on-surface transition-all">
            Duplicate
          </button>
          <button className="btn-primary px-6 py-2.5 text-sm shadow-md shadow-primary/10">
            Save &amp; Deploy
          </button>
        </div>
      </div>

      <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
