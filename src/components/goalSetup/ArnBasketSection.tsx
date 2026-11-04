"use client";

import { useCallback, useEffect, useState } from "react";
import ArnBasketWizard from "@/components/goalSetup/ArnBasketWizard";
import {
  BASKET_BAR_COLORS,
  canDeleteBasket,
  canEditBasketFunds,
  formatBasketMoney,
  fundDisplayName,
  isDefaultBasket,
  shortFundLabel,
} from "@/components/goalSetup/arnBasketUtils";
import {
  deleteCustomBasketForUser,
  getBasketDefaults,
  getMyBasketsForUser,
  type BasketItem,
} from "@/services/arnStockApi";

interface ArnBasketSectionProps {
  userId: number;
  clientName: string;
  onSelect: (basket: BasketItem) => void;
  onCreated: (basket: BasketItem) => void;
}

function AllocationBar({ funds }: { funds: BasketItem["funds"] }) {
  const rows = (funds || []).filter((fund) => Number(fund.weight) > 0);
  const total = rows.reduce((sum, fund) => sum + Number(fund.weight), 0) || 100;
  return (
    <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-[var(--arn-bg-2)]">
      {rows.map((fund, index) => (
        <div
          key={`${fund.mfId}-${index}`}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{
            width: `${(Number(fund.weight) / total) * 100}%`,
            background: BASKET_BAR_COLORS[index % BASKET_BAR_COLORS.length],
          }}
        />
      ))}
    </div>
  );
}

function BasketCard({
  basket,
  onInvest,
  onEdit,
  onDelete,
}: {
  basket: BasketItem;
  onInvest: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const funds = (basket.funds || []).slice(0, 5);
  const mode = String(basket.investmentMode || "").toUpperCase();
  const amount = basket.investAmount ?? basket.minInvestment;
  const isCustom = !isDefaultBasket(basket);

  return (
    <div className="flex h-full min-h-[260px] flex-col rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0 truncate text-[15px] font-bold text-[var(--arn-txt)]">
          {basket.name}
        </div>
        {mode === "SIP" || mode === "LUMPSUM" ? (
          <span className="shrink-0 rounded-full bg-[var(--arn-amber-bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--arn-amber)]">
            {mode === "SIP" ? "SIP" : "One-time"}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-[var(--arn-bg-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--arn-txt-3)]">
            Flexible
          </span>
        )}
      </div>

      <div className="mb-3 text-xs text-[var(--arn-txt-3)]">
        {funds.length} fund{funds.length === 1 ? "" : "s"}
        {amount ? ` · from ${formatBasketMoney(amount)}` : ""}
      </div>

      {funds.length > 0 ? (
        <>
          <AllocationBar funds={funds} />
          <div className="mb-4 min-h-0 flex-1 space-y-2 overflow-hidden">
            {funds.map((fund, index) => (
              <div
                key={`${fund.mfId}-${index}`}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium text-[var(--arn-txt-2)]">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: BASKET_BAR_COLORS[index % BASKET_BAR_COLORS.length] }}
                  />
                  <span className="truncate uppercase tracking-wide">
                    {shortFundLabel(fundDisplayName(fund))}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--arn-txt)]">
                  {Math.round(Number(fund.weight) || 0)}%
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mb-4 flex-1 text-sm text-[var(--arn-txt-3)]">Funds will appear after setup.</div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={onInvest}
          className="w-full rounded-[10px] border border-[var(--arn-bdr)] py-2.5 text-[13px] font-semibold text-[var(--arn-amber)] transition-colors hover:border-[var(--arn-amber)] hover:bg-[var(--arn-amber-bg)]"
        >
          Invest in basket
        </button>
        {isCustom && (onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex-1 rounded-[10px] py-2 text-xs font-semibold text-[var(--arn-txt-2)] hover:text-[var(--arn-txt)]"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 rounded-[10px] py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArnBasketSection({
  userId,
  clientName,
  onSelect,
  onCreated,
}: ArnBasketSectionProps) {
  const [defaults, setDefaults] = useState<BasketItem[]>([]);
  const [customs, setCustoms] = useState<BasketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editBasket, setEditBasket] = useState<BasketItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const hasValidUserId = Number.isFinite(userId) && userId > 0;

    const defaultsPromise = getBasketDefaults();
    const customsPromise = hasValidUserId
      ? getMyBasketsForUser(userId)
      : Promise.reject(new Error("Client userId is missing"));

    const [defaultsResult, customsResult] = await Promise.allSettled([
      defaultsPromise,
      customsPromise,
    ]);

    if (defaultsResult.status === "fulfilled") {
      setDefaults(defaultsResult.value);
    } else {
      setDefaults([]);
    }

    if (customsResult.status === "fulfilled") {
      setCustoms(customsResult.value);
    } else {
      setCustoms([]);
    }

    const messages: string[] = [];
    if (defaultsResult.status === "rejected") {
      const raw =
        defaultsResult.reason instanceof Error
          ? defaultsResult.reason.message
          : "Unable to load curated baskets";
      // Quiet Nest :id ParseIntPipe noise; still surface other defaults failures.
      if (!/numeric string is expected/i.test(raw)) {
        messages.push(raw);
      }
    }
    // Customs list failures: empty section only (no ParseIntPipe / missing-route banner).
    setError(messages.length ? messages.join(" ") : null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleDelete(basket: BasketItem) {
    if (!canDeleteBasket(basket)) return;
    const ok = window.confirm(`Delete “${basket.name}” for ${clientName}? This cannot be undone.`);
    if (!ok) return;
    setDeletingId(basket.id);
    try {
      await deleteCustomBasketForUser(userId, basket.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete basket");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[var(--arn-txt)] sm:text-lg">Baskets</h3>
          <p className="mt-0.5 text-sm text-[var(--arn-txt-2)]">
            Curated mixes, or build a custom basket for {clientName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditBasket(null);
            setWizardOpen(true);
          }}
          className="shrink-0 rounded-[10px] border border-[var(--arn-bdr)] px-3 py-2 text-xs font-semibold text-[var(--arn-amber)] hover:border-[var(--arn-amber)]"
        >
          + Create
        </button>
      </div>

      {loading && (
        <div className="rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-6 text-center text-sm text-[var(--arn-txt-3)]">
          Loading baskets…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && (
        <>
          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--arn-txt-3)]">
              Curated
            </div>
            {defaults.length === 0 ? (
              <div className="rounded-[12px] border border-[var(--arn-bdr)] p-4 text-sm text-[var(--arn-txt-3)]">
                No curated baskets available right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {defaults.map((basket) => (
                  <BasketCard
                    key={`default-${basket.id}`}
                    basket={basket}
                    onInvest={() => onSelect(basket)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--arn-txt-3)]">
              This client&apos;s baskets
            </div>
            {customs.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  setEditBasket(null);
                  setWizardOpen(true);
                }}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-5 py-10 text-center hover:border-[var(--arn-amber)]"
              >
                <span className="text-[15px] font-bold text-[var(--arn-txt)]">
                  Create a custom basket
                </span>
                <span className="max-w-[240px] text-xs text-[var(--arn-txt-3)]">
                  Pick 2 to 5 funds and set weights for {clientName}
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {customs.map((basket) => (
                  <BasketCard
                    key={`custom-${basket.id}`}
                    basket={basket}
                    onInvest={() => onSelect(basket)}
                    onEdit={
                      canEditBasketFunds(basket)
                        ? () => {
                            setEditBasket(basket);
                            setWizardOpen(true);
                          }
                        : undefined
                    }
                    onDelete={
                      canDeleteBasket(basket) && deletingId !== basket.id
                        ? () => void handleDelete(basket)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {wizardOpen && (
        <ArnBasketWizard
          userId={userId}
          editBasket={editBasket}
          onClose={() => {
            setWizardOpen(false);
            setEditBasket(null);
          }}
          onCreated={(basket) => {
            setWizardOpen(false);
            setEditBasket(null);
            onCreated(basket);
          }}
          onSaved={async () => {
            setWizardOpen(false);
            setEditBasket(null);
            await refresh();
          }}
        />
      )}
    </section>
  );
}
