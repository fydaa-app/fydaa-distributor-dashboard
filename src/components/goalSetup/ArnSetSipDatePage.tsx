"use client";

import { useCallback, useMemo, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { cn } from "@/lib/utils";
import { type DirectProduct } from "@/components/goalSetup/ArnDirectProductSelector";

export interface ArnSetSipDatePageRef {
  getDateConfig: () => {
    sipDate: number;
    startDate: string;
    endDate: string;
    autoRenewDate: string;
    sipFrequency: "daily" | "monthly";
  };
}

interface ArnSetSipDatePageProps {
  selectedProduct: DirectProduct | null;
  sipConfig: {
    sipAmount: number;
    frequency: "daily" | "monthly";
    tenure: number;
    selectedFund: string;
    selectedScheme: string | null;
    selectedMfId: number | null;
    expectedCagr: number;
  };
  onBack: () => void;
  onDateConfigChange?: (config: ReturnType<ArnSetSipDatePageRef["getDateConfig"]>) => void;
}

const DATE_OPTIONS = [1, 5, 10, 15, 20, 25, 28];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
}

function getNextOccurrence(dayOfMonth: number): Date {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  let candidate = new Date(year, month, dayOfMonth);
  if (candidate.getDate() !== dayOfMonth) {
    candidate.setDate(0);
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (candidate <= now) {
    candidate = addMonths(candidate, 1);
    if (candidate.getDate() !== dayOfMonth) {
      candidate.setDate(0);
    }
  }

  return candidate;
}

function getNextMonday(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 1 : day === 6 ? 2 : 0;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatRupee(n: number): string {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(1) + "Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + "L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(0) + "K";
  return "₹" + n.toLocaleString("en-IN");
}

function formatDisplayDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

const ArnSetSipDatePage = forwardRef<ArnSetSipDatePageRef, ArnSetSipDatePageProps>(
  function ArnSetSipDatePage({ selectedProduct, sipConfig, onBack, onDateConfigChange }, ref) {
    const product = selectedProduct ?? {
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

    const [sipDate, setSipDate] = useState(10);
    const [isHowOpen, setIsHowOpen] = useState(true);

    const { startDate, endDate, autoRenewDate } = useMemo(() => {
      const today = new Date();
      let start: Date;

      if (sipConfig.frequency === "daily") {
        start = getNextMonday();
      } else {
        start = getNextOccurrence(sipDate);
      }

      const end = addMonths(start, sipConfig.tenure * 12);
      const autoRenew = addMonths(today, 1);

      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
        autoRenewDate: formatDate(autoRenew),
      };
    }, [sipDate, sipConfig.frequency, sipConfig.tenure]);

    const firstDebitDisplay = useMemo(() => {
      return formatDisplayDate(new Date(startDate + "T00:00:00"));
    }, [startDate]);

    useImperativeHandle(ref, () => ({
      getDateConfig: () => ({
        sipDate,
        startDate,
        endDate,
        autoRenewDate,
        sipFrequency: sipConfig.frequency,
      }),
    }));

    useEffect(() => {
      onDateConfigChange?.({
        sipDate,
        startDate,
        endDate,
        autoRenewDate,
        sipFrequency: sipConfig.frequency,
      });
    }, [sipDate, startDate, endDate, autoRenewDate, sipConfig.frequency, onDateConfigChange]);

    const handleDateSelect = useCallback((day: number) => {
      setSipDate(day);
    }, []);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--arn-txt)] sm:text-2xl">
              {sipConfig.frequency === "daily" ? (
                "Your SIP Schedule"
              ) : (
                <>Pick the <span className="text-[var(--arn-amber)]">SIP date</span></>
              )}
            </h2>
            <p className="mt-1 text-sm text-[var(--arn-txt-2)] sm:text-base">
              {sipConfig.frequency === "daily"
                ? "Your auto-debit will run every weekday"
                : "When should the auto-debit run each month?"}
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* LEFT: Date picker */}
          <div className="space-y-4">
            {sipConfig.frequency !== "daily" && (
              <>
                <div className="text-sm font-semibold text-[var(--arn-txt)]">Debit date</div>
                <div className="flex flex-wrap gap-2">
                  {DATE_OPTIONS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        "h-12 w-12 rounded-[12px] border text-sm font-bold transition-all",
                        sipDate === day
                          ? "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white"
                          : "border-[var(--arn-bdr)] bg-[var(--arn-bg)] text-[var(--arn-txt-2)] hover:border-[var(--arn-bdr-2)]"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-[var(--arn-txt-3)]">
                  SIP runs on the {ordinal(sipDate)} of every month · first debit {firstDebitDisplay}
                </p>
              </>
            )}

            {/* How it works */}
            <div className={cn("rounded-[14px] border bg-[var(--arn-bg)] overflow-hidden transition-colors", isHowOpen ? "border-[var(--arn-amber)]" : "border-[var(--arn-bdr)]")}>
              <button
                type="button"
                onClick={() => setIsHowOpen(!isHowOpen)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--arn-amber-bg)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--arn-amber)" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <span className="flex-1 text-sm font-semibold text-[var(--arn-txt)]">
                  How the auto-debit works
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--arn-txt-3)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className={cn("transition-transform", isHowOpen && "rotate-180")}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isHowOpen ? "max-h-[400px]" : "max-h-0")}>
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--arn-amber-bg)] text-[10px] font-bold text-[var(--arn-amber)]">
                        1
                      </div>
                      <div className="w-px flex-1 bg-[var(--arn-bdr)]" />
                    </div>
                    <div className="pb-3">
                      <div className="text-xs font-semibold text-[var(--arn-txt)]">Set up UPI AutoPay</div>
                      <div className="text-xs text-[var(--arn-txt-2)]">One-time mandate approval via the client&apos;s UPI app</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--arn-amber-bg)] text-[10px] font-bold text-[var(--arn-amber)]">
                        2
                      </div>
                      <div className="w-px flex-1 bg-[var(--arn-bdr)]" />
                    </div>
                    <div className="pb-3">
                      <div className="text-xs font-semibold text-[var(--arn-txt)]">First debit today</div>
                      <div className="text-xs text-[var(--arn-txt-2)]">Amount debited automatically after mandate approval</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--arn-amber-bg)] text-[10px] font-bold text-[var(--arn-amber)]">
                        3
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--arn-txt)]">
                        {sipConfig.frequency === "daily" ? "Auto-debit weekdays" : "Auto-debit monthly"}
                      </div>
                      <div className="text-xs text-[var(--arn-txt-2)]">
                        {sipConfig.frequency === "daily"
                          ? "Debited every weekday, Monday to Friday · pause or cancel anytime"
                          : "Debited on the chosen date each month · pause or cancel anytime"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Portfolio + Payment summary */}
          <div className="space-y-4">
            {/* Portfolio card */}
            <div className="overflow-hidden rounded-[14px] bg-[#3D2E06] p-5 text-white">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Portfolio
              </div>
              <div className="mt-1 text-sm font-bold text-white">
                {product.name}
              </div>
              <div className="mt-0.5 text-xs text-white/60">
                {sipConfig.frequency === "daily" ? formatRupee(sipConfig.sipAmount) + "/day" : formatRupee(sipConfig.sipAmount) + "/mo"} · 1 fund
              </div>

              <div className="mt-3 h-1 rounded-full bg-[var(--arn-amber)]" />

              <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--arn-amber)]" />
                {product.stockType === "IndianStock" && "EQUITY"}
                {product.stockType === "Gold" && "GOLD"}
                {product.stockType === "MultiAsset" && "MULTI-ASSET"}
                {product.stockType === "FixedIncomeBonds" && "DEBT"}
                {product.stockType === "Hybrid" && "HYBRID"}
                {product.stockType === "GlobalStock" && "GLOBAL"}
                {!["IndianStock", "Gold", "MultiAsset", "FixedIncomeBonds", "Hybrid", "GlobalStock"].includes(product.stockType) && product.stockType.toUpperCase()}{" "}
                100%
              </div>

              <div className="mt-3 rounded-[10px] bg-white/7 p-3 border border-white/6">
                <div className="text-xs font-semibold text-white line-clamp-2">
                  {sipConfig.selectedFund.split(" —")[0] || sipConfig.selectedFund}
                </div>
              </div>
            </div>

            {/* Payment summary */}
            <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--arn-txt-2)]">
                    {sipConfig.frequency === "daily" ? "Daily SIP" : "Monthly SIP"}
                  </span>
                  <span className="font-semibold text-[var(--arn-txt)]">
                    {formatRupee(sipConfig.sipAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--arn-txt-2)]">Transaction charges</span>
                  <span className="font-semibold text-[var(--arn-txt)]">₹0</span>
                </div>
                <div className="border-t border-[var(--arn-bdr)] pt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[var(--arn-txt)]">First debit</span>
                  <span className="font-bold text-[var(--arn-amber)]">
                    {formatRupee(sipConfig.sipAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ArnSetSipDatePage;
