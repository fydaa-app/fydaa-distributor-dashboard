"use client";

import { useMemo, useState } from "react";
import type {
  AssetsLiabilitiesPayload,
  QuestionAnswerDto,
} from "@/services/financialPlanService";

interface AssetsLiabilitiesFormProps {
  onBack: () => void;
  onSubmit: (payload: AssetsLiabilitiesPayload) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

interface CustomAsset {
  name: string;
  amount: string;
}

interface DebtEntry {
  loanType: string;
  emiAmount: string;
  balanceDue: string;
  loanEndDate: string;
}

const LOAN_TYPE_OPTIONS = [
  "Home Loan",
  "Car Loan",
  "Personal Loan",
  "Credit Card",
  "Education Loan",
  "Other",
] as const;

function emptyDebt(): DebtEntry {
  return {
    loanType: "",
    emiAmount: "",
    balanceDue: "",
    loanEndDate: "",
  };
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

function sanitizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function amountOrZero(raw: string): number {
  const amount = parseAmount(raw);
  return Number.isFinite(amount) ? amount : 0;
}

export default function AssetsLiabilitiesForm({
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: AssetsLiabilitiesFormProps) {
  const [bankSavings, setBankSavings] = useState("");
  const [mutualFunds, setMutualFunds] = useState("");
  const [stocks, setStocks] = useState("");
  const [nps, setNps] = useState("");
  const [fdsRds, setFdsRds] = useState("");
  const [gold, setGold] = useState("");
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([]);
  const [noDebts, setNoDebts] = useState(false);
  const [debts, setDebts] = useState<DebtEntry[]>([emptyDebt()]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalAssets = useMemo(() => {
    return (
      amountOrZero(bankSavings) +
      amountOrZero(mutualFunds) +
      amountOrZero(stocks) +
      amountOrZero(nps) +
      amountOrZero(fdsRds) +
      amountOrZero(gold)
    );
  }, [bankSavings, mutualFunds, stocks, nps, fdsRds, gold]);

  const addCustomAsset = () => {
    setValidationError(null);
    setCustomAssets((prev) => [...prev, { name: "", amount: "" }]);
  };

  const updateCustomAsset = (
    index: number,
    field: keyof CustomAsset,
    value: string
  ) => {
    setValidationError(null);
    setCustomAssets((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "amount" ? sanitizeAmountInput(value) : value,
            }
          : item
      )
    );
  };

  const removeCustomAsset = (index: number) => {
    setValidationError(null);
    setCustomAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const addDebt = () => {
    setValidationError(null);
    setDebts((prev) => [...prev, emptyDebt()]);
  };

  const updateDebt = (index: number, field: keyof DebtEntry, value: string) => {
    setValidationError(null);
    setDebts((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === "emiAmount" || field === "balanceDue"
                  ? sanitizeAmountInput(value)
                  : value,
            }
          : item
      )
    );
  };

  const removeDebt = (index: number) => {
    setValidationError(null);
    setDebts((prev) => {
      if (prev.length <= 1) return [emptyDebt()];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleNoDebtsChange = (checked: boolean) => {
    setValidationError(null);
    setNoDebts(checked);
    if (checked) {
      setDebts([emptyDebt()]);
    }
  };

  const validateAmountFields = (): string | null => {
    const fields: Array<{ label: string; raw: string }> = [
      { label: "Bank Savings", raw: bankSavings },
      { label: "Mutual Funds", raw: mutualFunds },
      { label: "Stocks", raw: stocks },
      { label: "NPS", raw: nps },
      { label: "FDs/RDs", raw: fdsRds },
      { label: "Gold", raw: gold },
    ];

    for (const field of fields) {
      const amount = parseAmount(field.raw);
      if (!Number.isFinite(amount) || amount < 0) {
        return `${field.label} must be a valid amount.`;
      }
    }

    for (let i = 0; i < customAssets.length; i++) {
      const asset = customAssets[i];
      const hasName = asset.name.trim().length > 0;
      const hasAmount = asset.amount.trim().length > 0;
      if (!hasName && !hasAmount) continue;
      if (!hasName) return `Please enter a name for custom asset ${i + 1}.`;
      const amount = parseAmount(asset.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return `Custom asset "${asset.name.trim()}" must have a valid amount.`;
      }
    }

    return null;
  };

  const buildPayload = (): AssetsLiabilitiesPayload | null => {
    const amountError = validateAmountFields();
    if (amountError) {
      setValidationError(amountError);
      return null;
    }

    const assetAnswers: QuestionAnswerDto[] = [
      { questionId: 27, value: totalAssets },
      { questionId: 28, value: amountOrZero(bankSavings) },
      { questionId: 29, value: amountOrZero(mutualFunds) },
      { questionId: 30, value: amountOrZero(stocks) },
      { questionId: 31, value: amountOrZero(nps) },
      { questionId: 32, value: amountOrZero(fdsRds) },
      { questionId: 33, value: amountOrZero(gold) },
      { questionId: 43, option: noDebts ? "1" : "2" },
    ];

    for (const asset of customAssets) {
      const name = asset.name.trim();
      if (!name) continue;
      assetAnswers.push({
        question: name,
        value: amountOrZero(asset.amount),
      });
    }

    if (noDebts) {
      return { asset1: assetAnswers };
    }

    if (debts.length === 0) {
      setValidationError("Please add at least one debt, or check that you have no debts.");
      return null;
    }

    for (let i = 0; i < debts.length; i++) {
      const debt = debts[i];
      if (!debt.loanType) {
        setValidationError(`Please select loan type for debt ${i + 1}.`);
        return null;
      }

      const emi = parseAmount(debt.emiAmount);
      if (!debt.emiAmount.trim() || !Number.isFinite(emi) || emi < 0) {
        setValidationError(`Please enter a valid EMI amount for debt ${i + 1}.`);
        return null;
      }

      const balance = parseAmount(debt.balanceDue);
      if (!debt.balanceDue.trim() || !Number.isFinite(balance) || balance < 0) {
        setValidationError(`Please enter a valid balance due for debt ${i + 1}.`);
        return null;
      }

      if (!debt.loanEndDate) {
        setValidationError(`Please select loan end date for debt ${i + 1}.`);
        return null;
      }
    }

    const payload: Record<string, QuestionAnswerDto[]> = {
      asset1: assetAnswers,
    };

    debts.forEach((debt, index) => {
      payload[`asset${index + 2}`] = [
        { questionId: 34, value: debt.loanType },
        { questionId: 35, value: amountOrZero(debt.emiAmount) },
        { questionId: 36, value: amountOrZero(debt.balanceDue) },
        { questionId: 37, value: debt.loanEndDate },
      ];
    });

    return payload;
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setValidationError(null);
    await onSubmit(payload);
  };

  const displayError = validationError || error;

  const renderAmountField = (
    label: string,
    value: string,
    onChange: (next: string) => void,
    readOnly = false
  ) => (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <div className="flex gap-2">
        <div className="field-prefix field-prefix-fixed flex items-center justify-center min-w-[56px]">
          ₹
        </div>
        <input
          className="field-input flex-1"
          placeholder="0"
          inputMode="decimal"
          value={value}
          readOnly={readOnly}
          onChange={(e) => {
            if (readOnly) return;
            setValidationError(null);
            onChange(sanitizeAmountInput(e.target.value));
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="step-panel">
      <div className="flex justify-center mb-5">
        <div className="back-btn" onClick={onBack} role="button" tabIndex={0}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
        </div>
      </div>

      <div className="text-center">
        <p className="step-eyebrow">Financial Plan</p>
        <h2 className="step-title">Assets & Liabilities</h2>
        <p className="step-helper">Enter asset values and debt details. Empty asset amounts are saved as 0.</p>
      </div>

      <div className="onboard-section-label">Assets</div>
      {renderAmountField("Bank Savings", bankSavings, setBankSavings)}
      {renderAmountField("Mutual Funds", mutualFunds, setMutualFunds)}
      {renderAmountField("Stocks", stocks, setStocks)}
      {renderAmountField("NPS", nps, setNps)}
      {renderAmountField("FDs/RDs", fdsRds, setFdsRds)}
      {renderAmountField("Gold", gold, setGold)}
      {renderAmountField("Total Assets", String(totalAssets), () => undefined, true)}

      <div className="onboard-section-label">Custom Assets</div>
      {customAssets.length === 0 && (
        <p className="step-helper" style={{ textAlign: "left", marginBottom: 12 }}>
          Add any extra assets if needed.
        </p>
      )}

      {customAssets.map((asset, index) => (
        <div key={index} className="field-group">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Asset Name</label>
              <input
                className="field-input"
                placeholder="e.g. Crypto holdings"
                value={asset.name}
                onChange={(e) => updateCustomAsset(index, "name", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Amount (₹)</label>
              <div className="flex gap-2">
                <input
                  className="field-input flex-1"
                  placeholder="0"
                  inputMode="decimal"
                  value={asset.amount}
                  onChange={(e) => updateCustomAsset(index, "amount", e.target.value)}
                />
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => removeCustomAsset(index)}
                  aria-label={`Remove custom asset ${index + 1}`}
                >
                  <i className="ti ti-trash" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addCustomAsset}
        className="btn-primary btn-wide"
        style={{
          marginBottom: 16,
          background: "transparent",
          color: "var(--arn-amber)",
          border: "1px solid var(--arn-amber)",
          boxShadow: "none",
        }}
      >
        <i className="ti ti-plus" aria-hidden="true" /> Add custom asset
      </button>

      <div className="onboard-section-label">Liabilities</div>

      <div className="field-group">
        <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            checked={noDebts}
            onChange={(e) => handleNoDebtsChange(e.target.checked)}
          />
          Check this box if you don&apos;t have any debts
        </label>
      </div>

      {!noDebts && (
        <>
          {debts.map((debt, index) => (
            <div key={index} className="field-group">
              <div className="onboard-section-label" style={{ marginBottom: 12 }}>
                Debt {index + 1}
              </div>

              <div className="field-group">
                <label className="field-label">
                  Loan Type <span className="req">Required</span>
                </label>
                <select
                  className="field-select"
                  value={debt.loanType}
                  onChange={(e) => updateDebt(index, "loanType", e.target.value)}
                >
                  <option value="">Select loan type</option>
                  {LOAN_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {renderAmountField("EMI Amount", debt.emiAmount, (value) =>
                updateDebt(index, "emiAmount", value)
              )}
              {renderAmountField("Balance Due", debt.balanceDue, (value) =>
                updateDebt(index, "balanceDue", value)
              )}

              <div className="field-group">
                <label className="field-label">
                  Loan End Date <span className="req">Required</span>
                </label>
                <input
                  className="field-input"
                  type="date"
                  value={debt.loanEndDate}
                  onChange={(e) => updateDebt(index, "loanEndDate", e.target.value)}
                />
              </div>

              {debts.length > 1 && (
                <button
                  type="button"
                  className="btn-primary btn-wide"
                  onClick={() => removeDebt(index)}
                  style={{
                    marginTop: 8,
                    background: "transparent",
                    color: "var(--arn-amber)",
                    border: "1px solid var(--arn-amber)",
                    boxShadow: "none",
                  }}
                >
                  <i className="ti ti-trash" aria-hidden="true" /> Remove debt {index + 1}
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addDebt}
            className="btn-primary btn-wide"
            style={{
              marginBottom: 16,
              background: "transparent",
              color: "var(--arn-amber)",
              border: "1px solid var(--arn-amber)",
              boxShadow: "none",
            }}
          >
            <i className="ti ti-plus" aria-hidden="true" /> Add another debt
          </button>
        </>
      )}

      {displayError && (
        <div className="field-error">
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {displayError}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="btn-primary btn-wide"
      >
        {isSubmitting ? "Submitting..." : "Continue"}{" "}
        {!isSubmitting && <i className="ti ti-arrow-right" aria-hidden="true" />}
      </button>
    </div>
  );
}
