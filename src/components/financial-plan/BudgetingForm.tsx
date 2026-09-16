"use client";

import { useMemo, useState } from "react";
import type { QuestionAnswerDto } from "@/services/financialPlanService";

interface BudgetingFormProps {
  onBack: () => void;
  onSubmit: (answers: QuestionAnswerDto[]) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

interface CustomExpense {
  name: string;
  amount: string;
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

export default function BudgetingForm({
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: BudgetingFormProps) {
  const [primaryIncome, setPrimaryIncome] = useState("");
  const [spousalIncome, setSpousalIncome] = useState("");
  const [rentalIncome, setRentalIncome] = useState("");
  const [housing, setHousing] = useState("");
  const [utilities, setUtilities] = useState("");
  const [transportation, setTransportation] = useState("");
  const [debtPayments, setDebtPayments] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [customExpenses, setCustomExpenses] = useState<CustomExpense[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalIncome = useMemo(() => {
    const primary = parseAmount(primaryIncome);
    const spousal = parseAmount(spousalIncome);
    const rental = parseAmount(rentalIncome);
    const values = [primary, spousal, rental].map((v) => (Number.isFinite(v) ? v : 0));
    return values[0] + values[1] + values[2];
  }, [primaryIncome, spousalIncome, rentalIncome]);

  const addCustomExpense = () => {
    setValidationError(null);
    setCustomExpenses((prev) => [...prev, { name: "", amount: "" }]);
  };

  const updateCustomExpense = (
    index: number,
    field: keyof CustomExpense,
    value: string
  ) => {
    setValidationError(null);
    setCustomExpenses((prev) =>
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

  const removeCustomExpense = (index: number) => {
    setValidationError(null);
    setCustomExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  const buildAnswers = (): QuestionAnswerDto[] | null => {
    const primary = parseAmount(primaryIncome);
    if (!Number.isFinite(primary) || primary <= 0) {
      setValidationError("Primary Income is required and must be greater than 0.");
      return null;
    }

    const optionalFields: Array<{ label: string; raw: string }> = [
      { label: "Spousal Income", raw: spousalIncome },
      { label: "Rental Income", raw: rentalIncome },
      { label: "Housing (Rent / EMI)", raw: housing },
      { label: "Utilities", raw: utilities },
      { label: "Transportation", raw: transportation },
      { label: "Debt Payments", raw: debtPayments },
      { label: "Lifestyle Expenses", raw: lifestyle },
    ];

    for (const field of optionalFields) {
      const amount = parseAmount(field.raw);
      if (!Number.isFinite(amount) || amount < 0) {
        setValidationError(`${field.label} must be a valid amount.`);
        return null;
      }
    }

    for (let i = 0; i < customExpenses.length; i++) {
      const expense = customExpenses[i];
      const hasName = expense.name.trim().length > 0;
      const hasAmount = expense.amount.trim().length > 0;
      if (!hasName && !hasAmount) continue;
      if (!hasName) {
        setValidationError(`Please enter a name for custom expense ${i + 1}.`);
        return null;
      }
      const amount = parseAmount(expense.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        setValidationError(`Custom expense "${expense.name.trim()}" must have a valid amount.`);
        return null;
      }
    }

    const answers: QuestionAnswerDto[] = [
      { questionId: 14, value: primary },
      { questionId: 15, value: parseAmount(spousalIncome) || 0 },
      { questionId: 16, value: parseAmount(rentalIncome) || 0 },
      { questionId: 17, value: totalIncome },
      { questionId: 18, value: parseAmount(housing) || 0 },
      { questionId: 19, value: parseAmount(utilities) || 0 },
      { questionId: 20, value: parseAmount(transportation) || 0 },
      { questionId: 21, value: parseAmount(debtPayments) || 0 },
      { questionId: 22, value: parseAmount(lifestyle) || 0 },
      { questionId: 26, value: 0 },
    ];

    for (const expense of customExpenses) {
      const name = expense.name.trim();
      if (!name) continue;
      answers.push({
        question: name,
        value: parseAmount(expense.amount) || 0,
      });
    }

    return answers;
  };

  const handleSubmit = async () => {
    const answers = buildAnswers();
    if (!answers) return;
    setValidationError(null);
    await onSubmit(answers);
  };

  const displayError = validationError || error;

  const renderAmountField = (
    label: string,
    value: string,
    onChange: (next: string) => void,
    required = false,
    readOnly = false
  ) => (
    <div className="field-group">
      <label className="field-label">
        {label}{" "}
        {required ? (
          <span className="req">Required</span>
        ) : (
          <span className="req" style={{ opacity: 0.7 }}>
            Optional
          </span>
        )}
      </label>
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
        <h2 className="step-title">Start Budgeting</h2>
        <p className="step-helper">Enter monthly amounts in INR. Empty optional fields are saved as 0.</p>
      </div>

      <div className="onboard-section-label">Income</div>
      {renderAmountField("Primary Income", primaryIncome, setPrimaryIncome, true)}
      {renderAmountField("Spousal Income", spousalIncome, setSpousalIncome)}
      {renderAmountField("Rental Income", rentalIncome, setRentalIncome)}
      {renderAmountField("Total", String(totalIncome), () => undefined, false, true)}

      <div className="onboard-section-label">Expenses</div>
      {renderAmountField("Housing (Rent / EMI)", housing, setHousing)}
      {renderAmountField(
        "Utilities (Electricity, Groceries, etc.)",
        utilities,
        setUtilities
      )}
      {renderAmountField(
        "Transportation (Fuel / Pass / Cab)",
        transportation,
        setTransportation
      )}
      {renderAmountField(
        "Debt Payments (Credit card, loan, etc.)",
        debtPayments,
        setDebtPayments
      )}
      {renderAmountField(
        "Lifestyle Expenses (Shopping, Travel, Etc.)",
        lifestyle,
        setLifestyle
      )}

      <div className="onboard-section-label">Custom Expenses</div>
      {customExpenses.length === 0 && (
        <p className="step-helper" style={{ textAlign: "left", marginBottom: 12 }}>
          Add any extra monthly expense categories if needed.
        </p>
      )}

      {customExpenses.map((expense, index) => (
        <div key={index} className="field-group">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Category Name</label>
              <input
                className="field-input"
                placeholder="e.g. School fees"
                value={expense.name}
                onChange={(e) => updateCustomExpense(index, "name", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Monthly Amount (₹)</label>
              <div className="flex gap-2">
                <input
                  className="field-input flex-1"
                  placeholder="0"
                  inputMode="decimal"
                  value={expense.amount}
                  onChange={(e) => updateCustomExpense(index, "amount", e.target.value)}
                />
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => removeCustomExpense(index)}
                  aria-label={`Remove custom expense ${index + 1}`}
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
        onClick={addCustomExpense}
        className="btn-primary btn-wide"
        style={{
          marginBottom: 16,
          background: "transparent",
          color: "var(--arn-amber)",
          border: "1px solid var(--arn-amber)",
          boxShadow: "none",
        }}
      >
        <i className="ti ti-plus" aria-hidden="true" /> Add custom expense
      </button>

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
