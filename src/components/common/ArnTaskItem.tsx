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
}

export default function ArnTaskItem({ text, tag, done = false, onToggle }: ArnTaskItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 border-b border-black/10 py-3 text-left last:border-b-0 dark:border-white/10 sm:py-4"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border ${
          done
            ? "border-[#3B6D11] bg-[#3B6D11] text-white"
            : "border-black/20 bg-transparent dark:border-white/20"
        }`}
      >
        {done && <span className="text-[11px] font-bold">✓</span>}
      </span>
      <span className="flex-1 text-sm font-semibold text-[#1a1a18] sm:text-base dark:text-[#f0efe8]">
        {text}
      </span>
      <ArnStatusTag label={tag} variant={tagVariant[tag]} size="task" />
    </button>
  );
}
