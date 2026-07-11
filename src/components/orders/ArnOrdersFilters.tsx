import ArnFilterPill from "@/components/common/ArnFilterPill";
import type { ArnOrderFilter, ArnOrderStatus } from "@/types/arnOrders";

interface ArnOrdersFiltersProps {
  activeFilter: ArnOrderFilter;
  activeStatus: ArnOrderStatus | "all";
  onFilterChange: (filter: ArnOrderFilter) => void;
  onStatusChange: (status: ArnOrderStatus | "all") => void;
}

const filters: Array<{ label: string; value: ArnOrderFilter }> = [
  { label: "All", value: "all" },
  { label: "SIP", value: "sip" },
  { label: "Lumpsum", value: "lumpsum" },
  { label: "Redemption", value: "redemption" },
  { label: "Failed", value: "failed" },
];

// const statuses: Array<{ label: string; value: ArnOrderStatus | "all" }> = [
//   { label: "All status", value: "all" },
//   { label: "Done", value: "done" },
//   { label: "Pending", value: "pending" },
//   { label: "Processing", value: "processing" },
//   { label: "Failed", value: "failed" },
// ];

export default function ArnOrdersFilters({
  activeFilter,
  onFilterChange,
}: ArnOrdersFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <ArnFilterPill
            key={filter.value}
            label={filter.label}
            active={activeFilter === filter.value}
            onClick={() => onFilterChange(filter.value)}
          />
        ))}
      </div>
    </div>
  );
}
