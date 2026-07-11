"use client";

import { cn } from "@/lib/utils";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import type { ArnShareChannel } from "@/types/arnShare";

const channels: { id: ArnShareChannel; label: string; icon: string }[] = [
  { id: "whatsapp", label: "WhatsApp", icon: "ti ti-message" },
  { id: "email", label: "Email", icon: "ti ti-mail" },
  { id: "copy-link", label: "Copy link", icon: "ti ti-link" },
  { id: "download-pdf", label: "Download PDF", icon: "ti ti-download" },
];

interface ArnShareChannelPickerProps {
  selectedChannel: ArnShareChannel;
  onChange: (channel: ArnShareChannel) => void;
}

export default function ArnShareChannelPicker({
  selectedChannel,
  onChange,
}: ArnShareChannelPickerProps) {
  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title="Step 2 — choose channel" />
      <div className="grid grid-cols-2 gap-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            onClick={() => onChange(channel.id)}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-xs transition-all duration-100",
              selectedChannel === channel.id
                ? "border-[var(--arn-amber)] bg-[var(--arn-amber-bg)] font-semibold text-[var(--arn-amber-txt)]"
                : "border-[var(--arn-bdr-2)] text-[var(--arn-txt-2)] hover:border-[var(--arn-bdr)] hover:bg-[var(--arn-bg-2)]"
            )}
          >
            <i aria-hidden="true" className={channel.icon} />
            {channel.label}
          </button>
        ))}
      </div>
    </div>
  );
}
