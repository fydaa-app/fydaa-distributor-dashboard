"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import Link from "next/link";
import { useState } from "react";
import type { ArnDashboardSipBookItem } from "@/types/arnDashboard";

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// function normalizeStatus(status: string): "active" | "due" | "paused" {
//   const normalized = status.toLowerCase();
//   if (normalized.includes("due")) return "due";
//   if (normalized.includes("pause")) return "paused";
//   return "active";
// }

interface ArnSipBookListProps {
  sipBook: ArnDashboardSipBookItem[];
}

export default function ArnSipBookList({ sipBook }: ArnSipBookListProps) {
  const [expanded, setExpanded] = useState(false);

  const items = sipBook.map((item) => ({
    initials: getInitials(item.clientName),
    name: item.clientName,
    sipName: item.sipName,
    amount: item.amount,
    userId: item.userId,
  }));

  const visibleItems = expanded ? items : items.slice(0, 4);

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 dark:border-[var(--arn-bdr)] dark:bg-[var(--arn-bg)] sm:p-6">
      <ArnCardHeader
        title="SIP book"
        action={
          <Link href="/arn-sipbook" className="text-xs font-bold text-[var(--arn-amber)] sm:text-sm">
            All →
          </Link>
        }
      />
      <div className="flex flex-col gap-3">
        {visibleItems.map((sip, index) => (
          <div
            key={`${sip.userId ?? "x"}-${sip.initials}-${index}`}
            className="flex items-center gap-3 rounded-[12px] bg-[var(--arn-bg-2)] p-3 dark:bg-[var(--arn-bg-2)] sm:p-4"
          >
            <ArnClientAvatar initials={sip.initials} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-[var(--arn-txt)] sm:text-base">
                {sip.name}
              </div>
              <div className="text-xs text-[var(--arn-amber)] dark:text-[var(--arn-amber-txt)] sm:text-sm">
                {sip.sipName}
              </div>
            </div>
            <div>
              <div className="text-sm font-black text-[var(--arn-amber)] dark:text-[var(--arn-amber-txt)] sm:text-base">
                {sip.amount}
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-[12px] py-2 text-xs font-bold text-[var(--arn-amber)] sm:text-sm"
        >
          {expanded ? "View less" : "View more"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 150ms" }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}