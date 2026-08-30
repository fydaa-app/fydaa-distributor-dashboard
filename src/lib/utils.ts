import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(inputs.filter(Boolean).join(" "));
}

export function getBrandColor(): string {
  if (typeof document !== "undefined") {
    const toneEl = document.querySelector(".tone-amber, .tone-green, .tone-blue, .tone-red, .tone-purple, .tone-teal, .tone-jade");
    if (toneEl) {
      const value = getComputedStyle(toneEl).getPropertyValue("--arn-amber").trim();
      if (value) return value;
    }
  }
  return "#BA7517";
}
