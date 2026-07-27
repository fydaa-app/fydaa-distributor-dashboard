import type { ArnLead } from "@/types/arnLead";

interface ArnLeadsTableProps {
  leads: ArnLead[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function formatCurrency(value: number): string {
  if (value === 0) return "₹0";
  if (value < 100000) return `₹${Math.round(value).toLocaleString("en-IN")}`;
  if (value < 10000000) {
    const lakhs = value / 100000;
    return `₹${Math.round(lakhs * 10) / 10} L`;
  }
  const crores = value / 10000000;
  return `₹${Math.round(crores * 10) / 10} Cr`;
}

export default function ArnLeadsTable({
  leads,
  total,
  page,
  pageSize,
  onPageChange,
}: ArnLeadsTableProps) {
  if (total === 0) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
        <div className="py-10 text-center text-sm text-[var(--arn-txt-3)]">
          No leads found
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  //const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="w-[24%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">User Name</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Mobile Number</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Manager Name</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">NetWorth</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Onboarding Date</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.userId} className="transition-colors hover:[&_td]:bg-[var(--arn-bg-2)]">
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--arn-amber)]/10 text-xs font-black text-[var(--arn-amber)]">
                      {lead.userName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?"}
                    </div>
                    <span className="truncate font-bold">{lead.userName}</span>
                  </div>
                </td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">{lead.mobileNumber}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">{lead.managerName}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">{formatCurrency(lead.netWorth)}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">
                  {new Date(lead.onboardingDate).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-[var(--arn-txt-3)]">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="disabled:cursor-not-allowed disabled:opacity-40"
        >
          <i aria-hidden="true" className="ti ti-chevron-left" />
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="disabled:cursor-not-allowed disabled:opacity-40"
        >
          <i aria-hidden="true" className="ti ti-chevron-right" />
        </button>
        <span className="ml-2">Showing {end} of {total}</span>
      </div>
    </div>
  );
}
