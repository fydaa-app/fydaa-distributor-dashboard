"use client";

import { useMemo, useState } from "react";
import type { QuestionAnswerDto } from "@/services/financialPlanService";

interface FinancialGoalsFormProps {
  onBack: () => void;
  onSubmit: (answers: QuestionAnswerDto[]) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  hasChildren: boolean;
}

const ALL_GOALS = [
  { value: "1", label: "Vacation" },
  { value: "2", label: "Gadgets" },
  { value: "3", label: "Shopping" },
  { value: "4", label: "Wellness & Hobbies" },
  { value: "5", label: "Emergency Funds", hidden: true },
  { value: "6", label: "Jewellery" },
  { value: "7", label: "Insurance Premiums" },
  { value: "8", label: "Vehicle" },
  { value: "9", label: "Parenting" },
  { value: "10", label: "Home Purchase" },
  { value: "11", label: "Buying a Vehicle" },
  { value: "12", label: "Marriage Fund" },
  { value: "13", label: "Wealth Creation" },
  { value: "14", label: "Retirement", hidden: true },
  { value: "15", label: "Children's Education", hideWhenHasChildren: true },
  { value: "16", label: "Gold Savings" },
] as const;

export default function FinancialGoalsForm({
  onBack,
  onSubmit,
  isSubmitting,
  error,
  hasChildren,
}: FinancialGoalsFormProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const visibleGoals = useMemo(
    () =>
      ALL_GOALS.filter((goal) => {
        if ("hidden" in goal && goal.hidden) return false;
        if ("hideWhenHasChildren" in goal && goal.hideWhenHasChildren && hasChildren) {
          return false;
        }
        return true;
      }),
    [hasChildren]
  );

  const toggleGoal = (value: string) => {
    setValidationError(null);
    setSelectedGoals((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (selectedGoals.length === 0) {
      setValidationError("Please select at least one financial goal.");
      return;
    }

    setValidationError(null);

    const answers: QuestionAnswerDto[] = selectedGoals.map((option) => ({
      questionId: 8,
      option,
    }));

    await onSubmit(answers);
  };

  const displayError = validationError || error;

  return (
    <div className="step-panel">
      <div className="flex justify-center mb-5">
        <div className="back-btn" onClick={onBack} role="button" tabIndex={0}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
        </div>
      </div>

      <div className="text-center">
        <p className="step-eyebrow">Financial Plan</p>
        <h2 className="step-title">What&apos;s Your Next Big Milestone?</h2>
        <p className="step-helper">Select one or more financial goals to continue.</p>
      </div>

      <div className="field-group">
        <label className="field-label">
          Select financial goal(s) <span className="req">Required</span>
        </label>
        <div className="answer-grid">
          {visibleGoals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.value);
            return (
              <div
                key={goal.value}
                role="button"
                tabIndex={0}
                onClick={() => toggleGoal(goal.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleGoal(goal.value);
                  }
                }}
                className={`answer-card ${isSelected ? "selected" : ""}`}
              >
                {goal.label}
              </div>
            );
          })}
        </div>
      </div>

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
