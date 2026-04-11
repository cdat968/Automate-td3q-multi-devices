"use client";

import React from "react";

interface IconButtonProps {
  icon: string;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  className?: string; // For things like hover:text-error
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, title, className = "" }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 transition-all ${className}`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
    </button>
  );
};
