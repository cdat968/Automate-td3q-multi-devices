"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
  colorClass?: string;
  className?: string; // Additional classes for custom positioning
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, colorClass = "text-outline", className = "" }) => {
  return (
    <span className={`text-[10px] font-bold shrink-0 ml-2 ${colorClass} ${className}`}>
      {status}
    </span>
  );
};
