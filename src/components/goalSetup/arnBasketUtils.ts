import type { BasketFund, BasketItem, BasketInvestmentMode } from "@/services/arnStockApi";

export const BASKET_AMOUNT_FLOOR = 1000;
export const BASKET_MIN_FUNDS = 2;
export const BASKET_MAX_FUNDS = 5;

export const BASKET_BAR_COLORS = [
  "var(--arn-amber)",
  "#5B8DEF",
  "#3DBE8B",
  "#E07A5F",
  "#9B7EBD",
];

export function firstPurchaseMin(fund: {
  minInitial?: number | null;
  minSip?: number | null;
  minInitialInvestment?: number | null;
  minSipAmount?: number | null;
}): number {
  const a = Number(fund?.minInitial ?? fund?.minInitialInvestment);
  const b = Number(fund?.minSip ?? fund?.minSipAmount);
  const vals = [a, b].filter((n) => Number.isFinite(n) && n > 0);
  return vals.length ? Math.max(...vals) : 0;
}

export function requiredBasketAmount(
  funds: Array<{ weight: number; minInitial?: number | null; minSip?: number | null }>,
  amountFloor = BASKET_AMOUNT_FLOOR
): number {
  const floor = Math.max(BASKET_AMOUNT_FLOOR, Number(amountFloor) || BASKET_AMOUNT_FLOOR);
  const rows = (funds || []).filter((fund) => Number(fund?.weight) > 0);
  if (!rows.length) return floor;
  let required = floor;
  for (const fund of rows) {
    const w = Number(fund.weight) / 100;
    if (!(w > 0)) continue;
    const need = firstPurchaseMin(fund);
    if (need > 0) required = Math.max(required, Math.ceil(need / w));
  }
  return required;
}

export function weightsSumOk(funds: Array<{ weight: number }>): boolean {
  const rows = funds || [];
  if (rows.length < BASKET_MIN_FUNDS || rows.length > BASKET_MAX_FUNDS) return false;
  if (rows.some((fund) => !(Number(fund.weight) > 0))) return false;
  const sum = rows.reduce((s, fund) => s + Number(fund.weight), 0);
  return Math.abs(sum - 100) <= 0.51;
}

export function seedWeights(count: number): number[] {
  const n = Math.max(1, Math.min(BASKET_MAX_FUNDS, Number(count) || 1));
  if (n === 1) return [100];
  const first = 40;
  const rest = 100 - first;
  const base = Math.floor(rest / (n - 1));
  const weights = [first];
  let used = first;
  for (let i = 1; i < n - 1; i += 1) {
    weights.push(base);
    used += base;
  }
  weights.push(100 - used);
  return weights;
}

export function equalWeights(count: number): number[] {
  const n = Math.max(1, Math.min(BASKET_MAX_FUNDS, Number(count) || 1));
  const base = Math.floor(100 / n);
  const weights = Array.from({ length: n }, () => base);
  weights[n - 1] = 100 - base * (n - 1);
  return weights;
}

export function isDefaultBasket(basket: BasketItem): boolean {
  if (basket.isDefault === true) return true;
  return String(basket.type || "").toUpperCase() === "DEFAULT";
}

export function basketModeLocked(basket: BasketItem | null | undefined): BasketInvestmentMode | null {
  if (!basket) return null;
  const mode = String(basket.investmentMode || "").toUpperCase();
  if (mode === "SIP" || mode === "LUMPSUM") return mode;
  return null;
}

export function canEditBasketFunds(basket: BasketItem | null | undefined): boolean {
  if (!basket || isDefaultBasket(basket)) return false;
  if (basket.canEditFunds === false) return false;
  if (basket.canEditFunds === true) return true;
  const mode = String(basket.investmentMode || "").toUpperCase();
  if (mode === "LUMPSUM") return true;
  const status = String(basket.sipStatus || "").toUpperCase();
  return !status || status === "INACTIVE";
}

export function canDeleteBasket(basket: BasketItem | null | undefined): boolean {
  return !!basket && !isDefaultBasket(basket) && Number(basket.id) > 0;
}

export function formatBasketMoney(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function shortFundLabel(name: string): string {
  const parts = String(name || "")
    .replace(/\s*-\s*(Direct|Regular).*$/i, "")
    .replace(/\s+Fund.*$/i, "")
    .trim()
    .split(/\s+/);
  return parts.slice(0, 3).join(" ") || name || "Fund";
}

export function fundDisplayName(fund: BasketFund): string {
  return (
    fund.fundName ||
    fund.scheme ||
    (fund.mfId ? `Fund ${fund.mfId}` : "Fund")
  );
}
