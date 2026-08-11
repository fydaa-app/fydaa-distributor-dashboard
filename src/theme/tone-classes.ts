import { COLORS, type BrandKey } from "./colors";

export function brandVar(name: string): string {
  return `var(--arn-${name})`;
}

export function toneAvatar(brand: BrandKey): string {
  const c = COLORS.brand[brand];
  return `bg-[${c.bg}] text-[${c.txt}]`;
}

export function toneKpiGradient(brand: BrandKey | "gray"): string {
  if (brand === "gray") {
    return `from-[${COLORS.txt3}] to-[${COLORS.txt3}]`;
  }
  const c = COLORS.brand[brand];
  return `from-[${c.DEFAULT}] to-[${c.DEFAULT}]`;
}

export function toneProgressColor(brand: BrandKey): string {
  return COLORS.brand[brand].DEFAULT;
}

export function toneStatusTag(brand: BrandKey): string {
  const c = COLORS.brand[brand];
  return `bg-[${c.bg}] text-[${c.txt}]`;
}

export function toneFilterPill(): string {
  return `border-[var(--arn-brand)] bg-[var(--arn-brand)] text-[var(--arn-bg)]`;
}

export function toneToggle(brand: BrandKey): string {
  const c = COLORS.brand[brand];
  return `bg-[${c.DEFAULT}]`;
}

export function toneCompactKpi(brand: BrandKey): string {
  const c = COLORS.brand[brand];
  return `bg-[${c.DEFAULT}]`;
}

export const CHART_PALETTE_CSS = [
  "var(--arn-brand)",
  "var(--arn-green)",
  "var(--arn-blue)",
  "var(--arn-pur-txt)",
  "var(--arn-tel-txt)",
  "var(--arn-red)",
];

export const CHART_PALETTE_RAW = [
  COLORS.brand.amber.DEFAULT,
  COLORS.green,
  COLORS.blue,
  COLORS.purple,
  COLORS.teal,
  COLORS.red,
];

export const FALLBACK_COLORS_CSS = [
  "var(--arn-brand)",
  "var(--arn-blue)",
  "var(--arn-green)",
  "var(--arn-tel-txt)",
  "var(--arn-pur-txt)",
  "var(--arn-red)",
];

export const FALLBACK_COLORS_RAW = [
  COLORS.brand.amber.DEFAULT,
  COLORS.blue,
  COLORS.green,
  COLORS.teal,
  COLORS.purple,
  COLORS.red,
];

export const SIP_HEALTH_COLORS = {
  amber: COLORS.brand.amber.DEFAULT,
  green: COLORS.green,
  blue: COLORS.blue,
  red: COLORS.red,
  purple: COLORS.purple,
  teal: COLORS.teal,
};

export function getChartColor(tone: "amber" | "green" | "blue" | "purple" | "red" | "teal"): string {
  const map = {
    amber: COLORS.brand.amber.DEFAULT,
    green: COLORS.green,
    blue: COLORS.blue,
    purple: COLORS.purple,
    red: COLORS.red,
    teal: COLORS.teal,
  };
  return map[tone];
}

export const HOLDINGS_COLORS = {
  equity: COLORS.green,
  debt: COLORS.blue,
  gold: COLORS.brand.amber.DEFAULT,
};

export const TREND_CLASSES = {
  up: `text-[${COLORS.green}]`,
  down: `text-[${COLORS.red}]`,
  neutral: `text-[${COLORS.txtAlt}]`,
};
