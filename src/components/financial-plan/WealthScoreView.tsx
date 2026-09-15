"use client";

import { useState } from "react";
import ArnTabs from "@/components/common/ArnTabs";
import type { WealthScoreData } from "@/services/financialPlanService";

interface WealthScoreViewProps {
  data: WealthScoreData;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
}

type ComponentKey = keyof NonNullable<WealthScoreData["components"]>;
type TabId = "wealthScore" | "balanceSheet" | "profitLoss";

const TABS = [
  { id: "wealthScore", label: "Wealth Score" },
  { id: "balanceSheet", label: "Balance Sheet" },
  { id: "profitLoss", label: "Monthly Profit / Loss" },
];

const COMPONENT_META: Array<{
  key: ComponentKey;
  label: string;
}> = [
  { key: "netWorthStrength", label: "Net Worth Strength" },
  { key: "assetQuality", label: "Asset Quality" },
  { key: "liquiditySafety", label: "Liquidity & Safety" },
  { key: "debtHealth", label: "Debt Health" },
  { key: "goalReadiness", label: "Goal Readiness" },
];

const METRIC_LABELS: Record<string, string> = {
  netWorth: "Net Worth",
  totalAssets: "Total Assets",
  totalLiabilities: "Total Liabilities",
  annualIncome: "Annual Income",
  netWorthMultiple: "Net Worth Multiple",
  age: "Age",
  growthAssets: "Growth Assets",
  stocks: "Stocks",
  mfEquity: "MF Equity",
  npsEquity: "NPS Equity",
  growthAssetRatio: "Growth Asset Ratio (%)",
  liquidAssets: "Liquid Assets",
  monthlyExpenses: "Monthly Expenses",
  emergencyMonths: "Emergency Months",
  targetMonths: "Target Months",
  totalEMI: "Total EMI",
  monthlyIncome: "Monthly Income",
  emiRatio: "EMI Ratio (%)",
  totalDebt: "Total Debt",
  badDebtAmount: "Bad Debt Amount",
  badDebtRatio: "Bad Debt Ratio (%)",
  goodDebt: "Good Debt",
  totalGoals: "Total Goals",
  averageReadiness: "Average Readiness (%)",
  onTrackGoals: "On Track Goals",
  behindGoals: "Behind Goals",
};

function formatCurrency(value: unknown): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? "—");
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatMetricValue(key: string, value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return `${value.length} items`;

  const moneyKeys = new Set([
    "netWorth",
    "totalAssets",
    "totalLiabilities",
    "annualIncome",
    "growthAssets",
    "stocks",
    "mfEquity",
    "npsEquity",
    "liquidAssets",
    "monthlyExpenses",
    "totalEMI",
    "monthlyIncome",
    "totalDebt",
    "badDebtAmount",
    "goodDebt",
    "targetAmount",
    "currentCorpus",
  ]);

  if (moneyKeys.has(key) && typeof value === "number") {
    return formatCurrency(value);
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return String(value);
}

function statusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("critical") ||
    normalized.includes("behind") ||
    normalized.includes("fragile") ||
    normalized.includes("insufficient") ||
    normalized.includes("high")
  ) {
    return "#b42318";
  }
  if (
    normalized.includes("excellent") ||
    normalized.includes("strong") ||
    normalized.includes("elite") ||
    normalized.includes("on track") ||
    normalized.includes("debt free") ||
    normalized.includes("good")
  ) {
    return "#3b6d11";
  }
  return "var(--arn-amber)";
}

function getMetric(
  data: WealthScoreData,
  componentKey: ComponentKey,
  metricKey: string
): number | undefined {
  const value = data.components?.[componentKey]?.metrics?.[metricKey];
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

export default function WealthScoreView({
  data,
  isLoading = false,
  error = null,
  onRetry,
  onDownload,
  isDownloading = false,
}: WealthScoreViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("wealthScore");
  const [expandedComponent, setExpandedComponent] = useState<ComponentKey | null>(null);

  if (isLoading) {
    return (
      <div className="step-panel">
        <div className="text-center py-10">
          <p className="step-eyebrow">Financial Plan</p>
          <h2 className="step-title">Calculating wealth score</h2>
          <p className="step-helper">Please wait a moment…</p>
        </div>
        {error && (
          <div className="field-error" style={{ marginTop: 16 }}>
            <i className="ti ti-alert-circle" aria-hidden="true" />
            {error}
          </div>
        )}
        {error && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary btn-wide"
            style={{ marginTop: 16 }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const calculatedAt = data.calculatedAt
    ? new Date(data.calculatedAt).toLocaleString("en-IN")
    : null;

  const netWorth = getMetric(data, "netWorthStrength", "netWorth");
  const totalAssets = getMetric(data, "netWorthStrength", "totalAssets");
  const totalLiabilities = getMetric(data, "netWorthStrength", "totalLiabilities");
  const monthlyIncome = getMetric(data, "debtHealth", "monthlyIncome");
  const monthlyExpenses = getMetric(data, "liquiditySafety", "monthlyExpenses");
  const totalEMI = getMetric(data, "debtHealth", "totalEMI");
  const annualIncome = getMetric(data, "netWorthStrength", "annualIncome");
  const netMonthly =
    monthlyIncome != null && monthlyExpenses != null
      ? monthlyIncome - monthlyExpenses
      : undefined;

  const balanceSheetSections = [
    {
      section: "Assets",
      items: [
        { label: "Total Assets", value: totalAssets },
        { label: "Liquid Assets", value: getMetric(data, "assetQuality", "liquidAssets") },
        { label: "Growth Assets", value: getMetric(data, "assetQuality", "growthAssets") },
        { label: "Stocks", value: getMetric(data, "assetQuality", "stocks") },
        { label: "MF Equity", value: getMetric(data, "assetQuality", "mfEquity") },
        { label: "NPS Equity", value: getMetric(data, "assetQuality", "npsEquity") },
      ],
    },
    {
      section: "Liabilities",
      items: [
        { label: "Total Liabilities", value: totalLiabilities },
        { label: "Total Debt", value: getMetric(data, "debtHealth", "totalDebt") },
        { label: "Bad Debt", value: getMetric(data, "debtHealth", "badDebtAmount") },
        { label: "Good Debt", value: getMetric(data, "debtHealth", "goodDebt") },
      ],
    },
  ];

  const profitLossSections = [
    {
      section: "Income",
      items: [
        { label: "Monthly Income", value: monthlyIncome },
        {
          label: "Annual Income (Monthly Avg)",
          value: annualIncome != null ? annualIncome / 12 : undefined,
        },
      ],
    },
    {
      section: "Expenses",
      items: [
        { label: "Monthly Expenses", value: monthlyExpenses },
        { label: "Total EMI", value: totalEMI },
      ],
    },
  ];

  return (
    <div className="step-panel">
      <div className="text-center">
        <p className="step-eyebrow">Financial Plan</p>
        <h2 className="step-title">Net Worth</h2>
        <p className="step-helper">{data.message}</p>
      </div>

      <div
        className="glass-card rounded-[10px] border border-[var(--arn-amber)] bg-[var(--arn-amber-sel-bg)]"
        style={{ textAlign: "center", padding: "28px 22px", marginBottom: 20 }}
      >
        <div className="card-title" style={{ fontSize: 48, lineHeight: 1.1 }}>
          {netWorth != null ? formatCurrency(netWorth) : "—"}
        </div>
        <div className="card-sub" style={{ marginTop: 8 }}>
          Wealth Score {data.overallScore} · {data.scoreLabel} · Band {data.scoreBand}
        </div>
        {calculatedAt && (
          <div className="step-helper" style={{ marginTop: 8, marginBottom: 0 }}>
            Calculated {calculatedAt}
            {data.setuDataUsed ? " · Setu data used" : " · Questionnaire data"}
          </div>
        )}
      </div>

      {error && (
        <div className="field-error" style={{ marginBottom: 16 }}>
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {error}
        </div>
      )}

      <ArnTabs tabs={TABS} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

      {activeTab === "wealthScore" && (
        <div className="space-y-6">
          {/* Insights stay above the score components */}
          {Array.isArray(data.insights) && data.insights.length > 0 && (
            <div>
              <div className="onboard-section-label">Insights</div>

              {data.insights.map((insight, index) => (
                <div
                  key={index}
                  className="glass-card rounded-[10px]"
                  style={{ padding: "14px 16px", marginBottom: 10 }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {insight.priority.toUpperCase()} · {insight.category}
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    {insight.message}
                  </div>

                  <div
                    className="step-helper"
                    style={{ margin: 0, textAlign: "left" }}
                  >
                    Action: {insight.actionable}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Score components */}
          <div>
            <div className="onboard-section-label">Score Components</div>

            <div className="space-y-3">
              {COMPONENT_META.map(({ key, label }) => {
                const component = data.components?.[key];
                if (!component) return null;

                const isExpanded = expandedComponent === key;
                const score = Number(component.score);
                const progress = Number.isFinite(score)
                  ? Math.max(0, Math.min(100, score))
                  : 0;

                const metricEntries = Object.entries(component.metrics ?? {}).filter(
                  ([metricKey]) =>
                    metricKey !== "goalDetails" &&
                    !(key === "netWorthStrength" && metricKey === "netWorthMultiple")
                );

                const goalDetails = Array.isArray(component.metrics?.goalDetails)
                  ? component.metrics.goalDetails
                  : [];

                return (
                  <div
                    key={key}
                    className="glass-card rounded-[10px] overflow-hidden"
                    style={{
                      border: "1px solid var(--arn-bdr)",
                      boxShadow: isExpanded
                        ? "0 8px 18px rgba(0, 0, 0, 0.10)"
                        : "0 4px 12px rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComponent(isExpanded ? null : key)
                      }
                      className="w-full"
                      style={{
                        display: "block",
                        padding: "17px 18px 15px",
                        background: "transparent",
                        border: 0,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      aria-expanded={isExpanded}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: "var(--arn-txt)",
                          }}
                        >
                          {label}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color: "var(--arn-txt)",
                            }}
                          >
                            {component.score}
                          </div>

                          <i
                            className={`ti ${
                              isExpanded
                                ? "ti-chevron-up"
                                : "ti-chevron-down"
                            }`}
                            aria-hidden="true"
                            style={{
                              fontSize: 18,
                              color: "var(--arn-txt-2)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Score progress bar */}
                      <div
                        style={{
                          height: 8,
                          marginTop: 12,
                          background: "var(--arn-bdr)",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${progress}%`,
                            height: "100%",
                            borderRadius: 999,
                            background: statusTone(component.status),
                            transition: "width 180ms ease",
                          }}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        style={{
                          borderTop: "1px solid var(--arn-bdr)",
                          padding: "18px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 18,
                          }}
                        >
                          <div
                            style={{
                              color: statusTone(component.status),
                              fontWeight: 600,
                              fontSize: 15,
                            }}
                          >
                            {component.status}
                          </div>

                          <div
                            className="step-helper"
                            style={{ margin: 0 }}
                          >
                            Weight {(component.weight * 100).toFixed(0)}%
                          </div>
                        </div>

                        {metricEntries.length > 0 && (
                          <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5"
                          >
                            {metricEntries.map(([metricKey, metricValue]) => (
                              <div key={metricKey}>
                                <div
                                  className="step-helper"
                                  style={{
                                    margin: 0,
                                    textAlign: "left",
                                  }}
                                >
                                  {METRIC_LABELS[metricKey] || metricKey}
                                </div>

                                <div
                                  style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    marginTop: 4,
                                    color: "var(--arn-txt)",
                                  }}
                                >
                                  {formatMetricValue(metricKey, metricValue)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {goalDetails.length > 0 && (
                          <div
                            style={{
                              marginTop: metricEntries.length > 0 ? 20 : 0,
                              paddingTop: 16,
                              borderTop: "1px solid var(--arn-bdr)",
                            }}
                          >
                            <div
                              className="grid grid-cols-1 gap-3"
                            >
                              {goalDetails.map((goal, index) => {
                                const item = isRecordLike(goal) ? goal : {};

                                return (
                                  <div
                                    key={index}
                                    style={{
                                      padding: "12px 0",
                                      borderBottom:
                                        index < goalDetails.length - 1
                                          ? "1px solid var(--arn-bdr)"
                                          : "none",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        color: "var(--arn-txt)",
                                      }}
                                    >
                                      {String(
                                        item.goalType ?? `Goal ${index + 1}`
                                      )}
                                    </div>

                                    <div
                                      className="step-helper"
                                      style={{
                                        textAlign: "left",
                                        marginTop: 6,
                                      }}
                                    >
                                      Target {formatCurrency(item.targetAmount)} ·{" "}
                                      Corpus {formatCurrency(item.currentCorpus)} ·{" "}
                                      Readiness{" "}
                                      {formatMetricValue(
                                        "averageReadiness",
                                        item.readinessPercentage
                                      )}
                                      % ·{" "}
                                      {item.onTrack ? "On track" : "Behind"}
                                      {item.timelineYears != null
                                        ? ` · ${item.timelineYears} yrs`
                                        : ""}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "balanceSheet" && (
        <div className="space-y-6">
          {balanceSheetSections.map((section) => (
            <div key={section.section}>
              <div className="onboard-section-label">{section.section}</div>
              <div className="glass-card rounded-[10px] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">
                        Item
                      </th>
                      <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-xs font-normal text-[var(--arn-txt-3)]">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item) => (
                      <tr key={item.label} className="border-b border-[var(--arn-bdr)] last:border-0">
                        <td className="px-4 py-3 text-sm text-[var(--arn-txt-2)]">{item.label}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-[var(--arn-txt)]">
                          {item.value != null ? formatCurrency(item.value) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "profitLoss" && (
        <div className="space-y-6">
          {profitLossSections.map((section) => (
            <div key={section.section}>
              <div className="onboard-section-label">{section.section}</div>
              <div className="glass-card rounded-[10px] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">
                        Item
                      </th>
                      <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-xs font-normal text-[var(--arn-txt-3)]">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item) => (
                      <tr key={item.label} className="border-b border-[var(--arn-bdr)] last:border-0">
                        <td className="px-4 py-3 text-sm text-[var(--arn-txt-2)]">{item.label}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-[var(--arn-txt)]">
                          {item.value != null ? formatCurrency(item.value) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="glass-card rounded-[10px] border border-[var(--arn-amber)] bg-[var(--arn-amber-sel-bg)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--arn-txt-2)]">Net Monthly</span>
              <span
                className="text-lg font-bold"
                style={{ color: netMonthly != null && netMonthly >= 0 ? "#3b6d11" : "#b42318" }}
              >
                {netMonthly != null ? formatCurrency(netMonthly) : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="btn-primary btn-wide"
          style={{ marginTop: 20 }}
        >
          {isDownloading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Downloading...
            </span>
          ) : (
            "Download Plan"
          )}
        </button>
      )}
    </div>
  );
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
