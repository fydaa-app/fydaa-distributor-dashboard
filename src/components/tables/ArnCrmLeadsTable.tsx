"use client";

import type { ArnLead, LeadStatus } from "@/types/arnLead";

interface ArnCrmLeadsTableProps {
  leads: ArnLead[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit?: (lead: ArnLead) => void;
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-[var(--arn-blue-sel-bg)] text-[var(--arn-blue)] border-[var(--arn-blue)]" },
  "in-progress": { label: "In Progress", className: "bg-[var(--arn-amber-sel-bg)] text-[var(--arn-amber)] border-[var(--arn-amber)]" },
  converted: { label: "Converted", className: "bg-[var(--arn-green-sel-bg)] text-[var(--arn-green)] border-[var(--arn-green)]" },
  lost: { label: "Lost", className: "bg-[var(--arn-red-sel-bg)] text-[var(--arn-red)] border-[var(--arn-red)]" },
};

function formatCurrency(value: number | null): string {
  if (!value || value === 0) return "₹0";
  if (value < 100000) return `₹${Math.round(value).toLocaleString("en-IN")}`;
  if (value < 10000000) {
    const lakhs = value / 100000;
    return `₹${Math.round(lakhs * 10) / 10} L`;
  }
  const crores = value / 10000000;
  return `₹${Math.round(crores * 10) / 10} Cr`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

export default function ArnCrmLeadsTable({
  leads,
  total,
  page,
  pageSize,
  onPageChange,
  onEdit,
}: ArnCrmLeadsTableProps) {
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
  const end = Math.min(total, page * pageSize);

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
      <div className="-mx-5 overflow-x-auto">
        <table className="min-w-[1200px] w-full table-fixed border-collapse text-left text-sm [&_tbody_tr:nth-child(odd)]:bg-[var(--arn-bg-2)] [&_tbody_tr:nth-child(even)]:bg-[var(--arn-bg)]">
          <thead>
            <tr>
              <th className="w-[18%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Lead Name</th>
              <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Contact</th>
              <th className="w-[9%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Source</th>
              <th className="w-[10%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Status</th>
              <th className="w-[9%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Potential</th>
              <th className="w-[9%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Invested</th>
              <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Next Follow-up</th>
              <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Assigned To</th>
              <th className="w-[9%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const statusCfg = statusConfig[lead.status as LeadStatus] || statusConfig.new;
              return (
                <tr key={lead.id} className="transition-colors">
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--arn-avatar-bg)] text-xs font-black text-[var(--arn-avatar-txt)]">
                        {getInitials(lead.name)}
                      </div>
                      <div>
                        <span className="truncate font-bold block">{lead.name}</span>
                        {lead.email && <span className="truncate text-xs text-[var(--arn-txt-3)] block">{lead.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">
                    {lead.mobileNumber}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)] capitalize">
                    {lead.source?.replace(/-/g, " ") || "-"}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                    {formatCurrency(lead.potentialInvestment)}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                    {formatCurrency(lead.convertedAmount)}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">
                    {formatDate(lead.nextFollowUpAt)}
                    {lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < new Date() && (
                      <span className="ml-1 text-[var(--arn-red)]"> (Overdue)</span>
                    )}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">
                    {lead.assignedToName || lead.assignedToId ? (
                      <span>{lead.assignedToName || `User ${lead.assignedToId}`}</span>
                    ) : (
                      <span className="text-[var(--arn-txt-4)]">Unassigned</span>
                    )}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(lead)}
                          className="p-1.5 rounded-[8px] text-[var(--arn-txt-3)] hover:bg-[var(--arn-bg-2)] hover:text-[var(--arn-amber)] transition-colors"
                          title="Edit lead"
                        >
                          <i aria-hidden="true" className="ti ti-edit h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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