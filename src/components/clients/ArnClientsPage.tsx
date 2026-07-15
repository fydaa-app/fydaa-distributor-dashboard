"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnClientsKpis from "@/components/clients/ArnClientsKpis";
import ArnClientsToolbar from "@/components/clients/ArnClientsToolbar";
import ArnClientTable from "@/components/tables/ArnClientTable";
import { fetchClients } from "@/services/arnClientsService";
import type {
  ArnClient,
  ArnClientsKpis as ArnClientsKpisType,
} from "@/types/arnClient";

const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

export default function ArnClientsPage() {
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
  const [clients, setClients] = useState<ArnClient[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ArnClientsKpisType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchClients({
        search: debouncedSearch,
        page,
        pageSize: 5,
        type: "individual",
      });

      setClients(response.items);
      setTotal(response.total);
      setSummary(response.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load clients.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (lastSearch.current !== debouncedSearch) {
      lastSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch, setPage]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ArnClientsKpis
        summary={summary}
        isLoading={isLoading}
        error={error}
        retry={loadClients}
      />

      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <ArnCardHeader title="All clients">
          <Link
            href="/arn-onboard"
            className="inline-flex items-center justify-center gap-1 rounded-[8px] bg-[var(--arn-amber)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <i aria-hidden="true" className="ti ti-plus" />
            Add
          </Link>
        </ArnCardHeader>

        <div className="mb-5">
          <ArnClientsToolbar search={search} onSearchChange={setSearch} />
        </div>

        {error ? (
          <ArnErrorState
            title="Could not load clients"
            message={error}
            retry={loadClients}
          />
        ) : isLoading ? (
          <div className="overflow-hidden rounded-[16px] border border-[var(--arn-bdr)]">
            {skeletonRows.map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <ArnEmptyState
              title="No clients found"
              description="Try changing your search to find the client you are looking for."
            />
          </div>
        ) : (
          <ArnClientTable
            clients={clients}
            total={total}
            page={page}
            pageSize={5}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
