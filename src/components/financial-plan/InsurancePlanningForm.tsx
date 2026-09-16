"use client";

import { useState } from "react";
import type { QuestionAnswerDto } from "@/services/financialPlanService";

interface InsurancePlanningFormProps {
  onBack: () => void;
  onSubmit: (groups: QuestionAnswerDto[][]) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

interface PolicyEntry {
  policyName: string;
  type: string;
  sumInsured: string;
  tenure: string;
  yearlyPremium: string;
}

const POLICY_TYPE_OPTIONS = [
  "Life Insurance",
  "Health Insurance",
  "Term Insurance",
  "ULIP",
  "Endowment Plan",
  "Other",
] as const;

function emptyPolicy(): PolicyEntry {
  return {
    policyName: "",
    type: "",
    sumInsured: "",
    tenure: "",
    yearlyPremium: "",
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

function sanitizePolicyName(raw: string): string {
  return raw.replace(/[^A-Za-z ]/g, "");
}

function isValidPolicyName(name: string): boolean {
  return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name.trim());
}

export default function InsurancePlanningForm({
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: InsurancePlanningFormProps) {
  const [noInsurance, setNoInsurance] = useState(false);
  const [policies, setPolicies] = useState<PolicyEntry[]>([emptyPolicy()]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNoInsuranceChange = (checked: boolean) => {
    setValidationError(null);
    setNoInsurance(checked);
    if (checked) {
      setPolicies([emptyPolicy()]);
    }
  };

  const addPolicy = () => {
    setValidationError(null);
    setPolicies((prev) => [...prev, emptyPolicy()]);
  };

  const removePolicy = (index: number) => {
    setValidationError(null);
    setPolicies((prev) => {
      if (prev.length <= 1) return [emptyPolicy()];
      return prev.filter((_, i) => i !== index);
    });
  };

  const updatePolicy = (
    index: number,
    field: keyof PolicyEntry,
    value: string
  ) => {
    setValidationError(null);
    setPolicies((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === "policyName") {
          return { ...item, policyName: sanitizePolicyName(value) };
        }
        if (
          field === "sumInsured" ||
          field === "tenure" ||
          field === "yearlyPremium"
        ) {
          return { ...item, [field]: sanitizeAmountInput(value) };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const buildGroups = (): QuestionAnswerDto[][] | null => {
    if (noInsurance) {
      return [[{ questionId: 44, option: "1", goalId: "insurance1" }]];
    }

    if (policies.length === 0) {
      setValidationError(
        "Please add at least one insurance policy, or check that you have no insurance."
      );
      return null;
    }

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      const name = policy.policyName.trim();

      if (!name || !isValidPolicyName(name)) {
        setValidationError(
          `Policy ${i + 1} name must contain letters and spaces only.`
        );
        return null;
      }

      if (!policy.type) {
        setValidationError(`Please select type for policy ${i + 1}.`);
        return null;
      }

      const sumInsured = parseAmount(policy.sumInsured);
      if (!policy.sumInsured.trim() || !Number.isFinite(sumInsured) || sumInsured < 0) {
        setValidationError(`Please enter a valid sum insured for policy ${i + 1}.`);
        return null;
      }

      const tenure = parseAmount(policy.tenure);
      if (
        !policy.tenure.trim() ||
        !Number.isFinite(tenure) ||
        !Number.isInteger(tenure) ||
        tenure <= 0
      ) {
        setValidationError(`Please enter a valid tenure in years for policy ${i + 1}.`);
        return null;
      }

      const yearlyPremium = parseAmount(policy.yearlyPremium);
      if (
        !policy.yearlyPremium.trim() ||
        !Number.isFinite(yearlyPremium) ||
        yearlyPremium < 0
      ) {
        setValidationError(`Please enter a valid yearly premium for policy ${i + 1}.`);
        return null;
      }
    }

    return policies.map((policy, index) => {
      const goalId = `insurance${index + 1}`;
      return [
        { questionId: 38, value: policy.policyName.trim(), goalId },
        { questionId: 39, value: policy.type, goalId },
        { questionId: 40, value: parseAmount(policy.sumInsured), goalId },
        { questionId: 41, value: parseAmount(policy.tenure), goalId },
        { questionId: 42, value: parseAmount(policy.yearlyPremium), goalId },
        { questionId: 44, option: "2", goalId },
      ];
    });
  };

  const handleSubmit = async () => {
    const groups = buildGroups();
    if (!groups) return;
    setValidationError(null);
    await onSubmit(groups);
  };

  const displayError = validationError || error;

  const renderAmountField = (
    label: string,
    value: string,
    onChange: (next: string) => void,
    required = true,
    suffix?: string
  ) => (
    <div className="field-group">
      <label className="field-label">
        {label} {required && <span className="req">Required</span>}
      </label>
      <div className="flex gap-2">
        {!suffix && (
          <div className="field-prefix field-prefix-fixed flex items-center justify-center min-w-[56px]">
            ₹
          </div>
        )}
        <input
          className="field-input flex-1"
          placeholder="0"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <div className="field-prefix field-prefix-fixed flex items-center justify-center min-w-[72px]">
            {suffix}
          </div>
        )}
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
        <h2 className="step-title">Insurance Planning</h2>
        <p className="step-helper">Add one set of details per insurance policy.</p>
      </div>

      <div className="field-group">
        <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            checked={noInsurance}
            onChange={(e) => handleNoInsuranceChange(e.target.checked)}
          />
          Check this box if you don&apos;t have any insurance policy
        </label>
      </div>

      {!noInsurance && (
        <>
          {policies.map((policy, index) => (
            <div key={index} className="field-group">
              <div className="onboard-section-label" style={{ marginBottom: 12 }}>
                Policy {index + 1}
              </div>

              <div className="field-group">
                <label className="field-label">
                  Policy Name <span className="req">Required</span>
                </label>
                <input
                  className="field-input"
                  placeholder="Enter policy name"
                  value={policy.policyName}
                  onChange={(e) => updatePolicy(index, "policyName", e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  Type <span className="req">Required</span>
                </label>
                <select
                  className="field-select"
                  value={policy.type}
                  onChange={(e) => updatePolicy(index, "type", e.target.value)}
                >
                  <option value="">Select policy type</option>
                  {POLICY_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {renderAmountField("Sum Insured", policy.sumInsured, (value) =>
                updatePolicy(index, "sumInsured", value)
              )}
              {renderAmountField(
                "Tenure",
                policy.tenure,
                (value) => updatePolicy(index, "tenure", value),
                true,
                "Years"
              )}
              {renderAmountField("Yearly Premium", policy.yearlyPremium, (value) =>
                updatePolicy(index, "yearlyPremium", value)
              )}

              {policies.length > 1 && (
                <button
                  type="button"
                  className="btn-primary btn-wide"
                  onClick={() => removePolicy(index)}
                  style={{
                    marginTop: 8,
                    background: "transparent",
                    color: "var(--arn-amber)",
                    border: "1px solid var(--arn-amber)",
                    boxShadow: "none",
                  }}
                >
                  <i className="ti ti-trash" aria-hidden="true" /> Remove policy {index + 1}
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addPolicy}
            className="btn-primary btn-wide"
            style={{
              marginBottom: 16,
              background: "transparent",
              color: "var(--arn-amber)",
              border: "1px solid var(--arn-amber)",
              boxShadow: "none",
            }}
          >
            <i className="ti ti-plus" aria-hidden="true" /> Add another policy
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
