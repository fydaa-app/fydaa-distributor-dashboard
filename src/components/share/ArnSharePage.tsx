"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnShareKpis from "@/components/ecommerce/ArnShareKpis";
import ArnShareChannelPicker from "@/components/share/ArnShareChannelPicker";
import ArnShareClientSelector from "@/components/share/ArnShareClientSelector";
import ArnShareContentToggles from "@/components/share/ArnShareContentToggles";
import ArnShareSuccessToast from "@/components/share/ArnShareSuccessToast";
import ArnRecentSharesTable from "@/components/tables/ArnRecentSharesTable";
import {
  getArnRecentShares,
  getArnShareClients,
  resendArnShare,
  sendArnShare,
} from "@/services/arnShareService";
import type { ArnReportType } from "@/types/arnReports";
import type {
  ArnRecentShare,
  ArnShareChannel,
  ArnShareClientOption,
  ArnShareContentKey,
} from "@/types/arnShare";

const defaultContent: Record<ArnShareContentKey, boolean> = {
  "portfolio-valuation": true,
  "xirr-returns": true,
  "sip-schedule": true,
  "capital-gains": false,
};

const skeletonRows = Array.from({ length: 3 }, (_, index) => index);

function isReportType(value: string | null): value is ArnReportType {
  return (
    value === "valuation" ||
    value === "capital-gains" ||
    value === "sip-performance" ||
    value === "transaction-history" ||
    value === "xirr-summary" ||
    value === "aum-statement"
  );
}

export default function ArnSharePage() {
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get("clientId");
  const reportParam = searchParams.get("report");

  const [clients, setClients] = useState<ArnShareClientOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [channel, setChannel] = useState<ArnShareChannel>("whatsapp");
  const [content, setContent] = useState(defaultContent);
  const [shares, setShares] = useState<ArnRecentShare[]>([]);
  const [sharesTotal, setSharesTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [sharesError, setSharesError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ title: string; message: string } | null>(null);

  const reportType = isReportType(reportParam) ? reportParam : undefined;

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    setClientsError(null);

    try {
      const items = await getArnShareClients();
      setClients(items);

      if (clientIdParam && items.some((client) => client.id === clientIdParam)) {
        setSelectedIds([clientIdParam]);
      } else if (!clientIdParam) {
        setSelectedIds(items.slice(0, 2).map((client) => client.id));
      }
    } catch (err) {
      setClientsError(err instanceof Error ? err.message : "Could not load clients.");
    } finally {
      setClientsLoading(false);
    }
  }, [clientIdParam]);

  const loadShares = useCallback(async () => {
    setSharesLoading(true);
    setSharesError(null);

    try {
      const response = await getArnRecentShares({ page, pageSize: 5 });
      setShares(response.items);
      setSharesTotal(response.total);
    } catch (err) {
      setSharesError(err instanceof Error ? err.message : "Could not load recent shares.");
    } finally {
      setSharesLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const selectedClientNames = useMemo(
    () =>
      clients
        .filter((client) => selectedIds.includes(client.id))
        .map((client) => client.name),
    [clients, selectedIds]
  );

  const handleToggleClient = (clientId: string) => {
    setSelectedIds((current) =>
      current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId]
    );
  };

  const handleToggleContent = (key: ArnShareContentKey, enabled: boolean) => {
    setContent((current) => ({ ...current, [key]: enabled }));
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;

    setIsSending(true);

    try {
      const enabledContent = (Object.keys(content) as ArnShareContentKey[]).filter((key) => content[key]);
      const response = await sendArnShare({
        clientIds: selectedIds,
        channel,
        content: enabledContent,
        reportType,
      });

      const channelLabel =
        channel === "whatsapp"
          ? "WhatsApp"
          : channel === "email"
            ? "Email"
            : channel === "copy-link"
              ? "Copy link"
              : "Download PDF";

      setSuccessToast({
        title: `Reports sent via ${channelLabel}`,
        message: response.message,
      });

      await loadShares();
    } catch (err) {
      setSuccessToast({
        title: "Could not send reports",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async (share: ArnRecentShare) => {
    setResendingId(share.id);

    try {
      const response = await resendArnShare(share.id);
      setSuccessToast({
        title: "Report resent",
        message: response.message,
      });
      await loadShares();
    } catch (err) {
      setSuccessToast({
        title: "Could not resend report",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ArnShareKpis />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ArnShareClientSelector
          clients={clients}
          selectedIds={selectedIds}
          onToggle={handleToggleClient}
          isLoading={clientsLoading}
          error={clientsError}
          onRetry={loadClients}
        />

        <div className="flex flex-col gap-5 sm:gap-6">
          <ArnShareChannelPicker selectedChannel={channel} onChange={setChannel} />
          <ArnShareContentToggles
            content={content}
            onToggle={handleToggleContent}
            selectedCount={selectedIds.length}
            onSend={handleSend}
            isSending={isSending}
          />
        </div>
      </div>

      {successToast && (
        <ArnShareSuccessToast
          title={successToast.title}
          message={successToast.message}
          onDismiss={() => setSuccessToast(null)}
        />
      )}

      {selectedClientNames.length > 0 && !successToast && (
        <div className="text-xs text-[var(--arn-txt-3)]">
          Ready to share with {selectedClientNames.join(", ")}
          {reportType ? ` · ${reportType.replace(/-/g, " ")} report` : ""}
        </div>
      )}

      {sharesError ? (
        <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
          <ArnErrorState
            title="Could not load recent shares"
            message={sharesError}
            retry={loadShares}
          />
        </div>
      ) : sharesLoading ? (
        <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
          <div className="mb-4 h-5 w-36 animate-pulse rounded bg-[var(--arn-bg-2)]" />
          <div className="overflow-hidden rounded-[16px] border border-[var(--arn-bdr)]">
            {skeletonRows.map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-[var(--arn-bdr)] p-4">
                <div className="h-6 w-6 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ArnRecentSharesTable
          shares={shares}
          total={sharesTotal}
          page={page}
          pageSize={5}
          onPageChange={setPage}
          onResend={handleResend}
          resendingId={resendingId}
        />
      )}
    </div>
  );
}
