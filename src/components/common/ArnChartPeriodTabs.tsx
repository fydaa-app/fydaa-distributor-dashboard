interface ArnChartPeriodTabsProps {
  options: string[];
  active: string;
  onChange: (value: string) => void;
}

export default function ArnChartPeriodTabs({
  options,
  active,
  onChange,
}: ArnChartPeriodTabsProps) {
  return (
    <div className="flex gap-[1px] rounded-[8px] bg-[#f6f5f2] p-1 dark:bg-[#252522]">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-[6px] px-3 py-1.5 text-xs font-bold ${
            active === option
              ? "bg-white text-[#1a1a18] shadow-sm dark:bg-[#1c1c1a] dark:text-[#f0efe8]"
              : "text-[#6b6b67] dark:text-[#9a9a93]"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
