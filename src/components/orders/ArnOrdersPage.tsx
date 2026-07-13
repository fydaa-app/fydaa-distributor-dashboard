"use client";

import { useCallback, useEffect, useState } from "react";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnOrderActivityTimeline from "@/components/ecommerce/ArnOrderActivityTimeline";
import ArnOrderTypeSplitChart from "@/components/ecommerce/ArnOrderTypeSplitChart";
import ArnOrdersFilters from "@/components/orders/ArnOrdersFilters";
import ArnOrdersKpis from "@/components/orders/ArnOrdersKpis";
import ArnOrdersToolbar from "@/components/orders/ArnOrdersToolbar";
import ArnOrdersTable from "@/components/tables/ArnOrdersTable";
import { fetchOrders } from "@/services/arnOrdersService";
import type {
  ArnOrderFilter,
  ArnOrderItem,
  ArnOrderStatus,
  ArnOrderActivity,
  ArnOrderTypeSplit,
} from "@/types/arnOrders";

const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

export default function ArnOrdersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<ArnOrderFilter>("all");
  const [status, setStatus] = useState<ArnOrderStatus | "all">("all");
  const [view, setView] = useState<"table" | "list">("table");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<ArnOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [kpis, setKpis] = useState<{
    ordersToday: number;
    successfulToday: number;
    processedJune: number;
    transactedJuneInPaise: number;
    transactedAmountThisMonth: number;
    failedOrders: number;
    pendingOrders: number;
  } | null>(null);
  const [activities, setActivities] = useState<ArnOrderActivity[]>([]);
  const [typeSplit, setTypeSplit] = useState<ArnOrderTypeSplit[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchOrders({
        search: debouncedSearch,
        filter,
        status,
        page,
        pageSize: 5,
        type: "individual",
      });

      setOrders(response.orders);
      setTotal(response.total);
      setKpis(response.kpis);
      setActivities(response.activities);
      setTypeSplit(response.typeSplit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filter, page, status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter, status]);

  useEffect(() => {
    if (!actionMessage) return undefined;
    const timeout = window.setTimeout(() => setActionMessage(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [actionMessage]);

  const handleAction = (order: ArnOrderItem) => {
    setActionMessage(`${order.actionLabel} requested for ${order.clientShortName}.`);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ArnOrdersKpis kpis={kpis} isLoading={isLoading} error={error} retry={loadOrders} />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ArnOrderActivityTimeline activities={activities} isLoading={isLoading} error={error} retry={loadOrders} />
        <ArnOrderTypeSplitChart splits={typeSplit} isLoading={isLoading} error={error} retry={loadOrders} totalOrders={kpis?.processedJune ?? 0} />
      </div>

      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <ArnCardHeader title="All orders">
          <ArnOrdersFilters activeFilter={filter} activeStatus={status} onFilterChange={setFilter} onStatusChange={setStatus} />
        </ArnCardHeader>

        <div className="mb-5">
          <ArnOrdersToolbar
            search={search}
            onSearchChange={setSearch}
            view={view}
            onViewChange={setView}
            onRefresh={loadOrders}
          />
        </div>

        {error ? (
          <ArnErrorState
            title="Could not load orders"
            message={error}
            retry={loadOrders}
          />
        ) : isLoading ? (
          <div className="overflow-hidden rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)]">
            {skeletonRows.map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
                <div className="h-6 w-6 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-20 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <ArnEmptyState
              title="No orders found"
              description="Try changing your search, filter or status."
            />
          </div>
        ) : (
          <ArnOrdersTable
            orders={orders}
            total={total}
            page={page}
            pageSize={5}
            view={view}
            onPageChange={setPage}
            onAction={handleAction}
          />
        )}

        {actionMessage && (
          <div className="mt-4 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-4 py-3 text-sm font-semibold text-[var(--arn-txt)]">
            {actionMessage}
          </div>
        )}
      </div>
    </div>
  );
}
