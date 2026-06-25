import React from "react";

interface ArnCardHeaderProps {
  title: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export default function ArnCardHeader({ title, action, children }: ArnCardHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm font-black text-[#1a1a18] sm:text-base dark:text-[#f0efe8]">
        {title}
      </span>
      {children || action}
    </div>
  );
}
