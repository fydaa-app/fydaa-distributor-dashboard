"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnLeadsTable from "@/components/tables/ArnLeadsTable";
import { fetchLeads } from "@/services/arnLeadService";
import type { ArnLead } from "@/types/arnLead";

const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

export default function ArnLeadsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchLeads({
        page,
        search: debouncedSearch,
        type: "individual",
      });

      setLeads(response.users || []);
      setTotal(response.totalUsers || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leads.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (lastSearch.current !== debouncedSearch) {
      lastSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch, setPage]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <ArnCardHeader title="Leads" />

        <div className="mb-5">
          <div className="relative">
            <i
              aria-hidden="true"
              className="ti ti-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--arn-txt-3)]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leads"
              className="h-12 w-full rounded-[10px] border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] pl-12 pr-4 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors placeholder:text-[var(--arn-txt-3)] focus:border-[var(--arn-amber)] focus:bg-[var(--arn-bg)]"
            />
          </div>
        </div>

        {error ? (
          <ArnErrorState
            title="Could not load leads"
            message={error}
            retry={loadLeads}
          />
        ) : isLoading ? (
          <div className="overflow-hidden rounded-[16px] border border-[var(--arn-bdr)]">
            {skeletonRows.map((row) => (
              <div
                key={row}
                className="flex items-center gap-4 border-b border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4"
              >
                <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <ArnEmptyState
              title="No leads found"
              description="Try changing your search to find the lead you are looking for."
            />
          </div>
        ) : (
          <ArnLeadsTable
            leads={leads}
            total={total}
            page={page}
            pageSize={10}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
