"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import { getGoalSetupClients, type GoalSetupClient } from "@/services/arnGoalSetupService";
import ArnStatusTag from "@/components/common/ArnStatusTag";

interface ArnClientSelectorProps {
  onSelect: (client: GoalSetupClient) => void;
  selectedClientId?: number | null;
  onSearchChange?: (search: string) => void;
  onPageChange?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

export default function ArnClientSelector({ onSelect, selectedClientId, onSearchChange, onPageChange }: ArnClientSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const page = Number(searchParams.get("page")) || 1;
  const lastSearch = useRef(debouncedSearch);
  const lastPage = useRef(page);

  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayClients, setDisplayClients] = useState<GoalSetupClient[]>([]);

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

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getGoalSetupClients({
        search: debouncedSearch,
        page,
        limit: 5,
      });

      setTotal(response.total);
      setDisplayClients(response.users);
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

  useEffect(() => {
    if (lastPage.current !== page) {
      lastPage.current = page;
      onPageChange?.();
    }
  }, [page, onPageChange]);

  const totalPages = Math.max(1, Math.ceil(total / 5));
  const start = total === 0 ? 0 : (page - 1) * 5 + 1;
  const end = Math.min(total, page * 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-4 py-0 transition-colors focus-within:border-[var(--arn-amber)] focus-within:shadow-[0_0_0_3px_var(--arn-input-ring)]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="shrink-0 text-[var(--arn-txt-3)]"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            onSearchChange?.(event.target.value);
          }}
          placeholder="Search by name or mobile..."
          className="h-[48px] flex-1 bg-transparent text-sm font-semibold text-[var(--arn-txt)] outline-none placeholder:text-[var(--arn-txt-3)] placeholder:font-normal caret-[var(--arn-amber)]"
        />
      </div>

      {error ? (
        <div className="py-8">
          <ArnErrorState
            title="Could not load clients"
            message={error}
            retry={loadClients}
          />
        </div>
      ) : isLoading && displayClients.length === 0 ? (
        <div className="space-y-2">
          {skeletonRows.map((row) => (
            <div
              key={row}
              className="flex items-center gap-3 rounded-[12px] border border-transparent bg-transparent p-3 sm:p-4"
            >
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
              <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
              <div className="h-5 w-5 shrink-0 animate-pulse rounded-full border-2 border-[var(--arn-bdr)]" />
            </div>
          ))}
        </div>
      ) : !isLoading && total === 0 ? (
        <div className="py-8">
          <ArnEmptyState
            title="No clients found"
            description="Try changing your search to find the client you are looking for."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {displayClients.map((client) => {
            const isSelected = selectedClientId === client.userId;

            return (
              <button
                key={client.userId}
                type="button"
                onClick={() => onSelect(client)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(client);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[10px] border p-3 text-left transition-colors sm:p-4 sm:gap-4",
                  isSelected
                    ? "border-[var(--arn-amber)] bg-[var(--arn-amber-sel-bg)]"
                    : "border-transparent bg-transparent hover:border-[var(--arn-bdr)] hover:bg-[var(--arn-bg)]"
                )}
              >
                <ArnClientAvatar
                  initials={getInitials(client.name)}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-bold text-[var(--arn-txt)]">{client.name}</div>
                  <div className="mt-0.5 text-xs text-[var(--arn-txt-3)]">
                    {client.mobileNumber}
                  </div>
                </div>
                <ArnStatusTag
                  label={client.mandateStatus}
                  variant={client.mandateStatus.toUpperCase() === "APPROVED" ? "active" : client.mandateStatus.toUpperCase() === "CANCELLED" ? "cancelled" : "pending"}
                />
                <div
                  className={cn(
                    "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white"
                      : "border-[var(--arn-bdr)]"
                  )}
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center gap-2 pt-3 text-xs text-[var(--arn-txt-3)]">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
            className="grid size-8 place-items-center rounded-[8px] border border-[var(--arn-bdr)] transition-colors hover:bg-[var(--arn-bg-2)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <i aria-hidden="true" className="ti ti-chevron-left" />
          </button>
          <span className="min-w-[60px] text-center">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            className="grid size-8 place-items-center rounded-[8px] border border-[var(--arn-bdr)] transition-colors hover:bg-[var(--arn-bg-2)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <i aria-hidden="true" className="ti ti-chevron-right" />
          </button>
          <span className="ml-1">
            Showing {start} of {end}
          </span>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
