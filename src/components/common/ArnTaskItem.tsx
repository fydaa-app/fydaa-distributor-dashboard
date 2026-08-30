import ArnStatusTag from "@/components/common/ArnStatusTag";

type ArnTaskTag = "Review" | "KYC" | "SIP" | "Call";

const tagVariant: Record<ArnTaskTag, "review" | "kyc" | "sip" | "call"> = {
  Review: "review",
  KYC: "kyc",
  SIP: "sip",
  Call: "call",
};

interface ArnTaskItemProps {
  text: string;
  tag: ArnTaskTag;
  done?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
}

export default function ArnTaskItem({ text, tag, done = false, onToggle, onRemove }: ArnTaskItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className="flex w-full cursor-pointer items-center gap-3 border-b border-[var(--arn-bdr)] py-3 text-left last:border-b-0 sm:py-4"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border ${
          done
            ? "border-[var(--arn-green)] bg-[var(--arn-green)] text-white"
            : "border-black/20 bg-transparent dark:border-white/20"
        }`}
      >
        {done && <span className="text-[11px] font-bold">✓</span>}
      </span>
      <span className="flex-1 text-sm font-semibold text-[var(--arn-txt)] sm:text-base">
        {text}
      </span>
      <ArnStatusTag label={tag} variant={tagVariant[tag]} size="task" />
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove task"
          className="ml-2 text-[var(--arn-txt-3)] hover:text-[var(--arn-amber)]"
        >
          ✕
        </button>
      )}
    </div>
  );
}
