"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import Link from "next/link";

type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";
type SipStatus = "Active" | "Due today" | "Paused";

interface SipBookItem {
  initials: string;
  name: string;
  sipDate: string;
  amount: string;
  status: SipStatus;
  tone: ArnTone;
}

const sipBook: SipBookItem[] = [
  {
    initials: "RS",
    name: "Rahul Sharma",
    sipDate: "10th monthly",
    amount: "₹15,000",
    status: "Active",
    tone: "amber",
  },
  {
    initials: "PG",
    name: "Priya Gupta",
    sipDate: "5th monthly",
    amount: "₹25,000",
    status: "Due today",
    tone: "blue",
  },
  {
    initials: "AK",
    name: "Amit Kumar",
    sipDate: "15th monthly",
    amount: "₹10,000",
    status: "Active",
    tone: "green",
  },
  {
    initials: "SM",
    name: "Sunita Mehta",
    sipDate: "20th monthly",
    amount: "₹5,000",
    status: "Paused",
    tone: "teal",
  },
];

const statusVariant: Record<SipStatus, "active" | "due" | "paused"> = {
  Active: "active",
  "Due today": "due",
  Paused: "paused",
};

export default function ArnSipBookList() {
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
        {sipBook.map((sip) => (
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
              <ArnStatusTag label={sip.status} variant={statusVariant[sip.status]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
