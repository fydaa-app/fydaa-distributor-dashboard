"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import Link from "next/link";

type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

interface TopClient {
  initials: string;
  name: string;
  aum: string;
  growth: string;
  tone: ArnTone;
}

const clients: TopClient[] = [
  { initials: "RS", name: "Rahul Sharma", aum: "₹62 L", growth: "+9.2%", tone: "amber" },
  { initials: "PG", name: "Priya Gupta", aum: "₹48 L", growth: "+7.1%", tone: "blue" },
  { initials: "NJ", name: "Nikhil Joshi", aum: "₹39 L", growth: "-1.3%", tone: "green" },
  { initials: "SM", name: "Sunita Mehta", aum: "₹31 L", growth: "+4.8%", tone: "teal" },
  { initials: "AK", name: "Amit Kumar", aum: "₹28 L", growth: "+11.2%", tone: "purple" },
];

export default function ArnTopClientsCard() {
  return (
    <div className="rounded-[16px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#1c1c1a] sm:p-6">
      <ArnCardHeader
        title="Top clients by AUM"
        action={
          <Link href="/arn-clients" className="text-xs font-bold text-[#BA7517] sm:text-sm">
            All →
          </Link>
        }
      />
      <div className="flex flex-col">
        {clients.map((client, index) => (
          <div
            key={client.initials}
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
              <div
                className={`text-xs font-bold sm:text-sm ${
                  client.growth.startsWith("-") ? "text-[#A32D2D]" : "text-[#3B6D11]"
                }`}
              >
                {client.growth}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
