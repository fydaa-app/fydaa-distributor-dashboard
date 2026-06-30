"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import Link from "next/link";
import type { ArnDashboardSipBookItem } from "@/types/arnDashboard";

type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

const toneOrder: ArnTone[] = ["amber", "blue", "green", "teal", "purple", "red"];

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
  const items = sipBook.map((item, index) => ({
    initials: getInitials(item.clientName),
    name: item.clientName,
    sipDate: item.sipDay,
    amount: item.amount,
    status: (item.statusLabel || item.status || "Active") as "Active" | "Due today" | "Paused",
    tone: toneOrder[index % toneOrder.length],
  }));

  const statusVariant: Record<string, "active" | "due" | "paused"> = {
    Active: "active",
    "Due today": "due",
    Paused: "paused",
  };

  return (
    <div className="rounded-[16px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#1c1c1a] sm:p-6">
      <ArnCardHeader
        title="SIP book"
        action={
          <Link href="/arn-sipbook" className="text-xs font-bold text-[#BA7517] sm:text-sm">
            All →
          </Link>
        }
      />
      <div className="flex flex-col gap-3">
        {items.map((sip) => (
          <div
            key={`${sip.initials}-${sip.sipDate}`}
            className="flex items-center gap-3 rounded-[12px] bg-[#f6f5f2] p-3 dark:bg-[#252522] sm:p-4"
          >
            <ArnClientAvatar initials={sip.initials} tone={sip.tone} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-[#1a1a18] sm:text-base dark:text-[#f0efe8]">
                {sip.name}
              </div>
              <div className="text-xs text-[#a8a8a3] sm:text-sm">{sip.sipDate}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-[#1a1a18] sm:text-base dark:text-[#f0efe8]">
                {sip.amount}
              </div>
              <ArnStatusTag label={sip.status} variant={statusVariant[sip.status] || "active"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}