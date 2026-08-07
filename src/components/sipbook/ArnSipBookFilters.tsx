"use client";

import ArnFilterPill from "@/components/common/ArnFilterPill";
import type { ArnSipBookFilter } from "@/types/arnSipBook";

interface ArnSipBookFiltersProps {
  active: ArnSipBookFilter;
  onChange: (status: ArnSipBookFilter) => void;
  filterCounts?: Record<string, number> | null;
}

export default function ArnSipBookFilters({ active, onChange, filterCounts }: ArnSipBookFiltersProps) {
  const counts = {
    all: filterCounts?.all ?? 0,
    active: filterCounts?.active ?? 0,
    inactive: filterCounts?.inactive ?? 0,
    cancelled: filterCounts?.cancelled ?? 0,
    sipsAtRisk: filterCounts?.sips_at_risk ?? 0,
  };

  const filters: Array<{ label: string; value: ArnSipBookFilter }> = [
    { label: `All (${counts.all})`, value: "all" },
    { label: `Active (${counts.active})`, value: "active" },
    { label: `Pending (${counts.inactive})`, value: "inactive" },
    { label: `Cancelled (${counts.cancelled})`, value: "cancelled" },
    { label: `SIPs at risk (${counts.sipsAtRisk})`, value: "sips_at_risk" },
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
