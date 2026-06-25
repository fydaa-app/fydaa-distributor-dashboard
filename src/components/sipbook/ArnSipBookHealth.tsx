"use client";

import { useCallback, useEffect, useState } from "react";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnProgressBar from "@/components/common/ArnProgressBar";
import { getArnSipBookHealth } from "@/services/arnSipBookService";
import type { ArnSipBookHealthMetric } from "@/types/arnSipBook";

const toneColors = {
  amber: "#BA7517",
  green: "#3B6D11",
  blue: "#185FA5",
  red: "#A32D2D",
  purple: "#534AB7",
  teal: "#0F6E56",
};

export default function ArnSipBookHealth() {
  const [metrics, setMetrics] = useState<ArnSipBookHealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setMetrics(await getArnSipBookHealth());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load SIP health.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  if (isLoading) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <div className="mb-4 h-4 w-28 animate-pulse rounded bg-[var(--arn-bg-2)]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="animate-pulse rounded-[14px] bg-[var(--arn-bg-2)] p-4">
              <div className="mb-3 h-3 w-24 rounded bg-[var(--arn-bg-3)]" />
              <div className="mb-2 h-5 w-16 rounded bg-[var(--arn-bg-3)]" />
              <div className="h-1 w-full rounded bg-[var(--arn-bg-3)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <ArnErrorState
          title="Could not load SIP health"
          message={error}
          retry={loadHealth}
        />
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <div className="mb-4 text-sm font-black text-[var(--arn-txt)] sm:text-base">SIP health</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[14px] bg-[var(--arn-bg-2)] p-4">
            <div className="mb-1 text-xs text-[var(--arn-txt-3)]">{metric.label}</div>
            <div className="mb-2 text-lg font-black text-[var(--arn-txt)]">{metric.value}</div>
            {metric.progress !== undefined ? (
              <div className="mb-2">
                <ArnProgressBar value={metric.progress} color={toneColors[metric.tone]} />
              </div>
            ) : null}
            <div className="text-[10px] text-[var(--arn-txt-3)]">{metric.caption}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
