"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { ArnOrderActivity } from "@/types/arnOrders";

function getStatusVariant(status: ArnOrderActivity["status"]) {
  if (status === "done") return "active";
  if (status === "pending") return "pending";
  if (status === "processing") return "processing";
  return "failed";
}

interface ArnOrderActivityTimelineProps {
  activities: ArnOrderActivity[];
  isLoading?: boolean;
  error?: string | null;
  retry?: () => void;
}

export default function ArnOrderActivityTimeline({ activities, isLoading, error, retry }: ArnOrderActivityTimelineProps) {
  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader
        title="Today's activity"
        action={
          <button
            type="button"
            onClick={() => retry?.()}
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--arn-amber)] transition-opacity hover:opacity-80"
          >
            <i aria-hidden="true" className="ti ti-refresh" />
            Refresh
          </button>
        }
      />
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-[10px] bg-[var(--arn-bg-2)] p-3">
              <div className="size-2 animate-pulse rounded-full bg-[var(--arn-bg-3)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[var(--arn-bg-3)]" />
              <div className="h-5 w-16 animate-pulse rounded bg-[var(--arn-bg-3)]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ArnErrorState
          title="Could not load activity"
          message={error}
          retry={retry}
        />
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 border-b border-[var(--arn-bdr)] py-3 last:border-b-0">
              <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: activity.status === "done" ? "var(--arn-green)" : activity.status === "failed" ? "var(--arn-red)" : activity.status === "pending" ? "var(--arn-amber)" : "var(--arn-blue)" }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-[var(--arn-txt)] sm:text-sm">{activity.title}</div>
                <div className="mt-0.5 truncate text-[10px] text-[var(--arn-txt-3)] sm:text-xs">{activity.description}</div>
              </div>
              <ArnStatusTag label={activity.statusLabel} variant={getStatusVariant(activity.status)} size="task" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
