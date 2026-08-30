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
  vacation: "vacation",
  gadgets: "gadgets",
  shopping: "shopping",
  "wellness & hobbies": "wellness",
  "emergency fund": "emergency",
  jewellery: "jewellery",
  "insurance premiums": "insurance",
  vehicle: "vehicle",
  "buying a vehicle": "buyingdream",
  parenting: "parenting",
  "home purchase": "home",
  "marriage fund": "marriage",
  "wealth creation": "wealth",
  retirement: "retire",
  "children education": "children",
  "gold savings": "gold",
};

function getGoalIcon(name: string): React.ReactNode {
  const key = GOAL_ICONS[name.toLowerCase().trim()] || "vacation";
  return (
    <img
      src={`/images/icons/${key}.png`}
      alt={name}
      className={cn(
        "h-12 w-12 shrink-0 rounded-[12px] border object-contain",
        "border-transparent bg-[var(--arn-bg-2)]"
      )}
    />
  );
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
                  <div className="h-12 w-12 animate-pulse rounded-[12px] bg-[var(--arn-bg-2)]" />
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
                  <div className="flex shrink-0 items-center justify-center">
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
