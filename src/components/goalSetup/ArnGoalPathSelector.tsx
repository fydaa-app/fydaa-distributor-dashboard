"use client";

import { type GoalSetupClient } from "@/services/arnGoalSetupService";

interface ArnGoalPathSelectorProps {
  selectedClient: GoalSetupClient | null;
  onSelect: (path: "goal" | "direct") => void;
}

const PATHWAYS = [
  {
    key: "goal" as const,
    title: "Goal-based investing",
    description: "Set up a goal like Vacation, Retirement, Home, Education — we recommend the right funds for each.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    key: "direct" as const,
    title: "Direct SIP / Investment",
    description: "Start an InstaFD, Digital Gold, Equity, or Multi-Asset SIP directly — pick your product and fund.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
] as const;

export default function ArnGoalPathSelector({ selectedClient, onSelect }: ArnGoalPathSelectorProps) {
  const clientName = selectedClient?.name || "the client";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--arn-txt)] sm:text-2xl">
          What would you like to <span className="text-[var(--arn-amber)]">set up?</span>
        </h2>
        <p className="mt-1 text-sm text-[var(--arn-txt-2)] sm:text-base">
          Choose a path for {clientName}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PATHWAYS.map((pathway) => (
          <button
            key={pathway.key}
            type="button"
            onClick={() => onSelect(pathway.key)}
            className="flex items-start gap-4 rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 text-left transition-all hover:border-[var(--arn-bdr-2)] hover:shadow-[0_4px_16px_rgba(0,0,0,.04)]"
          >
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[var(--arn-amber-bg)] text-[var(--arn-amber)]">
              {pathway.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-[var(--arn-txt)] sm:text-lg">{pathway.title}</div>
              <div className="mt-1 text-xs text-[var(--arn-txt-2)] leading-relaxed sm:text-sm">{pathway.description}</div>
            </div>
            <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--arn-txt-3)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
