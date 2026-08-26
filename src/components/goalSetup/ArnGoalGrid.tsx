"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getAllGoals, type GoalResponse } from "@/services/arnStockApi";

const CATEGORIES = [
  { termId: 1, label: "Short Term Goals", sublabel: "up to 3 years" },
  { termId: 2, label: "Medium Term Goals", sublabel: "3 to 7 years" },
  { termId: 3, label: "Long Term Goals", sublabel: "7+ years" },
] as const;

const EXCLUDED_GOAL_IDS = new Set([34, 35, 36, 37, 38, 39, 40, 41, 42]);

const GOAL_ICONS: Record<string, string> = {
  vacation: "plane",
  gadgets: "monitor",
  shopping: "bag",
  "emergency fund": "shield",
  emergency: "shield",
  jewellery: "gem",
  "insurance premium": "file",
  vehicle: "car",
  wellness: "smile",
  parenting: "users",
  "home purchase": "home",
  "buying a vehicle": "car",
  "marriage fund": "heart",
  "wealth creation": "trending",
  retirement: "medal",
  "children education": "edu",
  "gold savings": "gem",
};

const ICONS: Record<string, React.ReactNode> = {
  plane: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 16v-2a4 4 0 00-4-4H7l5-5M7 10l5 5" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
  monitor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M6 22h12M10 18v4M14 18v4" />
    </svg>
  ),
  bag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  gem: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  file: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 18v-6M9 15l3-3 3 3" />
    </svg>
  ),
  car: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h2M19 17h2a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  smile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  wallet: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="6" width="22" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M1 10h2M21 10h2" />
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  trending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  edu: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
  medal: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M8 14h8l2 8H6l2-8z" />
    </svg>
  ),
};

function getGoalIcon(name: string): React.ReactNode {
  const key = GOAL_ICONS[name.toLowerCase().trim()] || "trending";
  return ICONS[key] || ICONS.trending;
}

interface ArnGoalGridProps {
  selectedGoalId: number | null;
  onSelect: (goal: GoalResponse) => void;
}

export default function ArnGoalGrid({ selectedGoalId, onSelect }: ArnGoalGridProps) {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getAllGoals()
      .then((data) => {
        if (!cancelled) {
          setGoals(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load goals.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredGoals = useMemo(
    () => goals.filter((g) => !EXCLUDED_GOAL_IDS.has(g.id)),
    [goals]
  );

  const grouped = useMemo(() => {
    const map = new Map<number, GoalResponse[]>();
    for (const goal of filteredGoals) {
      const list = map.get(goal.termId) || [];
      list.push(goal);
      map.set(goal.termId, list);
    }
    return CATEGORIES.map((cat) => ({
      ...cat,
      goals: map.get(cat.termId) || [],
    }));
  }, [filteredGoals]);

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {CATEGORIES.map((group) => (
          <div key={group.termId}>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-[var(--arn-bg-2)]" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
                  <div className="h-10 w-10 animate-pulse rounded-[12px] bg-[var(--arn-bg-2)]" />
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.termId}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-bold text-[var(--arn-txt)]">
              {group.label}
            </h3>
            <span className="rounded-full bg-[var(--arn-bg-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--arn-txt-3)]">
              {group.goals.length} {group.goals.length === 1 ? "goal" : "goals"}
            </span>
            <span className="text-xs text-[var(--arn-txt-3)]">
              ({group.sublabel})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.goals.map((goal) => {
              const isSelected = selectedGoalId === goal.id;
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => onSelect(goal)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-[14px] border p-4 text-center transition-all",
                    isSelected
                       ? "border border-[var(--arn-amber)] bg-[var(--arn-amber-sel-bg)] shadow-[0_4px_16px_var(--arn-amber-bg-grad-1)]"
                      : "border-[var(--arn-bdr)] bg-[var(--arn-bg)] hover:border-[var(--arn-bdr-2)] hover:shadow-[0_4px_16px_rgba(0,0,0,.04)]"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
                      isSelected
                        ? "bg-[var(--arn-bg)] text-[var(--arn-amber)]"
                        : "bg-[var(--arn-amber-bg)] text-[var(--arn-amber)]"
                    )}
                  >
                    {getGoalIcon(goal.name)}
                  </div>
                  <div className="w-full min-w-0 break-words text-xs font-bold leading-tight text-[var(--arn-txt)] sm:text-sm">
                    {goal.name}
                  </div>
                   <div className="text-[10px] text-[var(--arn-txt-3)]">
                     {Math.round(goal.tenureMin / 12)}–{Math.round(goal.tenureMax / 12)} yrs
                   </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
