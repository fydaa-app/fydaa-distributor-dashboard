"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnCrmLeadsTable from "@/components/tables/ArnCrmLeadsTable";
import ArnPartnerLeadStatsKpis from "@/components/leads/ArnPartnerLeadStatsKpis";
import LeadModal from "@/components/leads/LeadModal";
import { fetchPartnerLeads, createPartnerLead, updatePartnerLead, fetchPartnerLeadStats } from "@/services/arnLeadService";
import type { ArnLead, CreateLeadPayload, PartnerLeadStats, UpdateLeadPayload } from "@/types/arnLead";
import { LeadStatus, LeadSource } from "@/types/arnLead";

const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: LeadStatus.NEW, label: "New" },
  { value: LeadStatus.IN_PROGRESS, label: "In Progress" },
  { value: LeadStatus.CONVERTED, label: "Converted" },
  { value: LeadStatus.LOST, label: "Lost" },
];

const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: LeadSource.WEBSITE, label: "Website" },
  { value: LeadSource.REFERRAL, label: "Referral" },
  { value: LeadSource.WALK_IN, label: "Walk In" },
  { value: LeadSource.PHONE, label: "Phone" },
  { value: LeadSource.EMAIL, label: "Email" },
  { value: LeadSource.SOCIAL_MEDIA, label: "Social Media" },
  { value: LeadSource.EVENT, label: "Event" },
  { value: LeadSource.OTHER, label: "Other" },
];

export default function ArnCrmLeadsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "">("");
  const page = Number(searchParams.get("page")) || 1;
  const lastSearch = useRef(debouncedSearch);

  const setPage = useCallback(
    (next: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(next));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    if (!searchParams.get("page")) {
      setPage(1);
    }
  }, [searchParams, setPage]);

  const [leads, setLeads] = useState<ArnLead[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<PartnerLeadStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<ArnLead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchPartnerLeads({
        page,
        search: debouncedSearch,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        type: "individual",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });

      setLeads(response.leads || []);
      setTotal(response.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leads.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, statusFilter, sourceFilter]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchPartnerLeadStats();
      setStats(data);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (lastSearch.current !== debouncedSearch) {
      lastSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch, setPage]);

  const handleSubmit = async (data: CreateLeadPayload | UpdateLeadPayload) => {
    setIsSubmitting(true);
    try {
      if (leadToEdit) {
        await updatePartnerLead(leadToEdit.id, data);
      } else {
        await createPartnerLead(data as CreateLeadPayload);
      }
      setIsModalOpen(false);
      setLeadToEdit(null);
      loadLeads();
      loadStats();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setLeadToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (lead: ArnLead) => {
    setLeadToEdit(lead);
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <ArnCardHeader title="Sales CRM" />
<button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-[10px] bg-[var(--arn-amber)] px-4 py-2 text-sm font-semibold text-[var(--arn-white)] hover:opacity-90 transition-opacity"
            >
              <i aria-hidden="true" className="ti ti-plus h-5 w-5" />
              New Lead
            </button>
        </div>

        <div className="mb-5">
          <ArnPartnerLeadStatsKpis
            stats={stats}
            isLoading={statsLoading}
            error={statsError}
            retry={loadStats}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-4 mb-5">
          <div className="relative">
            <i
              aria-hidden="true"
              className="ti ti-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--arn-txt-3)]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leads by name, email, mobile..."
              className="h-12 w-full rounded-[10px] border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] pl-12 pr-4 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors placeholder:text-[var(--arn-txt-3)] focus:border-[var(--arn-amber)] focus:bg-[var(--arn-bg)]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
            className="h-12 w-full rounded-[10px] border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] pl-4 pr-10 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors appearance-none focus:border-[var(--arn-amber)] focus:bg-[var(--arn-bg)]"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as LeadSource | "")}
            className="h-12 w-full rounded-[10px] border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] pl-4 pr-10 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors appearance-none focus:border-[var(--arn-amber)] focus:bg-[var(--arn-bg)]"
          >
            <option value="">All Sources</option>
            {sourceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-[var(--arn-txt-3)]">
            <span>{leads.length} leads</span>
            {total > 0 && <span>| Total: {total}</span>}
          </div>
        </div>

        {error ? (
          <ArnErrorState title="Could not load leads" message={error} retry={loadLeads} />
        ) : isLoading ? (
          <div className="overflow-hidden rounded-[16px] border border-[var(--arn-bdr)]">
            {skeletonRows.map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-20 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <ArnEmptyState
              title="No leads found"
              description="Create your first lead or adjust your filters to find existing leads."
            />
          </div>
        ) : (
          <ArnCrmLeadsTable
            leads={leads}
            total={total}
            page={page}
            pageSize={10}
            onPageChange={setPage}
            onEdit={handleEdit}
          />
        )}
      </div>

      <LeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setLeadToEdit(null);
        }}
        onSubmit={handleSubmit}
        leadToEdit={leadToEdit}
        isLoading={isSubmitting}
      />
    </div>
  );
}