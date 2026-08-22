"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  searchFunds,
  searchAllFunds,
  type FundOption,
} from "@/services/arnStockApi";

const RECENT_KEY = "arn_fund_search_recent";
const MAX_RECENT = 10;

const CHIPS = [
  { label: "All", value: "__all__" },
  { label: "Equity", value: "IndianStock" },
  { label: "Liquid", value: "Liquid" },
  { label: "Debt", value: "FixedIncomeBonds" },
];

interface ArnFundSearchBarProps {
  onSelect: (fund: FundOption, chipLabel: string) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function getFundTitle(fund: FundOption): string {
  if (fund.schemeName) return fund.schemeName;
  if (fund.fundName) return fund.fundName;
  if (fund.stockName) return fund.stockName;
  if (fund.name) return fund.name;
  return "Unknown Fund";
}

function hasFundIdentity(fund: FundOption): boolean {
  return !!(fund.ticker || fund.scheme || fund.isin || fund.schemeCode);
}

function getFundIdentity(fund: FundOption): string {
  return fund.ticker || fund.scheme || fund.isin || fund.schemeCode || "";
}

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const recent = loadRecentSearches();
    const filtered = recent.filter((q) => q !== query.trim());
    filtered.unshift(query.trim());
    const trimmed = filtered.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

function extractItems(
  response: unknown,
  isAllChip: boolean,
  chipLabel: string
): { title: string; subtitle: string; identity: string; raw: FundOption }[] {
  if (!response || typeof response !== "object") return [];

  const obj = response as Record<string, unknown>;
  const rawItems =
    obj.items ??
    obj.data ??
    obj.funds ??
    obj.results ??
    obj.schemes ??
    obj.list ??
    null;

  if (!Array.isArray(rawItems)) return [];

  const subtitle = isAllChip ? "Market" : chipLabel;

  return rawItems
    .filter((item) => {
      const fund = item as FundOption;
      if (isAllChip) {
        const name = fund.name || fund.schemeName || "";
        const isin = fund.ticker || fund.scheme || fund.isin;
        return !!name && !!isin;
      }
      return hasFundIdentity(fund);
    })
    .map((item) => {
      const fund = item as FundOption;
      const title = getFundTitle(fund);
      const identity = getFundIdentity(fund);
      return { title, subtitle, identity, raw: fund };
    });
}

export default function ArnFundSearchBar({ onSelect }: ArnFundSearchBarProps) {
  const [activeChipValue, setActiveChipValue] = useState<string>("__all__");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ title: string; subtitle: string; identity: string; raw: FundOption }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const debouncedQuery = useDebounce(query, 300);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAllChip = useMemo(() => activeChipValue === "__all__", [activeChipValue]);
  const stockType = useMemo(() => (isAllChip ? null : activeChipValue), [isAllChip, activeChipValue]);

  const activeChipLabel = useMemo(() => {
    const found = CHIPS.find((c) => c.value === activeChipValue);
    return found?.label || "All";
  }, [activeChipValue]);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    const queryToUse = debouncedQuery;

    if (queryToUse.length === 0) {
      setResults([]);
      setError(null);
      return;
    }

    if (queryToUse.length === 1) {
      setResults([]);
      setError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsSearching(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchPromise = isAllChip
      ? searchAllFunds({
          search: queryToUse,
          page: 0,
          limit: 20,
        })
      : searchFunds({
          stockType: stockType!,
          search: queryToUse,
          page: 1,
          limit: 20,
        });

    fetchPromise
      .then((response) => {
        if (currentRequestId !== requestIdRef.current) return;
        const items = extractItems(response, isAllChip, activeChipLabel);
        setResults(items);
        if (items.length === 0) {
          setError("No funds found");
        }
      })
      .catch((err) => {
        if (currentRequestId !== requestIdRef.current) return;
        if (err instanceof Error && err.name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "Unable to search funds";
        if (message.includes("Failed") || message.includes("Unable")) {
          setError(message);
        } else {
          setError("Unable to search funds");
        }
        setResults([]);
      })
      .finally(() => {
        if (currentRequestId === requestIdRef.current) {
          setIsSearching(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, isAllChip, stockType, activeChipLabel]);

  const handleChipChange = useCallback((chipValue: string) => {
    setActiveChipValue(chipValue);
    setQuery("");
    setResults([]);
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleRecentClick = useCallback((recentQuery: string) => {
    setQuery(recentQuery);
    inputRef.current?.focus();
  }, []);

  const handleFundSelect = useCallback(
    (fund: FundOption) => {
      saveRecentSearch(query);
      setQuery("");
      setResults([]);
      onSelect(fund, activeChipLabel);
    },
    [query, activeChipLabel, onSelect]
  );

  const showRecent = query.length === 0 && !isSearching && recentSearches.length > 0;
  const showEmptyState = query.length >= 2 && !isSearching && results.length === 0 && !error;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--arn-txt-3)]">
          Search fund
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleChipChange(chip.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                activeChipValue === chip.value
                  ? "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white"
                  : "border-[var(--arn-bdr)] bg-[var(--arn-bg)] text-[var(--arn-txt-2)] hover:border-[var(--arn-bdr-2)]"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fund by name, AMC, or ISIN..."
          className={cn(
            "w-full rounded-[12px] border bg-[var(--arn-bg)] px-4 py-3 text-sm font-medium text-[var(--arn-txt)] outline-none transition-colors placeholder:text-[var(--arn-txt-3)]",
            results.length > 0 || showRecent || showEmptyState
              ? "border-[var(--arn-bdr)]"
              : "border-[var(--arn-bdr)]"
          )}
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--arn-amber)] border-t-transparent" />
          </div>
        )}
      </div>

      {showRecent && (
        <div className="flex flex-wrap gap-2">
          {recentSearches.map((recent) => (
            <button
              key={recent}
              type="button"
              onClick={() => handleRecentClick(recent)}
              className="rounded-full border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--arn-txt-2)] transition-all hover:border-[var(--arn-bdr-2)] hover:text-[var(--arn-txt)]"
            >
              {recent}
            </button>
          ))}
        </div>
      )}

      {query.length > 0 && query.length < 2 && !isSearching && (
        <div className="text-xs text-[var(--arn-txt-3)]">
          Type at least 2 characters to search
        </div>
      )}

      {error && !isSearching && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {showEmptyState && !error && (
        <div className="rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4 text-center text-sm text-[var(--arn-txt-3)]">
          No funds found
        </div>
      )}

      {(results.length > 0 || isSearching) && (
        <div
          className={cn(
            "max-h-[300px] overflow-y-auto rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)]"
          )}
        >
          {isSearching && results.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--arn-txt-3)]">
              Searching...
            </div>
          ) : (
            results.map((result, idx) => (
              <button
                key={result.identity || idx}
                type="button"
                onClick={() => handleFundSelect(result.raw)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--arn-amber-bg)] border-t border-[var(--arn-bdr)] first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[var(--arn-txt)]">
                    {result.title}
                  </div>
                  <div className="truncate text-xs text-[var(--arn-txt-3)]">
                    {result.subtitle}
                  </div>
                </div>
                {result.identity && (
                  <span className="ml-3 shrink-0 truncate text-xs text-[var(--arn-txt-3)]">
                    {result.identity}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
