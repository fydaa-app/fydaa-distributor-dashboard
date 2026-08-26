"use client";

import { cn } from "@/lib/utils";
import { type GoalSetupClient } from "@/services/arnGoalSetupService";

interface ArnDirectProductSelectorProps {
  selectedClient: GoalSetupClient | null;
  selectedProductKey?: string | null;
  onSelect: (product: DirectProduct) => void;
  onBack: () => void;
}

export interface DirectProduct {
  key: string;
  name: string;
  tagline: string;
  goldLine: string;
  description: string;
  goalId: number;
  stockType: string;
  assumedCagr: string;
  defAmt: number;
  defTenure: number;
  tenures: number[];
  defFund: string;
}

const DIRECT_PRODUCTS: DirectProduct[] = [
  {
    key: "digital-gold",
    name: "Digital Gold",
    tagline: "A pinch of gold.",
    goldLine: "Every single day.",
    description:
      "Buy 24K digital gold from just ₹100 a day. Securely stored and insured.",
    goalId: 39,
    stockType: "Gold",
    assumedCagr: "9%",
    defAmt: 5000,
    defTenure: 5,
    tenures: [3, 5, 10, 20],
    defFund: "HDFC Gold ETF FoF — Direct Plan — Growth",
  },
  {
    key: "equity",
    name: "Equity",
    tagline: "Small habit.",
    goldLine: "Big corpus.",
    description:
      "Invest from just ₹100 a day and let the power of compounding work for you.",
    goalId: 36,
    stockType: "IndianStock",
    assumedCagr: "12%",
    defAmt: 10000,
    defTenure: 10,
    tenures: [3, 5, 10, 20, 30],
    defFund: "HDFC Flexi Cap Fund — Direct Plan — Growth",
  },
  {
    key: "multi-asset",
    name: "Multi-Asset",
    tagline: "Equity, debt, gold.",
    goldLine: "One holding.",
    description:
      "One fund that spreads your investments across asset classes for you.",
    goalId: 38,
    stockType: "MultiAsset",
    assumedCagr: "10%",
    defAmt: 10000,
    defTenure: 10,
    tenures: [5, 10, 20, 30],
    defFund: "ICICI Pru Multi-Asset Fund — Direct Plan — Growth",
  },
  {
    key: "debt",
    name: "Debt",
    tagline: "Steady money.",
    goldLine: "Slow and sure.",
    description:
      "Invest in bonds and corporate paper, not the market.",
    goalId: 37,
    stockType: "FixedIncomeBonds",
    assumedCagr: "7%",
    defAmt: 10000,
    defTenure: 5,
    tenures: [1, 3, 5, 10],
    defFund: "Aditya Birla Sun Life Liquid Fund — Direct Plan — Growth",
  },
  {
    key: "hybrid",
    name: "Hybrid",
    tagline: "Equity and debt.",
    goldLine: "One balance.",
    description:
      "One fund that adjusts the mix as markets move.",
    goalId: 40,
    stockType: "Hybrid",
    assumedCagr: "10%",
    defAmt: 10000,
    defTenure: 10,
    tenures: [3, 5, 10, 20],
    defFund: "Kotak Equity Hybrid Fund — Direct Plan — Growth",
  },
  {
    key: "global",
    name: "Global",
    tagline: "Beyond India.",
    goldLine: "The world too.",
    description:
      "Invest in US and global companies from just ₹100 a day.",
    goalId: 41,
    stockType: "Global",
    assumedCagr: "11%",
    defAmt: 10000,
    defTenure: 10,
    tenures: [3, 5, 10, 20, 30],
    defFund: "Motilal Oswal Midcap Fund — Direct Plan — Growth",
  },
];

function ProductIcon({ product }: { product: DirectProduct }) {
  const iconClass = "h-[18px] w-[18px] shrink-0";

  if (product.key === "digital-gold") {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="6" />
        <path d="M8 14h8l2 8H6l2-8z" />
      </svg>
    );
  }

  if (product.key === "equity") {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  }

  if (product.key === "multi-asset") {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (product.key === "debt") {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }

  if (product.key === "hybrid") {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  }

  return (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

export default function ArnDirectProductSelector({
  selectedClient,
  selectedProductKey,
  onSelect,
  onBack,
}: ArnDirectProductSelectorProps) {
  const clientName = selectedClient?.name || "the client";

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Back / Path */}
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-xs font-semibold text-[var(--arn-amber)] transition-opacity hover:opacity-70"
        >
          ← Change path
        </button>

        <span className="text-xs font-semibold text-[var(--arn-txt-3)]">
          Direct SIP / Investment
        </span>
      </div>

      {/* Heading */}
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold leading-tight text-[var(--arn-txt)] sm:text-2xl">
          What would you like to{" "}
          <span className="text-[var(--arn-amber)]">set up?</span>
        </h2>

        <p className="mt-1 break-words text-sm text-[var(--arn-txt-2)] sm:text-base">
          Choose a path for {clientName}.
        </p>
      </div>

      {/* Products */}
      <div className="mx-auto w-full max-w-[1100px]">
        <div
          className="
            grid w-full min-w-0
            grid-cols-1
            gap-3
            sm:grid-cols-2
            sm:gap-4
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {DIRECT_PRODUCTS.map((product) => {
            const isSelected = product.key === selectedProductKey;

             return (
               <button
                key={product.key}
                type="button"
                onClick={() => onSelect(product)}
                className={cn(
                  "flex min-w-0 w-full flex-col items-center gap-2 overflow-hidden rounded-[14px] border p-4 text-center transition-all sm:p-5",
                  isSelected
                      ? "border border-[var(--arn-amber)] bg-[var(--arn-amber-sel-bg)] shadow-[0_4px_16px_var(--arn-amber-bg-grad-1)]"
                    : "border-[var(--arn-bdr)] bg-[var(--arn-bg)] hover:border-[var(--arn-bdr-2)] hover:shadow-[0_4px_16px_rgba(0,0,0,.04)]"
                )}
              >
                {/* Product Icon */}
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]",
                    isSelected
                      ? "bg-[var(--arn-bg)] text-[var(--arn-amber)]"
                      : "bg-[var(--arn-amber-bg)] text-[var(--arn-amber)]"
                  )}
                >
                  <ProductIcon product={product} />
                </div>

                {/* Product Name */}
                <div className="w-full min-w-0 break-words text-sm font-bold leading-tight text-[var(--arn-txt)] sm:text-base">
                  {product.name}
                </div>

                {/* Tagline */}
                <div className="w-full min-w-0 break-words text-[10px] font-bold leading-relaxed text-[var(--arn-txt)] sm:text-xs">
                  {product.tagline}{" "}
                  {product.goldLine && (
                    <span className="font-bold text-[var(--arn-amber)]">
                      {product.goldLine}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="w-full min-w-0 break-words text-[10px] leading-relaxed text-[var(--arn-txt-2)] sm:text-xs">
                  {product.description}
                </div>

                {/* CAGR */}
                <div className="mt-1 flex w-full min-w-0 flex-wrap items-center justify-center gap-1">
                  <span className="text-[10px] font-normal leading-none text-[var(--arn-txt)] sm:text-xs">
                    In 3 Years |
                  </span>

                  <span
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-[6px] px-[10px] py-[3px] text-[10px] font-semibold leading-none sm:text-xs",
                      isSelected
                        ? "bg-[var(--arn-bg)] text-[var(--arn-amber)]"
                        : "bg-[var(--arn-amber-bg)] text-[var(--arn-amber-txt)]"
                    )}
                  >
                    {product.assumedCagr} CAGR
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}