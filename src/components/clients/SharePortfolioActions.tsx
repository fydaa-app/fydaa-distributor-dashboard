"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import {
  sharePortfolio,
  type SharePortfolioChannel,
} from "@/services/arnStockApi";

interface SharePortfolioActionsProps {
  userId: string;
  variant: "icon" | "labeled";
}

function ShareTip({
  tip,
  children,
}: {
  tip: string;
  children: React.ReactNode;
}) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  const show = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setAnchor({ top: rect.top, left: rect.left + rect.width / 2 });
  };

  return (
    <span
      className="inline-flex"
      onMouseEnter={(event) => show(event.currentTarget)}
      onMouseLeave={() => setAnchor(null)}
      onFocus={(event) => show(event.currentTarget)}
      onBlur={() => setAnchor(null)}
    >
      {children}
      {anchor && (
        <span
          role="tooltip"
          style={{ top: anchor.top - 8, left: anchor.left }}
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[8px] bg-[var(--arn-txt)] px-2.5 py-1 text-[11px] font-semibold text-[var(--arn-bg)] shadow-sm"
        >
          {tip}
        </span>
      )}
    </span>
  );
}

const CHANNELS: { channel: SharePortfolioChannel; label: string; tip: string; icon: string }[] = [
  {
    channel: "whatsapp",
    label: "Share portfolio WhatsApp",
    tip: "Share portfolio on WhatsApp",
    icon: "ti-brand-whatsapp",
  },
  {
    channel: "email",
    label: "Share portfolio email",
    tip: "Share portfolio by email",
    icon: "ti-mail",
  },
];

export default function SharePortfolioActions({
  userId,
  variant,
}: SharePortfolioActionsProps) {
  const [pendingChannel, setPendingChannel] = useState<SharePortfolioChannel | null>(null);

  const handleShare = async (
    event: React.MouseEvent<HTMLButtonElement>,
    channel: SharePortfolioChannel
  ) => {
    event.stopPropagation();
    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId) || pendingChannel) return;

    const loadingLabel =
      channel === "whatsapp"
        ? "Sharing portfolio on WhatsApp..."
        : "Sharing portfolio by email...";
    const toastId = toast.loading(loadingLabel);
    setPendingChannel(channel);

    try {
      const message = await sharePortfolio(numericUserId, channel);
      toast.update(toastId, {
        render: message,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
    } catch (err) {
      toast.update(toastId, {
        render: err instanceof Error ? err.message : "Could not share portfolio.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setPendingChannel(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {CHANNELS.map(({ channel, label, tip, icon }) => {
        const isPending = pendingChannel === channel;
        const iconOnly = variant === "icon";
        return (
          <ShareTip key={channel} tip={tip}>
            <button
              type="button"
              aria-label={label}
              disabled={pendingChannel !== null}
              onClick={(event) => void handleShare(event, channel)}
              className={
                iconOnly
                  ? "grid size-9 place-items-center rounded-[8px] border border-[var(--arn-bdr)] text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)] disabled:cursor-not-allowed disabled:opacity-60"
                  : "inline-flex items-center justify-center gap-1 rounded-[8px] border border-[var(--arn-bdr-2)] px-4 py-2.5 text-sm font-bold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)] disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              <i
                aria-hidden="true"
                className={`ti ${isPending ? "ti-loader animate-spin" : icon}`}
              />
              {!iconOnly && (isPending ? "Sending..." : label)}
            </button>
          </ShareTip>
        );
      })}
    </div>
  );
}
