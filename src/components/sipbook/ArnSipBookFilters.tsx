"use client";

import ArnFilterPill from "@/components/common/ArnFilterPill";
import type { ArnSipBookFilter } from "@/types/arnSipBook";

interface ArnSipBookFiltersProps {
  active: ArnSipBookFilter;
  onChange: (status: ArnSipBookFilter) => void;
}

const filters: Array<{ label: string; value: ArnSipBookFilter }> = [
  { label: "All (62)", value: "all" },
  { label: "Active (54)", value: "active" },
  { label: "At risk (3)", value: "at-risk" },
  { label: "Paused (5)", value: "paused" },
];

export default function ArnSipBookFilters({ active, onChange }: ArnSipBookFiltersProps) {
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
