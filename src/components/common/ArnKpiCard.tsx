interface ArnKpiCardProps {
  label: string;
  value: string;
  trendText: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

export default function ArnKpiCard({
  label,
  value,
  trendText,
  trend = "neutral",
  icon,
}: ArnKpiCardProps) {
  const trendClass =
    trend === "up"
      ? "text-[#3B6D11]"
      : trend === "down"
      ? "text-[#A32D2D]"
      : "text-[var(--arn-txt-3)]";

  return (
    <div className="relative overflow-hidden rounded-[14px] bg-[var(--arn-bg-2)] p-4 sm:p-5 dark:bg-[var(--arn-bg-2)]">
      <div className="absolute right-0 top-0 h-full w-1.5 bg-[var(--arn-amber)]" />
      <div className="mb-2 text-xs text-[var(--arn-txt-2)]">{label}</div>
      <div className="mb-2 text-2xl font-black leading-none text-[var(--arn-txt)] sm:text-3xl">
        {value}
      </div>
      <div className={`flex items-center gap-2 text-xs sm:text-sm ${trendClass}`}>
        {icon ? <i aria-hidden="true" className={icon} /> : <span>{trend === "up" ? "↗" : trend === "down" ? "↘" : "•"}</span>}
        <span>{trendText}</span>
      </div>
    </div>
  );
}
