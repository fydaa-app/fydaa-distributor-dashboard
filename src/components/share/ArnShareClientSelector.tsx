"use client";

import { cn } from "@/lib/utils";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnErrorState from "@/components/common/ArnErrorState";
import type { ArnShareClientOption } from "@/types/arnShare";

interface ArnShareClientSelectorProps {
  clients: ArnShareClientOption[];
  selectedIds: string[];
  onToggle: (clientId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function ArnShareClientSelector({
  clients,
  selectedIds,
  onToggle,
  isLoading = false,
  error,
  onRetry,
}: ArnShareClientSelectorProps) {
  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title="Step 1 — select clients" />

      {error ? (
        <ArnErrorState title="Could not load clients" message={error} retry={onRetry} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-md bg-[var(--arn-bg-2)]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {clients.map((client) => {
            const isSelected = selectedIds.includes(client.id);

            return (
              <button
                key={client.id}
                type="button"
                onClick={() => onToggle(client.id)}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-all duration-100",
                  isSelected
                    ? "border-[var(--arn-amber)] bg-[var(--arn-bg)]"
                    : "border-transparent bg-[var(--arn-bg-2)] hover:border-[var(--arn-bdr)] hover:bg-[var(--arn-bg)]"
                )}
              >
                <ArnClientAvatar initials={client.initials} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-[var(--arn-txt)]">{client.name}</div>
                  <div className="text-[10px] text-[var(--arn-txt-3)]">
                    {client.aum} · {client.xirr.toFixed(1)}% XIRR
                  </div>
                </div>
                <div
                  className={cn(
                    "ml-auto flex size-4 shrink-0 items-center justify-center rounded border",
                    isSelected
                      ? "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white"
                      : "border-[var(--arn-bdr-2)] bg-transparent"
                  )}
                >
                  {isSelected && <i aria-hidden="true" className="ti ti-check text-[9px]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
