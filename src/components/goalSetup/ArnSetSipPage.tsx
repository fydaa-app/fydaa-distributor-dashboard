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
    investmentMode: "sip" | "lumpsum";
    expectedCagr: number;
    portfolioId: number | null;
  };
  hasTenureError: boolean;
}

interface ArnSetSipPageProps {
  selectedClient: GoalSetupClient | null;
  selectedGoal: GoalResponse | null;
  selectedProduct: DirectProduct | null;
  mode: "goal" | "direct";
  investmentMode: "sip" | "lumpsum";
  onBack: () => void;
  onModeChange?: (mode: "sip" | "lumpsum") => void;
  onConfigChange?: (config: ReturnType<ArnSetSipPageRef["getConfig"]>) => void;
  preselectedFund?: FundOption | null;
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

const TENURE_LIMITS: Record<"daily" | "monthly", { min: number; max: number }> = {
  daily: { min: 1, max: 4 },
  monthly: { min: 3, max: 30 },
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
  function ArnSetSipPage({ selectedClient, selectedGoal, selectedProduct, mode, investmentMode, onBack, onModeChange, onConfigChange, preselectedFund }, ref) {
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
    const [displayTenure, setDisplayTenure] = useState(String(product.defTenure));
    const [tenureError, setTenureError] = useState<string | null>(null);

    const initialFundMode = preselectedFund ? "own" : "rec";
    const initialSelectedFund = preselectedFund
      ? preselectedFund.schemeName || preselectedFund.fundName || preselectedFund.stockName || preselectedFund.name || product.defFund || ""
      : product.defFund || "";
    const initialSelectedScheme = preselectedFund
      ? preselectedFund.ticker || preselectedFund.scheme || preselectedFund.isin || preselectedFund.schemeCode || null
      : null;
    const initialSelectedMfId = preselectedFund
      ? preselectedFund.selectedMfId ?? preselectedFund.id ?? null
      : null;

    const [fundMode, setFundMode] = useState<"rec" | "own">(initialFundMode);
    const [selectedFund, setSelectedFund] = useState(initialSelectedFund);
    const [selectedScheme, setSelectedScheme] = useState<string | null>(initialSelectedScheme);
    const [selectedMfId, setSelectedMfId] = useState<number | null>(initialSelectedMfId);
    const [fundSearchQuery, setFundSearchQuery] = useState("");
    const [fundResults, setFundResults] = useState<FundOption[]>([]);
    const [isSearchingFunds, setIsSearchingFunds] = useState(false);
    const [recommendedPortfolio, setRecommendedPortfolio] =
      useState<RecommendedPortfolioResponse | null>(null);
    const [isLoadingRec, setIsLoadingRec] = useState(true);
    const [recError, setRecError] = useState<string | null>(null);
    const [lumpsumAmountLimits, setLumpsumAmountLimits] = useState({
      min: 0,
      max: 10000000,
      step: 1000,
    });
    const [sipAmountLimits, setSipAmountLimits] = useState<{ min: number; max: number; step: number } | null>(null);
    const [userSelectedFund, setUserSelectedFund] = useState(false);
    const [portfolioId, setPortfolioId] = useState<number | null>(null);

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
        frequency: isGoalMode && !preselectedFund ? "monthly" : frequency,
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
    }, [sipAmount, frequency, tenure, expectedCagr, isGoalMode, preselectedFund]);

    const fundDisplayName = useMemo(() => {
      if (!isGoalMode && fundMode === "rec" && recommendedPortfolio?.schemeAllocations?.[0]?.stockName) {
        return recommendedPortfolio.schemeAllocations[0].stockName;
      }
      if (fundMode === "own") {
        return selectedFund ? selectedFund.split(" —")[0] || selectedFund : "";
      }
      return selectedFund ? selectedFund.split(" —")[0] || selectedFund : "";
    }, [isGoalMode, fundMode, selectedFund, recommendedPortfolio]);

    useEffect(() => {
      if (!selectedClient) return;
      if (preselectedFund) {
        setIsLoadingRec(false);
        setRecError(null);
        return;
      }

      let cancelled = false;
      setIsLoadingRec(true);
      setRecError(null);

      const goalId = isGoalMode ? selectedGoal!.id : product.goalId;

      getRecommendedPortfolio(selectedClient.userId, goalId)
        .then((data) => {
          if (!cancelled) {
            setRecommendedPortfolio(data);
            if (data?.portfolio?.id) {
              setPortfolioId(data.portfolio.id);
            }
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
    }, [selectedClient, selectedClient?.userId, isGoalMode, selectedGoal, selectedGoal?.id, product.goalId, product.defFund, preselectedFund]);

    useEffect(() => {
      if (investmentMode !== "lumpsum") return;
      if (userSelectedFund) return;

      const schemeMin = recommendedPortfolio?.schemeAllocations?.[0]?.minInitialInvestment;
      const portfolioMin = recommendedPortfolio?.portfolio?.minimumInvestment;
      const min = schemeMin ?? portfolioMin;

      if (!min) return;

      setLumpsumAmountLimits({
        min,
        max: 10000000,
        step: min || 1000,
      });
      setSipAmount((prev) => (prev < min ? min : prev));
    }, [recommendedPortfolio, investmentMode, userSelectedFund]);

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

    useEffect(() => {
      setDisplayTenure(String(tenure));
    }, [tenure]);

    useEffect(() => {
      if (investmentMode === "sip") {
        setFrequency("monthly");
        setTenure(product.defTenure);
        setSipAmount(product.defAmt);
      } else {
        setSipAmount(lumpsumAmountLimits.min || product.defAmt);
      }
    }, [investmentMode, lumpsumAmountLimits.min, product.defAmt, product.defTenure]);

    useImperativeHandle(ref, () => ({
      getConfig: () => ({
        sipAmount,
        frequency,
        tenure,
        selectedFund: fundDisplayName,
        selectedScheme,
        selectedMfId,
        investmentMode,
        expectedCagr,
        portfolioId,
      }),
      hasTenureError: !!tenureError,
    }));

    useEffect(() => {
      onConfigChange?.({
        sipAmount,
        frequency: isGoalMode && !preselectedFund ? "monthly" : frequency,
        tenure,
        selectedFund: fundDisplayName,
        selectedScheme,
        selectedMfId,
        investmentMode,
        expectedCagr,
        portfolioId,
      });
    }, [sipAmount, frequency, tenure, fundDisplayName, selectedScheme, selectedMfId, investmentMode, expectedCagr, portfolioId, onConfigChange, isGoalMode, preselectedFund]);

    useEffect(() => {
      if (isGoalMode && !preselectedFund) {
        setSipAmount(product.defAmt);
        setTenure(product.defTenure);
        return;
      }
      if (frequency === "daily") {
        setSipAmount((prev) => Math.max(sipAmountLimits?.min ?? 300, prev));
        setTenure(1);
      } else {
        setSipAmount((prev) => Math.max(sipAmountLimits?.min ?? 1000, prev));
        setTenure(5);
      }
    }, [frequency, isGoalMode, preselectedFund, product.defAmt, product.defTenure, sipAmountLimits]);

    useEffect(() => {
      if (fundMode === "own") {
        setSipAmountLimits(null);
        if (!preselectedFund) {
          setLumpsumAmountLimits({
            min: 0,
            max: 10000000,
            step: 1000,
          });
        }
      } else {
        setSipAmountLimits(null);
        setUserSelectedFund(false);
      }
    }, [fundMode, preselectedFund]);

    const handleFundSelect = useCallback(
      (fund: FundOption) => {
        const displayName =
          fund.schemeName || fund.fundName || fund.stockName || "Unknown Fund";
        setSelectedFund(displayName);
        setSelectedScheme(fund.ticker || fund.scheme || fund.isin || fund.schemeCode || null);
        setSelectedMfId(fund.selectedMfId ?? fund.id ?? null);
        setFundSearchQuery("");
        setUserSelectedFund(true);

        if (fund.minInitialInvestment) {
          setLumpsumAmountLimits({
            min: fund.minInitialInvestment,
            max: 10000000,
            step: fund.minInitialInvestment,
          });
        }
        if (fund.minSipAmount) {
          setSipAmountLimits({
            min: fund.minSipAmount,
            max: AMOUNT_LIMITS[frequency].max,
            step: AMOUNT_LIMITS[frequency].step,
          });
        }
      },
      [frequency]
    );

    const amountLimits = isGoalMode && !preselectedFund ? AMOUNT_LIMITS.monthly : AMOUNT_LIMITS[frequency];
    const activeSipLimits = sipAmountLimits ?? amountLimits;
    const activeAmountLimits = investmentMode === "lumpsum" ? lumpsumAmountLimits : activeSipLimits;

    const tenureMin = isGoalMode && !preselectedFund
      ? Math.round(selectedGoal!.tenureMin / 12)
      : TENURE_LIMITS[frequency].min;

    const tenureMax = isGoalMode && !preselectedFund
      ? Math.round(selectedGoal!.tenureMax / 12)
      : TENURE_LIMITS[frequency].max;

    const handleSliderChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSipAmount(Number(e.target.value));
      },
      []
    );

    const handleTenureChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        if (!raw) {
          setDisplayTenure("");
          setTenureError(null);
          return;
        }
        const num = Number(raw);
        const clamped = Math.min(tenureMax, num);
        setTenure(clamped);
        setDisplayTenure(String(clamped));
        if (num >= tenureMin) {
          setTenureError(null);
        }
      },
      [tenureMin, tenureMax]
    );

    const handleTenureBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        if (!raw) {
          setTenure(tenureMin);
          setDisplayTenure(String(tenureMin));
          setTenureError(null);
          return;
        }
        const num = Number(raw);
        const clamped = Math.min(tenureMax, Math.max(tenureMin, num));
        setTenure(clamped);
        setDisplayTenure(String(clamped));
        if (num < tenureMin) {
          setTenureError(`Minimum tenure is ${tenureMin} year${tenureMin === 1 ? "" : "s"}`);
        } else {
          setTenureError(null);
        }
      },
      [tenureMin, tenureMax]
    );

    const sliderPct = ((sipAmount - activeAmountLimits.min) / (activeAmountLimits.max - activeAmountLimits.min)) * 100;

    const tenureOptions = useMemo(() => {
      if (isGoalMode && !preselectedFund) {
        return product.tenures;
      }
      return TENURE_OPTIONS[frequency];
    }, [isGoalMode, preselectedFund, frequency, product.tenures]);

    const cappedTenureOptions = useMemo(() => {
      if (tenureOptions.length <= 6) return tenureOptions;
      const step = (tenureOptions.length - 1) / 5;
      return Array.from({ length: 6 }, (_, i) =>
        tenureOptions[Math.round(i * step)]
      );
    }, [tenureOptions]);

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
            {/* Mode toggle (SIP / One-time) */}
            <div className="mb-4 flex rounded-[8px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] p-[3px] w-fit">
              {(["sip", "lumpsum"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onModeChange?.(m)}
                  className={cn(
                    "rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-all sm:px-4",
                    investmentMode === m
                      ? "bg-[var(--arn-bg)] text-[var(--arn-txt)] shadow-[0_1px_3px_rgba(0,0,0,.06)]"
                      : "text-[var(--arn-txt-3)] hover:text-[var(--arn-txt-2)]"
                  )}
                >
                  {m === "sip" ? "SIP" : "One-time"}
                </button>
              ))}
            </div>

              {/* Amount + Frequency */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--arn-amber)]">
                    {investmentMode === "lumpsum" ? "YOU INVEST" : "YOU INVEST"}
                  </div>
                   <div className="mt-1 flex items-baseline gap-1">
                     <input
                       type="text"
                       readOnly
                       value={formatRupeeFull(sipAmount)}
                       className="w-full max-w-[200px] bg-transparent text-3xl font-extrabold text-[var(--arn-txt)] outline-none sm:text-[38px]"
                     />
                   </div>
                  <div className="mt-1 text-xs font-medium text-[var(--arn-txt-3)]">
                    {investmentMode === "lumpsum"
                      ? "One-time investment"
                      : (isGoalMode && !preselectedFund ? "per month" : frequency === "daily" ? "per day" : "per month")}
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold text-[var(--arn-txt-3)]">
                    Min ₹{activeAmountLimits.min.toLocaleString("en-IN")} — Max ₹{activeAmountLimits.max.toLocaleString("en-IN")}
                  </div>
                </div>

                {investmentMode === "sip" && (!isGoalMode || !!preselectedFund) && (
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

             {investmentMode === "sip" && (
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
             )}

              {/* Slider */}
              <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[var(--arn-amber)] sm:mt-5 md:mt-6">
                {investmentMode === "lumpsum" ? "Edit your investment amount" : "Edit your investment amount"}
              </div>
              <input
                type="range"
                min={investmentMode === "lumpsum" ? lumpsumAmountLimits.min : amountLimits.min}
                max={investmentMode === "lumpsum" ? lumpsumAmountLimits.max : amountLimits.max}
                step={investmentMode === "lumpsum" ? lumpsumAmountLimits.step : amountLimits.step}
                value={sipAmount}
                onChange={handleSliderChange}
                className="arn-sip-slider mt-4 w-full h-1 cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, var(--arn-amber) ${sliderPct}%, var(--arn-bdr) ${sliderPct}%)`,
                }}
              />

              {/* Quick Picks */}
              <div className="mt-3 flex flex-wrap gap-2">
                 {(investmentMode === "lumpsum"
                   ? [
                       lumpsumAmountLimits.min,
                       Math.min(lumpsumAmountLimits.min * 2, lumpsumAmountLimits.max),
                       Math.min(lumpsumAmountLimits.min * 5, lumpsumAmountLimits.max),
                       Math.min(100000, lumpsumAmountLimits.max),
                       Math.min(500000, lumpsumAmountLimits.max),
                       lumpsumAmountLimits.max,
                     ].filter((v, i, a) => a.indexOf(v) === i)
                    : AMOUNT_PICKS[isGoalMode && !preselectedFund ? "monthly" : frequency].map(
                        (pick) => Math.max(pick, sipAmountLimits?.min ?? 0)
                      )
                 ).map((pick) => (
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

             {investmentMode === "sip" && <>
             <div className="my-4 h-px bg-[var(--arn-bdr)]" />

              {/* Tenure */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[var(--arn-txt)]">
                    Tenure
                  </span>
                   <div className="flex flex-col gap-1">
                     <div className="flex items-baseline gap-1">
                       <input
                         type="text"
                         inputMode="numeric"
                         value={displayTenure}
                         onChange={handleTenureChange}
                         onBlur={handleTenureBlur}
                         className={cn(
                           "max-w-[100px] rounded-[12px] border bg-[var(--arn-bg)] px-3 py-2 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors focus:border-[var(--arn-amber)]",
                           tenureError ? "border-[var(--arn-red)]" : "border-[var(--arn-bdr)]"
                         )}
                       />
                       <span className="text-xs font-medium text-[var(--arn-txt-3)]">
                         {tenure === 1 ? "year" : "years"}
                       </span>
                     </div>
                     {tenureError && (
                       <span className="text-xs font-medium text-[var(--arn-red)]">{tenureError}</span>
                     )}
                   </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cappedTenureOptions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTenure(t)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                        tenure === t
                          ? "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white"
                          : "border-[var(--arn-bdr)] bg-[var(--arn-bg)] text-[var(--arn-txt-2)] hover:border-[var(--arn-bdr-2)]"
                      )}
                    >
                      {t} {t === 1 ? "yr" : "yrs"}
                    </button>
                  ))}
                </div>
              </div>

             <div className="my-4 h-px bg-[var(--arn-bdr)]" />
             </>}

              {/* Fund */}
              {isGoalMode || !!preselectedFund ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[var(--arn-txt)]">
                    Fund
                  </span>
                  <div className="flex-1 rounded-[12px] border border-[var(--arn-input-ring)] bg-[var(--arn-amber-bg)] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--arn-input-ring)] text-[10px] font-bold text-[var(--arn-amber)]">
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
                    <div className="mt-3 rounded-[12px] border border-[var(--arn-input-ring)] bg-[var(--arn-amber-bg)] px-3 py-2.5">
                     <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--arn-avatar-bg)] text-[10px] font-bold text-[var(--arn-avatar-txt)]">
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
                          <div className="mb-2 rounded-[12px] border border-[var(--arn-input-ring)] bg-[var(--arn-amber-bg)] px-3 py-2.5">
                           <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--arn-avatar-bg)] text-[10px] font-bold text-[var(--arn-avatar-txt)]">
                          {isLoadingRec ? "..." : "✓"}
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
           </div>

           {/* RIGHT: Projection Card or Lumpsum Details */}
           <div className="lg:sticky lg:top-[100px]">
              {investmentMode === "lumpsum" ? (
                <div className="overflow-hidden rounded-[14px] bg-[var(--arn-amber-card-dark)] p-5 text-white">
                 <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                   Lumpsum Details
                 </div>
                 <div className="mt-3 space-y-3">
                   <div>
                     <div className="text-3xl font-extrabold tracking-tight sm:text-[36px]">
                       {formatRupee(sipAmount)}
                     </div>
                     <div className="mt-1 text-xs font-medium text-white/45">
                       One-time investment
                     </div>
                   </div>
                   <div className="border-t border-white/8 pt-3">
                     <div className="text-[10px] font-medium text-white/35">Fund</div>
                     <div className="mt-1 text-sm font-bold text-white">
                       {fundDisplayName.split(" —")[0] || fundDisplayName}
                     </div>
                   </div>
                 </div>
               </div>
              ) : (
                <div className="overflow-hidden rounded-[14px] bg-[var(--arn-amber-card-dark)] p-5 text-white">
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
             )}

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
