"use client";

import React from "react";
import { StatusBadge } from "../shared/StatusBadge";

interface Profile {
  id: string;
  name: string;
  game: string;
  status: string;
  statusColor: string;
}

interface ProfileListPanelProps {
  profiles: Profile[];
  activeProfileId: string;
  onProfileClick: (id: string) => void;
  onNewProfile: () => void;
}

export const ProfileListPanel: React.FC<ProfileListPanelProps> = ({
  profiles,
  activeProfileId,
  onProfileClick,
  onNewProfile,
}) => {
  return (
    <div className="w-[320px] shrink-0 card flex flex-col overflow-hidden bg-surface-container">
      <div className="p-4 border-b border-white/5 bg-surface-container-high/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Game Profiles</h2>
          <button
            onClick={onNewProfile}
            className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span> New
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          return (
            <div
              key={p.id}
              onClick={() => onProfileClick(p.id)}
              className={`p-4 cursor-pointer transition-all border-b border-white/5 hover:bg-surface-container-high ${
                isActive ? "bg-primary/5 border-l-[3px] border-l-primary" : "border-l-[3px] border-l-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <h3 className={`text-sm font-bold truncate-text ${isActive ? "text-primary glow-text-primary" : "text-on-surface"}`}>
                  {p.name}
                </h3>
                <StatusBadge status={p.status} colorClass={p.statusColor} />
              </div>
              <p className="text-[11px] text-outline font-medium">{p.game}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
