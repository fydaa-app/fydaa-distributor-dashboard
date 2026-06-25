export default function ArnProgressBar({
  value,
  color = "#BA7517",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-[4px] bg-black/10 dark:bg-white/10">
      <div
        className="h-full rounded-[2px]"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}
