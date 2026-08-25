import { COLORS, type BrandKey } from "./colors";

export function brandVar(name: string): string {
  return `var(--arn-${name})`;
}

export function toneAvatar(brand: BrandKey): string {
  const c = COLORS.brand[brand];
  return `bg-[${c.bg}] text-[${c.txt}]`;
}

export function toneStatusTag(brand: BrandKey): string {
  const c = COLORS.brand[brand];
  return `bg-[${c.bg}] text-[${c.txt}]`;
}

export function toneFilterPill(): string {
  return `border-[var(--arn-brand)] bg-[var(--arn-brand)] text-[var(--arn-bg)]`;
}

export function getChartColor(tone: "amber" | "green" | "blue" | "purple" | "red" | "teal"): string {
  const map = {
    amber: COLORS.brand.amber.DEFAULT,
    green: COLORS.brand.green.DEFAULT,
    blue: COLORS.brand.blue.DEFAULT,
    purple: COLORS.brand.purple.DEFAULT,
    red: COLORS.brand.red.DEFAULT,
    teal: COLORS.brand.teal.DEFAULT,
  };
  return map[tone];
}

export const HOLDINGS_COLORS = {
  equity: COLORS.brand.green.DEFAULT,
  debt: COLORS.brand.blue.DEFAULT,
  gold: COLORS.brand.amber.DEFAULT,
};

export const CHART_PALETTE_CSS = [
  "var(--arn-brand)",
  "var(--arn-green)",
  "var(--arn-blue)",
  "var(--arn-pur-txt)",
  "var(--arn-tel-txt)",
  "var(--arn-red)",
];

export const FALLBACK_COLORS_CSS = [
  "var(--arn-brand)",
  "var(--arn-blue)",
  "var(--arn-green)",
  "var(--arn-tel-txt)",
  "var(--arn-pur-txt)",
  "var(--arn-red)",
];
