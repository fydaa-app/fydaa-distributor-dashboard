import { cn } from "@/lib/utils";

type ArnCompactKpiTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

interface ArnCompactKpiCardProps {
  label: string;
  value: string;
  trendText: string;
  tone: ArnCompactKpiTone;
  trend?: "up" | "down" | "neutral";
}

const toneClasses: Record<ArnCompactKpiTone, string> = {
  amber: "bg-[var(--arn-amber)]",
  green: "bg-[var(--arn-green)]",
  blue: "bg-[var(--arn-blue)]",
  red: "bg-[var(--arn-red)]",
  purple: "bg-[var(--arn-pur-txt)]",
  teal: "bg-[var(--arn-tel-txt)]",
};

export default function ArnCompactKpiCard({
  label,
  value,
  trendText,
  tone,
  trend = "neutral",
}: ArnCompactKpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[var(--arn-radius)] bg-[var(--arn-bg-2)] p-3 sm:p-4">
      <div className={cn("absolute right-0 top-0 h-full w-[3px]", toneClasses[tone])} />
      <div className="mb-1 text-[10px] text-[var(--arn-txt-3)]">{label}</div>
      <div className="mb-1 text-lg font-bold leading-none text-[var(--arn-txt)] sm:text-[20px]">
        {value}
      </div>
      <div
        className={cn(
          "flex items-center gap-1 text-[10px] sm:text-xs",
          trend === "up" && "text-[var(--arn-green)]",
          trend === "down" && "text-[var(--arn-red)]",
          trend === "neutral" && "text-[var(--arn-txt-3)]"
        )}
      >
        <i aria-hidden="true" className={cn("ti", trend === "up" ? "ti-trending-up" : trend === "down" ? "ti-trending-down" : "ti-dot")} />
        <span>{trendText}</span>
      </div>
    </div>
  );
}
