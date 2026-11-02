"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import ArnFundSearchBar from "@/components/goalSetup/ArnFundSearchBar";
import {
  BASKET_AMOUNT_FLOOR,
  BASKET_MAX_FUNDS,
  BASKET_MIN_FUNDS,
  equalWeights,
  firstPurchaseMin,
  formatBasketMoney,
  requiredBasketAmount,
  seedWeights,
  weightsSumOk,
} from "@/components/goalSetup/arnBasketUtils";
import {
  createCustomBasketForUser,
  updateCustomBasketForUser,
  type BasketInvestmentMode,
  type BasketItem,
  type FundOption,
} from "@/services/arnStockApi";

interface WizardFund {
  mfId: number;
  name: string;
  scheme: string;
  minSip: number | null;
  minInitial: number | null;
  sipAllowed: boolean;
  purchaseAllowed: boolean;
  weight: number;
}

interface ArnBasketWizardProps {
  userId: number;
  editBasket?: BasketItem | null;
  onClose: () => void;
  onCreated: (basket: BasketItem) => void;
  onSaved: (basket: BasketItem) => void;
}

function fundMfId(fund: FundOption): number {
  return (
    Number(fund.localMfId ?? fund.selectedMfId ?? fund.mfId ?? fund.id) || 0
  );
}

function mapPickedFund(fund: FundOption): WizardFund {
  const mfId = fundMfId(fund);
  const name =
    fund.schemeName || fund.fundName || fund.stockName || fund.name || `Fund ${mfId}`;
  const sipAllowed =
    fund.sipAllowed !== false && fund.sip_allowed !== false;
  const purchaseAllowed =
    fund.purchaseAllowed !== false && fund.purchase_allowed !== false;
  return {
    mfId,
    name,
    scheme: String(fund.ticker || fund.scheme || fund.isin || fund.schemeCode || "").trim(),
    minSip: Number(fund.minSipAmount) > 0 ? Number(fund.minSipAmount) : null,
    minInitial: Number(fund.minInitialInvestment) > 0 ? Number(fund.minInitialInvestment) : null,
    sipAllowed,
    purchaseAllowed,
    weight: 0,
  };
}

function mapBasketFunds(list: BasketItem["funds"] | undefined): WizardFund[] {
  return (list || [])
    .map((fund) => {
      const mfId = Number(fund.mfId) || 0;
      if (mfId <= 0) return null;
      return {
        mfId,
        name: fund.fundName || fund.scheme || `Fund ${mfId}`,
        scheme: String(fund.scheme || "").trim(),
        minSip: Number(fund.minSipAmount) > 0 ? Number(fund.minSipAmount) : null,
        minInitial: Number(fund.minInitialInvestment) > 0 ? Number(fund.minInitialInvestment) : null,
        sipAllowed: fund.sipAllowed !== false,
        purchaseAllowed: fund.purchaseAllowed !== false,
        weight: Math.round(Number(fund.weight) || 0),
      } satisfies WizardFund;
    })
    .filter((f): f is WizardFund => !!f);
}

export default function ArnBasketWizard({
  userId,
  editBasket,
  onClose,
  onCreated,
  onSaved,
}: ArnBasketWizardProps) {
  const isEdit = Number(editBasket?.id) > 0;
  const [mode, setMode] = useState<BasketInvestmentMode | null>(null);
  const [step, setStep] = useState(1);
  const [funds, setFunds] = useState<WizardFund[]>([]);
  const [amount, setAmount] = useState(BASKET_AMOUNT_FLOOR);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSip = mode === "SIP";

  useEffect(() => {
    setSearchOpen(false);
    setError("");
    setBusy(false);
    setStep(1);
    if (isEdit && editBasket) {
      const nextMode =
        String(editBasket.investmentMode || "").toUpperCase() === "LUMPSUM" ? "LUMPSUM" : "SIP";
      setMode(nextMode);
      const mapped = mapBasketFunds(editBasket.funds);
      setFunds(mapped);
      setAmount(
        Math.max(
          BASKET_AMOUNT_FLOOR,
          Number(editBasket.investAmount) || Number(editBasket.minInvestment) || BASKET_AMOUNT_FLOOR
        )
      );
      setName(editBasket.name || "");
      setDescription(editBasket.description || "");
      return;
    }
    setMode(null);
    setFunds([]);
    setAmount(BASKET_AMOUNT_FLOOR);
    setName("");
    setDescription("");
  }, [isEdit, editBasket]);

  const minRequired = useMemo(
    () => requiredBasketAmount(funds, BASKET_AMOUNT_FLOOR),
    [funds]
  );

  useEffect(() => {
    if (step !== 2) return;
    setAmount((prev) => Math.max(Number(prev) || 0, minRequired));
  }, [minRequired, step]);

  const weightsOk = weightsSumOk(funds);
  const amountOk = Math.round(Number(amount) || 0) >= minRequired;
  const nameOk = String(name || "").trim().length > 0;

  function applyWeights(nextFunds: WizardFund[], weightList: number[]) {
    return nextFunds.map((fund, index) => ({
      ...fund,
      weight: weightList[index] ?? 0,
    }));
  }

  function addFund(raw: FundOption) {
    setError("");
    const picked = mapPickedFund(raw);
    if (picked.mfId <= 0) {
      setError("This fund cannot be added (missing fund id).");
      return;
    }
    if (funds.some((fund) => fund.mfId === picked.mfId)) {
      setError("Fund already added.");
      return;
    }
    if (funds.length >= BASKET_MAX_FUNDS) {
      setError("Up to 5 funds only.");
      return;
    }
    if (isSip && picked.sipAllowed === false) {
      setError("This fund does not allow SIP.");
      return;
    }
    if (!isSip && picked.purchaseAllowed === false) {
      setError("This fund does not allow purchase.");
      return;
    }
    const next = [...funds, picked];
    setFunds(applyWeights(next, seedWeights(next.length)));
    setSearchOpen(false);
  }

  function removeFund(mfId: number) {
    const next = funds.filter((fund) => fund.mfId !== mfId);
    setFunds(next.length ? applyWeights(next, seedWeights(next.length)) : []);
    setError("");
  }

  function bumpWeight(index: number, delta: number) {
    setFunds((prev) => {
      const rows = prev.map((fund) => ({ ...fund }));
      const current = Number(rows[index]?.weight) || 0;
      const nextVal = Math.min(99, Math.max(1, current + delta));
      if (nextVal === current) return prev;
      rows[index] = { ...rows[index], weight: nextVal };
      return rows;
    });
  }

  function goWeights() {
    if (funds.length < BASKET_MIN_FUNDS) {
      setError(`Add at least ${BASKET_MIN_FUNDS} funds`);
      return;
    }
    setError("");
    setAmount(Math.max(BASKET_AMOUNT_FLOOR, requiredBasketAmount(funds, BASKET_AMOUNT_FLOOR)));
    setStep(2);
  }

  function goName() {
    if (!weightsOk) {
      setError("Weights must add up to 100%");
      return;
    }
    if (!amountOk) {
      setError(`Minimum ${formatBasketMoney(minRequired)}`);
      return;
    }
    for (const fund of funds) {
      const leg = Math.floor((Math.round(Number(amount) || 0) * Number(fund.weight)) / 100);
      const need = firstPurchaseMin(fund);
      if (need > 0 && leg < need) {
        setError(
          `${fund.name}: allocation ${formatBasketMoney(leg)} is below first buy ${formatBasketMoney(need)}`
        );
        return;
      }
    }
    setError("");
    setStep(3);
  }

  async function submit() {
    if (!nameOk || !mode) {
      setError("Basket name is required");
      return;
    }
    setBusy(true);
    setError("");
    const payloadFunds = funds.map((fund) => ({
      mfId: fund.mfId,
      scheme: fund.scheme || undefined,
      weight: Math.round(Number(fund.weight) || 0),
    }));
    const investAmount = Math.round(Number(amount) || 0);
    const trimmedName = String(name).trim().slice(0, 48);
    const desc = String(description || "").trim().slice(0, 140);

    try {
      if (isEdit && editBasket) {
        const basket = await updateCustomBasketForUser(userId, editBasket.id, {
          name: trimmedName,
          description: desc || undefined,
          investAmount,
          funds: payloadFunds,
        });
        onSaved(basket);
        return;
      }
      const basket = await createCustomBasketForUser(userId, {
        name: trimmedName,
        description: desc || undefined,
        investmentMode: mode,
        investAmount,
        funds: payloadFunds,
      });
      onCreated(basket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save basket. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!mode) {
    return (
      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div className="w-full max-w-md rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--arn-txt)]">Create a basket</h3>
              <p className="mt-1 text-sm text-[var(--arn-txt-2)]">
                Start a monthly SIP or invest a one-time amount
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-[var(--arn-txt-3)] hover:text-[var(--arn-txt)]"
            >
              Close
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => setMode("SIP")}
              className="rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4 text-left transition-all hover:border-[var(--arn-amber)]"
            >
              <div className="text-sm font-bold text-[var(--arn-txt)]">SIP</div>
              <div className="mt-1 text-xs text-[var(--arn-txt-2)]">Monthly SIP from ₹1,000</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("LUMPSUM")}
              className="rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4 text-left transition-all hover:border-[var(--arn-amber)]"
            >
              <div className="text-sm font-bold text-[var(--arn-txt)]">One-time</div>
              <div className="mt-1 text-xs text-[var(--arn-txt-2)]">
                Invest a single amount from ₹1,000
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const titles = {
    1: { title: "Pick funds", sub: "2 to 5 funds" },
    2: {
      title: "Set weights",
      sub: isSip
        ? "Enter SIP amount, then set weights to 100%"
        : "Enter lumpsum amount, then set weights to 100%",
    },
    3: {
      title: "Name your basket",
      sub: isEdit
        ? "Save changes to this basket"
        : isSip
          ? "Then continue to set up the SIP"
          : "Then continue to the one-time investment",
    },
  } as const;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[var(--arn-bg)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 1) {
                if (isEdit) onClose();
                else setMode(null);
                return;
              }
              setError("");
              setStep((s) => s - 1);
            }}
            className="text-xs font-semibold text-[var(--arn-amber)] hover:opacity-70"
          >
            ← Back
          </button>
          <div className="min-w-0 flex-1 text-center pr-10">
            <h2 className="text-lg font-bold text-[var(--arn-txt)]">{titles[step as 1 | 2 | 3].title}</h2>
            <p className="mt-0.5 text-xs text-[var(--arn-txt-2)]">{titles[step as 1 | 2 | 3].sub}</p>
          </div>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--arn-bg-2)]">
          <div
            className="h-full rounded-full bg-[var(--arn-amber)] transition-all"
            style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm text-[var(--arn-txt-3)]">
                {funds.length} of {BASKET_MAX_FUNDS} selected
              </div>

              <div className="space-y-2">
                {funds.map((fund) => (
                  <div
                    key={fund.mfId}
                    className="relative rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-4 py-3 pr-10"
                  >
                    <div className="text-sm font-semibold text-[var(--arn-txt)]">{fund.name}</div>
                    <div className="mt-1 text-xs text-[var(--arn-txt-3)]">
                      First buy {formatBasketMoney(fund.minInitial || firstPurchaseMin(fund) || 0)}
                      {" · "}
                      SIP {formatBasketMoney(fund.minSip || 0)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFund(fund.mfId)}
                      className="absolute right-3 top-3 text-xs font-semibold text-[var(--arn-txt-3)] hover:text-[var(--arn-red)]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {funds.length < BASKET_MAX_FUNDS && (
                <button
                  type="button"
                  onClick={() => setSearchOpen((v) => !v)}
                  className="w-full rounded-[12px] border border-dashed border-[var(--arn-bdr)] py-3 text-sm font-semibold text-[var(--arn-amber)] hover:border-[var(--arn-amber)]"
                >
                  {searchOpen
                    ? "Hide search"
                    : funds.length
                      ? "+ Add another fund"
                      : "+ Search and add a fund"}
                </button>
              )}

              {searchOpen && (
                <div className="rounded-[12px] border border-[var(--arn-bdr)] p-4">
                  <ArnFundSearchBar
                    onSelect={(fund) => {
                      addFund(fund);
                    }}
                  />
                </div>
              )}

              {error ? <div className="text-center text-sm text-red-600">{error}</div> : null}

              <button
                type="button"
                disabled={funds.length < BASKET_MIN_FUNDS}
                onClick={goWeights}
                className="w-full rounded-[12px] bg-[var(--arn-amber)] py-3 text-sm font-semibold text-white disabled:opacity-45"
              >
                {funds.length >= BASKET_MIN_FUNDS
                  ? "Set weights →"
                  : funds.length === 1
                    ? "Add one more fund"
                    : "Add at least 2 funds"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--arn-txt-3)]">
                  {isSip ? "Monthly SIP amount" : "Lumpsum amount"}
                </div>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-2xl font-extrabold text-[var(--arn-txt)]">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount.toLocaleString("en-IN")}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, "");
                      setAmount(Number(digits) || 0);
                    }}
                    className="w-full max-w-[200px] border-b border-transparent bg-transparent text-2xl font-extrabold text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  />
                </div>
                <div className="mt-1 text-xs text-[var(--arn-txt-3)]">
                  Minimum {formatBasketMoney(minRequired)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--arn-txt)]">Weights</div>
                <button
                  type="button"
                  onClick={() => setFunds((prev) => applyWeights(prev, equalWeights(prev.length)))}
                  className="text-xs font-semibold text-[var(--arn-amber)]"
                >
                  Equal split
                </button>
              </div>

              <div className="space-y-2">
                {funds.map((fund, index) => (
                  <div
                    key={fund.mfId}
                    className="flex items-center gap-3 rounded-[12px] border border-[var(--arn-bdr)] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--arn-txt)]">
                      {fund.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => bumpWeight(index, -1)}
                        className="h-7 w-7 rounded-full border border-[var(--arn-bdr)] text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-sm font-bold text-[var(--arn-txt)]">
                        {fund.weight}%
                      </span>
                      <button
                        type="button"
                        onClick={() => bumpWeight(index, 1)}
                        className="h-7 w-7 rounded-full border border-[var(--arn-bdr)] text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className={cn(
                  "text-sm font-semibold",
                  weightsOk ? "text-[var(--arn-txt-2)]" : "text-red-600"
                )}
              >
                Total {funds.reduce((s, f) => s + Number(f.weight), 0)}%
                {weightsOk ? " ✓" : " — must be 100%"}
              </div>

              {error ? <div className="text-center text-sm text-red-600">{error}</div> : null}

              <button
                type="button"
                onClick={goName}
                className="w-full rounded-[12px] bg-[var(--arn-amber)] py-3 text-sm font-semibold text-white"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--arn-txt-3)]">
                  Basket name
                </label>
                <input
                  type="text"
                  value={name}
                  maxLength={48}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Growth core"
                  className="mt-1 w-full rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--arn-amber)]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--arn-txt-3)]">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  maxLength={140}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Short note for this client"
                  className="mt-1 w-full rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--arn-amber)]"
                />
              </div>

              {error ? <div className="text-center text-sm text-red-600">{error}</div> : null}

              <button
                type="button"
                disabled={busy || !nameOk}
                onClick={submit}
                className="w-full rounded-[12px] bg-[var(--arn-amber)] py-3 text-sm font-semibold text-white disabled:opacity-45"
              >
                {busy ? "Saving..." : isEdit ? "Save basket" : "Create & continue →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
