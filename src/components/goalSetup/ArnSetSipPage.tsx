"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { calculateProjectedCorpus } from "@/lib/sipMath";
import { type DirectProduct } from "@/components/goalSetup/ArnDirectProductSelector";
import { type GoalSetupClient } from "@/services/arnGoalSetupService";
import { searchFunds, getRecommendedPortfolio, type GoalResponse } from "@/services/arnStockApi";
import type { FundOption, RecommendedPortfolioResponse } from "@/services/arnStockApi";

export interface ArnSetSipPageRef {
  getConfig: () => {
    sipAmount: number;
    frequency: "daily" | "monthly";
    tenure: number;
    selectedFund: string;
    selectedScheme: string | null;
    selectedMfId: number | null;
    lumpSumEnabled: boolean;
    lumpSumAmount: number;
    expectedCagr: number;
  };
}

interface ArnSetSipPageProps {
  selectedClient: GoalSetupClient | null;
  selectedGoal: GoalResponse | null;
  selectedProduct: DirectProduct | null;
  mode: "goal" | "direct";
  onBack: () => void;
  onConfigChange?: (config: ReturnType<ArnSetSipPageRef["getConfig"]>) => void;
}

function formatRupee(n: number): string {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(1) + "Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + "L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(0) + "K";
  return "₹" + n.toLocaleString("en-IN");
}

function formatRupeeFull(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

const AMOUNT_LIMITS: Record<"daily" | "monthly", { min: number; max: number; step: number }> = {
  daily: { min: 100, max: 1000, step: 50 },
  monthly: { min: 1000, max: 100000, step: 500 },
};

const TENURE_OPTIONS: Record<"daily" | "monthly", number[]> = {
  daily: [1, 2, 3, 4],
  monthly: [3, 5, 10, 20, 30],
};

const AMOUNT_PICKS: Record<"daily" | "monthly", number[]> = {
  daily: [100, 200, 300, 500, 700, 1000],
  monthly: [1000, 5000, 10000, 25000, 50000, 100000],
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const ArnSetSipPage = forwardRef<ArnSetSipPageRef, ArnSetSipPageProps>(
  function ArnSetSipPage({ selectedClient, selectedGoal, selectedProduct, mode, onBack, onConfigChange }, ref) {
    const isGoalMode = mode === "goal" && selectedGoal != null;
    const product = isGoalMode
      ? {
          key: selectedGoal.name.toLowerCase().replace(/\s+/g, "-"),
          name: selectedGoal.name,
          assumedCagr: "12%",
          goalId: selectedGoal.id,
          stockType: "IndianStock",
          defAmt: Math.max(selectedGoal.goalAmountMin, 1000),
          defTenure: Math.round(selectedGoal.tenureMin / 12),
          tenures: Array.from({ length: Math.round(selectedGoal.tenureMax / 12) - Math.round(selectedGoal.tenureMin / 12) + 1 }, (_, i) => Math.round(selectedGoal.tenureMin / 12) + i),
          defFund: "",
        }
      : selectedProduct ?? {
          key: "equity",
          name: "Equity",
          assumedCagr: "12%",
          goalId: 36,
          stockType: "IndianStock",
          defAmt: 10000,
          defTenure: 10,
          tenures: [3, 5, 10, 20, 30],
          defFund: "HDFC Flexi Cap Fund — Direct Plan — Growth",
        };

    const [sipAmount, setSipAmount] = useState(product.defAmt);
    const [frequency, setFrequency] = useState<"daily" | "monthly">("monthly");
    const [tenure, setTenure] = useState(product.defTenure);
    const [fundMode, setFundMode] = useState<"rec" | "own">("rec");
    const [selectedFund, setSelectedFund] = useState(product.defFund);
    const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
    const [selectedMfId, setSelectedMfId] = useState<number | null>(null);
    const [lumpSumEnabled, setLumpSumEnabled] = useState(false);
    const [lumpSumAmount, setLumpSumAmount] = useState(50000);
    const [fundSearchQuery, setFundSearchQuery] = useState("");
    const [fundResults, setFundResults] = useState<FundOption[]>([]);
    const [isSearchingFunds, setIsSearchingFunds] = useState(false);
    const [recommendedPortfolio, setRecommendedPortfolio] =
      useState<RecommendedPortfolioResponse | null>(null);
    const [isLoadingRec, setIsLoadingRec] = useState(true);
    const [recError, setRecError] = useState<string | null>(null);

    const debouncedQuery = useDebounce(fundSearchQuery, 300);
    const searchRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<SVGSVGElement>(null);

    const clientName = selectedClient?.name ?? "the client";

    const expectedCagr = useMemo(() => {
      if (recommendedPortfolio?.portfolio?.expectedAnnualReturnPercent != null) {
        return recommendedPortfolio.portfolio.expectedAnnualReturnPercent / 100;
      }
      if (recommendedPortfolio?.goal?.expectedAnnualReturnPercent != null) {
        return recommendedPortfolio.goal.expectedAnnualReturnPercent / 100;
      }
      const cagrStr = product.assumedCagr.replace("%", "");
      const cagr = parseFloat(cagrStr);
      return isNaN(cagr) ? 0.12 : cagr / 100;
    }, [recommendedPortfolio, product.assumedCagr]);

    const projection = useMemo(() => {
      const corpus = calculateProjectedCorpus({
        sipAmount,
        frequency: isGoalMode ? "monthly" : frequency,
        tenure,
        expectedCagr,
      });
      const periodsPerYear = 12;
      const n = periodsPerYear * tenure;
      const invested = sipAmount * n;
      const gains = corpus - invested;
      const growth = invested > 0 ? (gains / invested) * 100 : 0;
      return {
        corpus: Math.round(corpus),
        invested: Math.round(invested),
        gains: Math.round(gains),
        growth: Math.round(growth),
      };
    }, [sipAmount, frequency, tenure, expectedCagr, isGoalMode]);

    const fundDisplayName = useMemo(() => {
      if (isGoalMode) {
        if (recommendedPortfolio?.schemeAllocations?.[0]?.stockName) {
          return recommendedPortfolio.schemeAllocations[0].stockName;
        }
        return selectedFund || "Loading recommended fund...";
      }
      if (fundMode === "rec") {
        if (recommendedPortfolio?.schemeAllocations?.[0]?.stockName) {
          return recommendedPortfolio.schemeAllocations[0].stockName;
        }
        return selectedFund.split(" —")[0] || selectedFund;
      }
      return selectedFund.split(" —")[0] || selectedFund;
    }, [isGoalMode, fundMode, selectedFund, recommendedPortfolio]);

    useEffect(() => {
      if (!selectedClient) return;

      let cancelled = false;
      setIsLoadingRec(true);
      setRecError(null);

      const goalId = isGoalMode ? selectedGoal!.id : product.goalId;

      getRecommendedPortfolio(selectedClient.userId, goalId)
        .then((data) => {
          if (!cancelled) {
            setRecommendedPortfolio(data);
            if (data?.schemeAllocations?.[0]?.stockName) {
              const primary = data.schemeAllocations[0];
              const stockName = primary.stockName || "";
              setSelectedFund(
                stockName || product.defFund
              );
              if (primary.mutualFundId) {
                setSelectedMfId(primary.mutualFundId);
              }
            }
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setRecError(err.message);
            setSelectedFund(product.defFund);
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoadingRec(false);
        });

      return () => {
        cancelled = true;
      };
    }, [selectedClient, selectedClient?.userId, isGoalMode, selectedGoal, selectedGoal?.id, product.goalId, product.defFund]);

    useEffect(() => {
      if (fundMode !== "own" || isGoalMode) {
        setFundResults([]);
        setFundSearchQuery("");
        return;
      }

      let cancelled = false;
      setIsSearchingFunds(true);

      searchFunds({
        stockType: product.stockType,
        search: debouncedQuery,
        page: 1,
        limit: 20,
      })
        .then((data) => {
          if (!cancelled) {
            setFundResults(data?.success && Array.isArray(data?.items) ? data.items : []);
          }
        })
        .catch(() => {
          if (!cancelled) setFundResults([]);
        })
        .finally(() => {
          if (!cancelled) setIsSearchingFunds(false);
        });

      return () => {
        cancelled = true;
      };
    }, [fundMode, debouncedQuery, product.stockType, isGoalMode]);

    useEffect(() => {
      if (!chartRef.current) return;
      const svg = chartRef.current;
      const W = 400;
      const H = 56;
      const periodsPerYear = isGoalMode ? 12 : frequency === "daily" ? 264 : 12;
      const n = periodsPerYear * tenure;
      const rPer = Math.pow(1 + expectedCagr, 1 / periodsPerYear) - 1;
      const pts: { x: number; y: number }[] = [];
      let v = 0;
      for (let i = 0; i <= n; i++) {
        v += sipAmount * (isGoalMode || frequency === "monthly" ? 1 : 30);
        v *= 1 + rPer;
        pts.push({ x: (i / n) * W, y: 4 + (1 - v / (projection.corpus || 1)) * (H - 8) });
      }
      const s2 = Math.max(1, Math.floor(n / 60));
      const fil = pts.filter((_, i) => i % s2 === 0 || i === pts.length - 1);
      const pathD =
        fil
          .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          .join(" ") +
        ` L${W},${H} L0,${H} Z`;
      const lineD = fil
        .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(" ");

      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.innerHTML = `
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(232,213,160,.25)"/>
            <stop offset="100%" stop-color="rgba(232,213,160,0)"/>
          </linearGradient>
        </defs>
        <path d="${pathD}" fill="url(#cg)"/>
        <path d="${lineD}" fill="none" stroke="rgba(232,213,160,.6)" stroke-width="1.5"/>
      `;
    }, [projection.corpus, sipAmount, frequency, tenure, expectedCagr, isGoalMode]);

    useImperativeHandle(ref, () => ({
      getConfig: () => ({
        sipAmount,
        frequency,
        tenure,
        selectedFund: fundDisplayName,
        selectedScheme,
        selectedMfId,
        lumpSumEnabled,
        lumpSumAmount,
        expectedCagr,
      }),
    }));

    useEffect(() => {
      onConfigChange?.({
        sipAmount,
        frequency: isGoalMode ? "monthly" : frequency,
        tenure,
        selectedFund: fundDisplayName,
        selectedScheme,
        selectedMfId,
        lumpSumEnabled,
        lumpSumAmount,
        expectedCagr,
      });
    }, [sipAmount, frequency, tenure, fundDisplayName, selectedScheme, selectedMfId, lumpSumEnabled, lumpSumAmount, expectedCagr, onConfigChange, isGoalMode]);

    useEffect(() => {
      if (isGoalMode) {
        setSipAmount(product.defAmt);
        setTenure(product.defTenure);
        return;
      }
      if (frequency === "daily") {
        setSipAmount(300);
        setTenure(1);
      } else {
        setSipAmount(1000);
        setTenure(5);
      }
    }, [frequency, isGoalMode, product.defAmt, product.defTenure]);

    const handleFundSelect = useCallback(
      (fund: FundOption) => {
        const displayName =
          fund.schemeName || fund.fundName || fund.stockName || "Unknown Fund";
        setSelectedFund(displayName);
        setSelectedScheme(fund.ticker || fund.scheme || fund.isin || fund.schemeCode || null);
        setSelectedMfId(fund.selectedMfId ?? fund.id ?? null);
        setFundSearchQuery("");
      },
      [setSelectedFund, setSelectedScheme, setSelectedMfId, setFundSearchQuery]
    );

    const amountLimits = isGoalMode ? AMOUNT_LIMITS.monthly : AMOUNT_LIMITS[frequency];

    const handleSliderChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSipAmount(Number(e.target.value));
      },
      []
    );

    const handleAmountBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        const val = raw ? Math.min(amountLimits.max, Math.max(amountLimits.min, Number(raw))) : amountLimits.min;
        setSipAmount(val);
      },
      [amountLimits.min, amountLimits.max]
    );

    const sliderPct = ((sipAmount - amountLimits.min) / (amountLimits.max - amountLimits.min)) * 100;
    const freqLabel = isGoalMode ? "per month" : frequency === "daily" ? "per day" : "per month";

    const tenureOptions = useMemo(() => {
      if (isGoalMode) {
        return product.tenures;
      }
      return TENURE_OPTIONS[frequency];
    }, [isGoalMode, frequency, product.tenures]);

    return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-xl font-extrabold text-[var(--arn-txt)] sm:text-2xl">
               Set up <span className="text-[var(--arn-amber)]">{isGoalMode ? selectedGoal!.name : product.name}</span>
             </h2>
             <p className="mt-1 text-sm text-[var(--arn-txt-2)] sm:text-base">
               Configure the investment for {clientName}.
             </p>
           </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 text-xs font-semibold text-[var(--arn-amber)] transition-opacity hover:opacity-70"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
          {/* LEFT: Investment Card */}
          <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
             {/* Amount + Frequency */}
             <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
               <div className="flex-1">
                 <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--arn-amber)]">
                   YOU INVEST
                 </div>
                 <div className="mt-1 flex items-baseline gap-1">
                   <span className="text-2xl font-bold text-[var(--arn-txt-3)]">
                     ₹
                   </span>
                    <input
                       type="text"
                       inputMode="numeric"
                       value={formatRupeeFull(sipAmount)}
                       onChange={(e) => {
                         const raw = e.target.value.replace(/[^0-9]/g, "");
                         if (raw) setSipAmount(Math.min(amountLimits.max, Math.max(amountLimits.min, Number(raw))));
                       }}
                       onBlur={handleAmountBlur}
                      onFocus={(e) => {
                        e.target.value = String(sipAmount);
                        e.target.select();
                      }}
                       className="w-full max-w-[200px] bg-transparent text-3xl font-extrabold text-[var(--arn-txt)] outline-none sm:text-[38px]"
                     />
                 </div>
                 <div className="mt-1 text-xs font-medium text-[var(--arn-txt-3)]">
                   {freqLabel}
                 </div>
                 <div className="mt-0.5 text-[10px] font-semibold text-[var(--arn-txt-3)]">
                   Min ₹{amountLimits.min.toLocaleString("en-IN")} — Max ₹{amountLimits.max.toLocaleString("en-IN")}
                 </div>
               </div>

               {!isGoalMode && (
                 <div className="flex-shrink-0">
                   <div className="flex rounded-[8px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] p-[3px]">
                     {(["daily", "monthly"] as const).map((f) => (
                       <button
                         key={f}
                         type="button"
                         onClick={() => setFrequency(f)}
                         className={cn(
                           "rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-all sm:px-4",
                           frequency === f
                             ? "bg-[var(--arn-bg)] text-[var(--arn-txt)] shadow-[0_1px_3px_rgba(0,0,0,.06)]"
                             : "text-[var(--arn-txt-3)] hover:text-[var(--arn-txt-2)]"
                         )}
                       >
                         {f === "daily" ? "Daily" : "Monthly"}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
             </div>

            {/* Inline Projection */}
            <div className="mt-4 flex items-center gap-3 border-t border-b border-[var(--arn-bdr)] py-3">
              <span className="text-lg text-[var(--arn-txt-3)]">→</span>
              <div className="flex-1">
                <div className="text-2xl font-extrabold text-[var(--arn-txt)] sm:text-[32px]">
                  {formatRupee(projection.corpus)}
                </div>
                <div className="text-xs font-medium text-[var(--arn-txt-3)] sm:text-sm">
                  In {tenure} {tenure === 1 ? "year" : "years"} |{" "}
                  {(expectedCagr * 100).toFixed(expectedCagr * 100 % 1 === 0 ? 0 : 2)}%
                  {" p.a."}
                </div>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={amountLimits.min}
              max={amountLimits.max}
              step={amountLimits.step}
              value={sipAmount}
              onChange={handleSliderChange}
              className="mt-4 w-full h-1 cursor-pointer appearance-none rounded-full"
              style={{
                background: `linear-gradient(to right, var(--arn-amber) ${sliderPct}%, var(--arn-bdr) ${sliderPct}%)`,
              }}
            />

             {/* Quick Picks */}
             <div className="mt-3 flex flex-wrap gap-2">
               {AMOUNT_PICKS[isGoalMode ? "monthly" : frequency].map((pick) => (
                 <button
                   key={pick}
                   type="button"
                   onClick={() => setSipAmount(pick)}
                   className={cn(
                     "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                     sipAmount === pick
                       ? "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white"
                       : "border-[var(--arn-bdr)] bg-[var(--arn-bg)] text-[var(--arn-txt-2)] hover:border-[var(--arn-bdr-2)]"
                   )}
                 >
                   {formatRupee(pick)}
                 </button>
               ))}
             </div>

            <div className="my-4 h-px bg-[var(--arn-bdr)]" />

             {/* Tenure */}
             <div className="flex items-center gap-4">
               <span className="text-sm font-semibold text-[var(--arn-txt)]">
                 Tenure
               </span>
               <select
                 value={tenure}
                 onChange={(e) => setTenure(Number(e.target.value))}
                 className="max-w-[200px] flex-1 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 py-2 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors focus:border-[var(--arn-amber)]"
               >
                 {tenureOptions.map((t) => (
                   <option key={t} value={t}>
                     {t} {t === 1 ? "year" : "years"}
                   </option>
                 ))}
               </select>
             </div>

             <div className="my-4 h-px bg-[var(--arn-bdr)]" />

             {/* Fund */}
             {isGoalMode ? (
               <div className="flex items-center gap-4">
                 <span className="text-sm font-semibold text-[var(--arn-txt)]">
                   Fund
                 </span>
                 <div className="flex-1 rounded-[12px] border border-[rgba(184,134,11,.12)] bg-[var(--arn-amber-bg)] px-3 py-2.5">
                   <div className="flex items-center gap-2">
                     <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(184,134,11,.12)] text-[10px] font-bold text-[var(--arn-amber)]">
                       {isLoadingRec ? "..." : "✓"}
                     </span>
                     <span className="text-sm font-semibold text-[var(--arn-txt)]">
                       {isLoadingRec ? "Loading recommended fund..." : fundDisplayName}
                     </span>
                   </div>
                   {recError && !isLoadingRec && (
                     <div className="mt-1 text-xs text-[var(--arn-amber-txt)]">
                       Showing default fund ({recError})
                     </div>
                   )}
                 </div>
               </div>
             ) : (
               <>
                 <div className="flex items-center gap-4">
                   <span className="text-sm font-semibold text-[var(--arn-txt)]">
                     Fund
                   </span>
                   <div className="flex flex-1 gap-2">
                     <button
                       type="button"
                       onClick={() => setFundMode("rec")}
                       className={cn(
                         "flex-1 rounded-[12px] border px-4 py-2.5 text-center text-sm font-semibold transition-all",
                         fundMode === "rec"
                           ? "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white"
                           : "border-[var(--arn-bdr)] bg-[var(--arn-bg)] text-[var(--arn-txt-2)] hover:border-[var(--arn-bdr-2)]"
                       )}
                     >
                       Recommended
                     </button>
                     <button
                       type="button"
                       onClick={() => setFundMode("own")}
                       className={cn(
                         "flex-1 rounded-[12px] border px-4 py-2.5 text-center text-sm font-semibold transition-all",
                         fundMode === "own"
                           ? "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white"
                           : "border-[var(--arn-bdr)] bg-[var(--arn-bg)] text-[var(--arn-txt-2)] hover:border-[var(--arn-bdr-2)]"
                       )}
                     >
                       Choose my own
                     </button>
                   </div>
                 </div>

                 {/* Fund Display / Search */}
                 {fundMode === "rec" ? (
                   <div className="mt-3 rounded-[12px] border border-[rgba(184,134,11,.12)] bg-[var(--arn-amber-bg)] px-3 py-2.5">
                     <div className="flex items-center gap-2">
                       <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(184,134,11,.12)] text-[10px] font-bold text-[var(--arn-amber)]">
                         {isLoadingRec ? "..." : "✓"}
                       </span>
                       <span className="text-sm font-semibold text-[var(--arn-txt)]">
                         {isLoadingRec ? "Loading recommended fund..." : fundDisplayName}
                       </span>
                     </div>
                     {recError && !isLoadingRec && (
                       <div className="mt-1 text-xs text-[var(--arn-amber-txt)]">
                         Showing default fund ({recError})
                       </div>
                     )}
                   </div>
                  ) : (
                    <div className="mt-3">
                      {selectedFund && (
                        <div className="mb-2 rounded-[12px] border border-[rgba(184,134,11,.12)] bg-[var(--arn-amber-bg)] px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(184,134,11,.12)] text-[10px] font-bold text-[var(--arn-amber)]">
                              ✓
                            </span>
                            <span className="text-sm font-semibold text-[var(--arn-txt)]">
                              {fundDisplayName}
                            </span>
                          </div>
                        </div>
                      )}
                      <input
                       type="text"
                       value={fundSearchQuery}
                       onChange={(e) => setFundSearchQuery(e.target.value)}
                       placeholder="Search fund by name or AMC..."
                       className="w-full rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 py-2.5 text-sm font-medium text-[var(--arn-txt)] outline-none transition-colors focus:border-[var(--arn-amber)] placeholder:text-[var(--arn-txt-3)]"
                     />
                     {isSearchingFunds && (
                       <div className="mt-2 text-center text-xs text-[var(--arn-txt-3)]">
                       Searching...
                     </div>
                     )}
                     {!isSearchingFunds && Array.isArray(fundResults) && fundResults.length > 0 && (
                       <div
                         ref={searchRef}
                         className="mt-1 max-h-[200px] overflow-y-auto rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)]"
                       >
                         {fundResults.map((fund) => {
                           const isSelected =
                             (selectedMfId != null && (fund.id === selectedMfId || fund.selectedMfId === selectedMfId)) ||
                             (selectedScheme != null && (fund.ticker === selectedScheme || fund.scheme === selectedScheme || fund.isin === selectedScheme || fund.schemeCode === selectedScheme)) ||
                             (fund.schemeName === selectedFund || fund.fundName === selectedFund || fund.stockName === selectedFund);

                           return (
                             <button
                               key={fund.id ?? fund.schemeCode}
                               type="button"
                               onClick={() => handleFundSelect(fund)}
                               className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-amber-bg)] border-t border-[var(--arn-bdr)] first:border-t-0"
                             >
                               <span className="flex-1 truncate">{fund.schemeName || fund.fundName || fund.stockName}</span>
                               {isSelected && (
                                 <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--arn-amber)] text-white">
                                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                     <polyline points="20 6 9 17 4 12" />
                                   </svg>
                                 </span>
                               )}
                             </button>
                           );
                         })}
                       </div>
                     )}
                   </div>
                 )}
               </>
             )}

            <div className="my-4 h-px bg-[var(--arn-bdr)]" />

            {/* Lump-sum Option */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--arn-txt)]">
                One-time investment
              </span>
              <button
                type="button"
                onClick={() => setLumpSumEnabled(!lumpSumEnabled)}
                className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: lumpSumEnabled ? "var(--arn-amber)" : "#D4D0CA",
                }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: lumpSumEnabled ? "translateX(20px)" : "translateX(4px)",
                  }}
                />
              </button>
            </div>

            {lumpSumEnabled && (
              <div className="mt-3">
                <div className="text-xs font-semibold text-[var(--arn-txt-3)]">
                  Lump-sum amount
                </div>
                <div className="mt-1 flex items-center gap-1 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-3 py-2">
                  <span className="text-sm font-bold text-[var(--arn-txt-3)]">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRupeeFull(lumpSumAmount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      if (raw) setLumpSumAmount(Number(raw));
                    }}
                    onBlur={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      const val = raw ? Number(raw) : 0;
                      setLumpSumAmount(Math.max(0, val));
                    }}
                    onFocus={(e) => {
                      e.target.value = String(lumpSumAmount);
                      e.target.select();
                    }}
                    className="w-full bg-transparent text-lg font-bold text-[var(--arn-txt)] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Projection Card */}
          <div className="lg:sticky lg:top-[100px]">
            <div className="overflow-hidden rounded-[14px] bg-[#3D2E06] p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Projected corpus
                  </div>
                  <div className="mt-1 text-3xl font-extrabold tracking-tight sm:text-[36px]">
                    {formatRupee(projection.corpus)}
                  </div>
                  <div className="mt-1 text-xs font-medium text-white/45">
                    in {tenure} {tenure === 1 ? "year" : "years"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Total invested
                  </div>
                  <div className="mt-1 text-lg font-bold sm:text-[20px]">
                    {formatRupee(projection.invested)}
                  </div>
                </div>
              </div>

              <div className="mt-3 h-[56px]">
                <svg
                  ref={chartRef}
                  preserveAspectRatio="none"
                  className="h-full w-full"
                />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
                <div className="text-center">
                  <div className="text-sm font-bold">{formatRupee(projection.gains)}</div>
                  <div className="text-[10px] font-medium text-white/35">
                    Estimated gains
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">{projection.growth}%</div>
                  <div className="text-[10px] font-medium text-white/35">Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {(expectedCagr * 100).toFixed(expectedCagr * 100 % 1 === 0 ? 0 : 2)}%
                  </div>
                  <div className="text-[10px] font-medium text-white/35">
                    Assumed CAGR
                  </div>
                </div>
              </div>
            </div>

             <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 py-2.5">
               <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--arn-amber)]" />
               <span className="flex-1 truncate text-xs font-semibold text-[var(--arn-txt)]">
                 {isGoalMode ? selectedGoal!.name : product.name} · {fundDisplayName}
               </span>
               <span className="text-xs font-bold text-[var(--arn-amber)]">100%</span>
             </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ArnSetSipPage;
