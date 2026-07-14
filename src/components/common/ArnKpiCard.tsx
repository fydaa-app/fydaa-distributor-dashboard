type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal" | "gray";

const toneClasses: Record<ArnTone, string> = {
  amber: "from-[#BA7517] to-[#BA7517]",
  green: "from-[#3B6D11] to-[#3B6D11]",
  blue: "from-[#185FA5] to-[#185FA5]",
  red: "from-[#A32D2D] to-[#A32D2D]",
  purple: "from-[#534AB7] to-[#534AB7]",
  teal: "from-[#0F6E56] to-[#0F6E56]",
  gray: "from-[#a8a8a3] to-[#a8a8a3]",
};

interface ArnKpiCardProps {
  label: string;
  value: string;
  trendText: string;
  tone: ArnTone;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

export default function ArnKpiCard({
  label,
  value,
  trendText,
  tone,
  trend = "neutral",
  icon,
}: ArnKpiCardProps) {
  const trendClass =
    trend === "up"
      ? "text-[#3B6D11]"
      : trend === "down"
      ? "text-[#A32D2D]"
      : "text-[#a8a8a3]";

  return (
    <div className="relative overflow-hidden rounded-[14px] bg-[#f6f5f2] p-4 sm:p-5 dark:bg-[#252522]">
      <div className={`absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b ${toneClasses[tone]}`} />
      <div className="mb-2 text-xs text-[#a8a8a3]">{label}</div>
      <div className="mb-2 text-2xl font-black leading-none text-[#1a1a18] sm:text-3xl dark:text-[#f0efe8]">
        {value}
      </div>
      <div className={`flex items-center gap-2 text-xs sm:text-sm ${trendClass}`}>
        {icon ? <i aria-hidden="true" className={icon} /> : <span>{trend === "up" ? "↗" : trend === "down" ? "↘" : "•"}</span>}
        <span>{trendText}</span>
      </div>
    </div>
  );
}
