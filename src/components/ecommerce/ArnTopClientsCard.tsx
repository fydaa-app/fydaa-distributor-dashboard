"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import Link from "next/link";
import type { ArnDashboardTopClient } from "@/types/arnDashboard";

type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

const toneOrder: ArnTone[] = ["amber", "blue", "green", "teal", "purple", "red"];

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatIndianCurrency(value: number): string {
  if (value < 100000) return `₹${Math.round(value).toLocaleString("en-IN")}`;
  if (value < 10000000) {
    const lakhs = value / 100000;
    return `₹${Math.round(lakhs * 10) / 10} L`;
  }
  const crores = value / 10000000;
  return `₹${Math.round(crores * 10) / 10} Cr`;
}

interface ArnTopClientsCardProps {
  topClients: ArnDashboardTopClient[];
}

export default function ArnTopClientsCard({ topClients }: ArnTopClientsCardProps) {
  const clients = topClients.map((client, index) => ({
    userId: client.userId,
    initials: getInitials(client.clientName),
    name: client.clientName,
    aum: formatIndianCurrency(client.aum),
    tone: toneOrder[index % toneOrder.length],
  }));

  return (
    <div className="rounded-[16px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#1c1c1a] sm:p-6">
      <ArnCardHeader
        title="Top clients by AUM"
        action={
          <Link href="/arn-clients" className="text-xs font-bold text-[var(--arn-amber)] sm:text-sm">
            All →
          </Link>
        }
      />
      <div className="flex flex-col">
        {clients.map((client, index) => (
          <div
            key={`${client.userId}-${client.initials}-${index}`}
            className={`flex items-center gap-3 py-3 sm:py-4 ${
              index !== clients.length - 1 ? "border-b border-black/10 dark:border-white/10" : ""
            }`}
          >
            <ArnClientAvatar initials={client.initials} tone={client.tone} size="md" />
            <div className="flex-1 text-sm font-black text-[#1a1a18] sm:text-base dark:text-[#f0efe8]">
              {client.name}
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-[#1a1a18] sm:text-base dark:text-[#f0efe8]">
                {client.aum}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}