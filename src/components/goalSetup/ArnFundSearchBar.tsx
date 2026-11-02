"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchAllFunds, type FundOption } from "@/services/arnStockApi";

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

function getFundIdentity(fund: FundOption): string {
  return fund.ticker || fund.scheme || fund.isin || fund.schemeCode || "";
}

function toCamelCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractItems(
  response: unknown
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

  return rawItems
    .filter((item) => {
      const fund = item as FundOption;
      const name = fund.name || fund.schemeName || fund.stockName || "";
      const isin = fund.ticker || fund.scheme || fund.isin;
      return !!name && !!isin;
    })
    .map((item) => {
      const row = item as FundOption & Record<string, unknown>;
      const resolvedId =
        Number(row.localMfId ?? row.selectedMfId ?? row.mfId ?? row.id) || null;
      const fund: FundOption = {
        ...row,
        id: resolvedId,
        selectedMfId: resolvedId,
        localMfId: resolvedId,
        mfId: resolvedId,
        schemeName: row.schemeName || row.stockName || row.name || "",
        fundName: row.fundName || row.stockName || row.name || "",
        stockName: row.stockName || row.name || row.schemeName || "",
        ticker: row.ticker || row.isin || row.scheme || "",
        scheme: row.scheme || row.ticker || row.isin || "",
        isin: row.isin || row.ticker || row.scheme || "",
        schemeCode: row.schemeCode || "",
        sipAllowed: row.sipAllowed !== false && row.sip_allowed !== false,
        purchaseAllowed:
          row.purchaseAllowed !== false && row.purchase_allowed !== false,
        minInitialInvestment:
          row.minInitialInvestment ??
          (typeof row.min_initial_investment === "number"
            ? row.min_initial_investment
            : undefined),
        minSipAmount:
          row.minSipAmount ??
          (typeof row.min_sip_amount === "number" ? row.min_sip_amount : undefined),
      };
      const title = getFundTitle(fund);
      const identity = getFundIdentity(fund);
      const subtitle = fund.fund_category
        ? toCamelCase(fund.fund_category)
        : "Market";
      return { title, subtitle, identity, raw: fund };
    });
}

export default function ArnFundSearchBar({ onSelect }: ArnFundSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { title: string; subtitle: string; identity: string; raw: FundOption }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const queryToUse = debouncedQuery;

    if (queryToUse.length < 2) {
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

    searchAllFunds({
      search: queryToUse,
      page: 0,
      limit: 20,
    })
      .then((response) => {
        if (currentRequestId !== requestIdRef.current) return;
        const items = extractItems(response);
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
  }, [debouncedQuery]);

  const handleFundSelect = useCallback(
    (fund: FundOption) => {
      setQuery("");
      setResults([]);
      onSelect(fund, "All");
    },
    [onSelect]
  );

  const showEmptyState =
    query.length >= 2 && !isSearching && results.length === 0 && !error;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--arn-txt-3)]">
          Search fund
        </div>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fund by name, AMC, or ISIN..."
          className="w-full rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-4 py-3 text-sm font-medium text-[var(--arn-txt)] outline-none transition-colors placeholder:text-[var(--arn-txt-3)]"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--arn-amber)] border-t-transparent" />
          </div>
        )}
      </div>

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
        <div className="max-h-[300px] overflow-y-auto rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)]">
          {results.map((item, index) => (
            <button
              key={`${item.identity}-${index}`}
              type="button"
              onClick={() => handleFundSelect(item.raw)}
              className="flex w-full items-start justify-between gap-3 border-b border-[var(--arn-bdr)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--arn-bg-2)]"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--arn-txt)]">
                  {item.title}
                </div>
                <div className="mt-0.5 text-xs text-[var(--arn-txt-3)]">
                  {item.subtitle}
                  {item.identity ? ` · ${item.identity}` : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
