import type { ArnHolding } from "@/types/arnClient";

interface ArnClientHoldingsListProps {
  holdings: ArnHolding[];
}

const FALLBACK_COLORS = ["#BA7517", "#185FA5", "#3B6D11", "#0F6E56", "#534AB7", "#A32D2D"];

function getCategoryColor(category: string, index: number): string {
  const normalized = category.replace(/\s+/g, "").toLowerCase();
  if (normalized === "fixedincomebonds") return "#185FA5";
  if (normalized === "gold") return "#BA7517";
  if (normalized === "indianstock") return "#3B6D11";
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export default function ArnClientHoldingsList({ holdings }: ArnClientHoldingsListProps) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-[12px] bg-[var(--arn-bg-2)] p-5 text-center text-xs text-[var(--arn-txt-2)]">
        No holdings available.
      </div>
    );
  }

  return (
    <div>
      {holdings.map((holding, index) => (
        <div
          key={`${holding.schemeName}-${index}`}
          className="flex items-center gap-3 border-b border-[var(--arn-bdr)] py-3 last:border-b-0"
        >
          <div
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: getCategoryColor(holding.category, index) }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-[var(--arn-txt)]">{holding.schemeName}</div>
            <div className="text-xs text-[var(--arn-txt-3)]">
              {holding.category} · {holding.allocationPercent}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-[var(--arn-txt)]">{holding.value}</div>
            <div className="text-xs text-[var(--arn-green)]">+{holding.xirr.toFixed(1)}% XIRR</div>
          </div>
        </div>
      ))}
    </div>
  );
}
