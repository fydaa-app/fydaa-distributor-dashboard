"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnToggle from "@/components/common/ArnToggle";
import type { ArnShareContentKey } from "@/types/arnShare";

const contentOptions: { key: ArnShareContentKey; label: string }[] = [
  { key: "portfolio-valuation", label: "Portfolio valuation" },
  { key: "xirr-returns", label: "XIRR & returns" },
  { key: "sip-schedule", label: "SIP schedule" },
  { key: "capital-gains", label: "Capital gains summary" },
];

interface ArnShareContentTogglesProps {
  content: Record<ArnShareContentKey, boolean>;
  onToggle: (key: ArnShareContentKey, enabled: boolean) => void;
  selectedCount: number;
  onSend: () => void;
  isSending?: boolean;
}

export default function ArnShareContentToggles({
  content,
  onToggle,
  selectedCount,
  onSend,
  isSending = false,
}: ArnShareContentTogglesProps) {
  const hasContent = Object.values(content).some(Boolean);

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title="Step 3 — report content" />

      <div className="space-y-0">
        {contentOptions.map((option, index) => (
          <div
            key={option.key}
            className={`flex items-center gap-3 py-2.5 ${index < contentOptions.length - 1 ? "border-b border-[var(--arn-bdr)]" : ""}`}
          >
            <span className="flex-1 text-xs text-[var(--arn-txt)]">{option.label}</span>
            <ArnToggle
              checked={content[option.key]}
              onChange={(checked) => onToggle(option.key, checked)}
              label={option.label}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={selectedCount === 0 || !hasContent || isSending}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-[var(--arn-amber)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <i aria-hidden="true" className="ti ti-send" />
        {isSending
          ? "Sending..."
          : selectedCount === 0
            ? "Select clients to send"
            : `Send to ${selectedCount} client${selectedCount === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
