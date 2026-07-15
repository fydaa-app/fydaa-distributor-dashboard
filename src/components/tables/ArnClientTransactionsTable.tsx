"use client";

import { Fragment, useState } from "react";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type {
  ArnClientTransaction,
  ArnMfOrderState,
  ArnMfTransactionStatus,
} from "@/types/arnClient";

interface ArnClientTransactionsTableProps {
  transactions: ArnClientTransaction[];
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

const statusConfig: Record<
  ArnMfTransactionStatus,
  { label: string; variant: "active" | "due" | "failed" | "processing" }
> = {
  FULLY_SUCCESSFUL: { label: "Success", variant: "active" },
  PARTIALLY_SUCCESSFUL: { label: "Partial", variant: "due" },
  FAILED: { label: "Failed", variant: "failed" },
  IN_PROCESS: { label: "In Process", variant: "processing" },
};

const orderStateConfig: Record<
  ArnMfOrderState,
  { label: string; variant: "active" | "failed" | "processing" }
> = {
  successful: { label: "Successful", variant: "active" },
  failed: { label: "Failed", variant: "failed" },
  submitted: { label: "Submitted", variant: "processing" },
};

export default function ArnClientTransactionsTable({ transactions }: ArnClientTransactionsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (transactionId: string) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-[14px] bg-[var(--arn-bg-2)] p-5 text-center text-sm text-[var(--arn-txt-2)]">
        No transactions available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="w-10 border-b border-[var(--arn-bdr)] px-4 py-3" />
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Transaction ID</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-center text-xs font-normal text-[var(--arn-txt-3)]">Total</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-center text-xs font-normal text-[var(--arn-txt-3)]">Success</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-center text-xs font-normal text-[var(--arn-txt-3)]">Failed</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Total Amount</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Processed</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Status</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const isExpanded = expandedRows.has(transaction.transactionId);
            const status = statusConfig[transaction.status];

            return (
              <Fragment key={transaction.transactionId}>
                <tr className="transition-colors hover:[&_td]:bg-[var(--arn-bg-2)]">
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleRow(transaction.transactionId)}
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                      aria-expanded={isExpanded}
                      className="grid size-6 place-items-center rounded text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-3)]"
                    >
                      <i
                        aria-hidden="true"
                        className={`ti ti-chevron-right transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </button>
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 font-semibold text-[var(--arn-txt)]">
                    {transaction.transactionId}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-center text-[var(--arn-txt-3)]">
                    {transaction.totalOrders}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-center text-[var(--arn-green)]">
                    {transaction.successfulOrders}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-center text-[var(--arn-red)]">
                    {transaction.failedOrders}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                    {formatCurrency(transaction.totalAmount)}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">
                    {formatCurrency(transaction.processedAmount)}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <ArnStatusTag label={status.label} variant={status.variant} />
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">
                    {formatDate(transaction.createdAt)}
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={9} className="border-b border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-6 py-4">
                      <div className="mb-3 text-xs font-bold text-[var(--arn-txt-2)]">
                        Order details ({transaction.orders.length} orders)
                      </div>
                      <div className="overflow-hidden rounded-[10px] border border-[var(--arn-bdr)]">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="bg-[var(--arn-bg-3)]">
                              <th className="px-4 py-2 text-left font-semibold text-[var(--arn-txt-2)]">Scheme</th>
                              <th className="px-4 py-2 text-left font-semibold text-[var(--arn-txt-2)]">Scheme Name</th>
                              <th className="px-4 py-2 text-left font-semibold text-[var(--arn-txt-2)]">State</th>
                              <th className="px-4 py-2 text-left font-semibold text-[var(--arn-txt-2)]">Amount</th>
                              <th className="px-4 py-2 text-left font-semibold text-[var(--arn-txt-2)]">Processed</th>
                              <th className="px-4 py-2 text-left font-semibold text-[var(--arn-txt-2)]">Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transaction.orders.map((order) => {
                              const orderState = orderStateConfig[order.state];
                              return (
                                <tr key={order.id} className="border-t border-[var(--arn-bdr)]">
                                  <td className="px-4 py-2 font-mono text-[var(--arn-txt-3)]">{order.scheme}</td>
                                  <td className="px-4 py-2 text-[var(--arn-txt-2)]">{order.schemeName}</td>
                                  <td className="px-4 py-2">
                                    <ArnStatusTag label={orderState.label} variant={orderState.variant} />
                                  </td>
                                  <td className="px-4 py-2 text-[var(--arn-txt-2)]">{formatCurrency(order.amount)}</td>
                                  <td className="px-4 py-2 text-[var(--arn-txt-2)]">{formatCurrency(order.processedAmount)}</td>
                                  <td className="px-4 py-2 text-[var(--arn-txt-3)]">{order.lastError || order.failureCode || "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
