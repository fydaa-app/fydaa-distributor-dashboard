"use client";

import { useMemo } from "react";
import ArnFilterPill from "@/components/common/ArnFilterPill";
import type { ArnSipBookFilter, ArnSipBookItem } from "@/types/arnSipBook";

interface ArnSipBookFiltersProps {
  active: ArnSipBookFilter;
  onChange: (status: ArnSipBookFilter) => void;
  sips?: ArnSipBookItem[];
}

function getActiveFilteredSips(sips: ArnSipBookItem[]): ArnSipBookItem[] {
  return sips.filter((sip) => sip.status === "active" || sip.status === "due-today");
}

export default function ArnSipBookFilters({ active, onChange, sips = [] }: ArnSipBookFiltersProps) {
  const counts = useMemo(() => {
    const all = sips.length;
    const activeCount = getActiveFilteredSips(sips).length;
    const atRiskCount = sips.filter((sip) => sip.status === "at-risk").length;
    const pausedCount = sips.filter((sip) => sip.status === "paused").length;
    return { all, active: activeCount, atRisk: atRiskCount, paused: pausedCount };
  }, [sips]);

  const filters: Array<{ label: string; value: ArnSipBookFilter }> = [
    { label: `All (${counts.all})`, value: "all" },
    { label: `Active (${counts.active})`, value: "active" },
    { label: `At risk (${counts.atRisk})`, value: "at-risk" },
    { label: `Paused (${counts.paused})`, value: "paused" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <ArnFilterPill
          key={filter.value}
          label={filter.label}
          active={active === filter.value}
          onClick={() => onChange(filter.value)}
        />
      ))}
    </div>
  );
}
