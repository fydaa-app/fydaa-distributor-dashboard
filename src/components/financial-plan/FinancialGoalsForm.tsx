"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { QuestionAnswerDto } from "@/services/financialPlanService";

interface FinancialGoalsFormProps {
  onBack: () => void;
  onSubmit: (answers: QuestionAnswerDto[]) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  hasChildren: boolean;
}

type GoalTermId = 1 | 2 | 3;

interface FinancialGoalOption {
  value: string;
  label: string;
  termId: GoalTermId;
  icon: string;
  tenureLabel: string;
  hidden?: boolean;
  hideWhenHasChildren?: boolean;
}

const CATEGORIES = [
  { termId: 1 as const, label: "Short Term Goals", sublabel: "up to 3 years" },
  { termId: 2 as const, label: "Medium Term Goals", sublabel: "3 to 7 years" },
  { termId: 3 as const, label: "Long Term Goals", sublabel: "7+ years" },
];

const ALL_GOALS: FinancialGoalOption[] = [
  {
    value: "1",
    label: "Vacation",
    termId: 1,
    icon: "vacation",
    tenureLabel: "0–3 yrs",
  },
  {
    value: "2",
    label: "Gadgets",
    termId: 1,
    icon: "gadgets",
    tenureLabel: "0–3 yrs",
  },
  {
    value: "3",
    label: "Shopping",
    termId: 1,
    icon: "shopping",
    tenureLabel: "0–3 yrs",
  },
  {
    value: "4",
    label: "Wellness & Hobbies",
    termId: 1,
    icon: "wellness",
    tenureLabel: "0–3 yrs",
  },
  {
    value: "5",
    label: "Emergency Funds",
    termId: 1,
    icon: "emergency",
    tenureLabel: "0–3 yrs",
    hidden: true,
  },
  {
    value: "6",
    label: "Jewellery",
    termId: 1,
    icon: "jewellery",
    tenureLabel: "0–3 yrs",
  },
  {
    value: "7",
    label: "Insurance Premiums",
    termId: 1,
    icon: "insurance",
    tenureLabel: "0–3 yrs",
  },
  {
    value: "8",
    label: "Vehicle",
    termId: 1,
    icon: "vehicle",
    tenureLabel: "0–3 yrs",
  },
  {
    value: "9",
    label: "Parenting",
    termId: 2,
    icon: "parenting",
    tenureLabel: "3–7 yrs",
  },
  {
    value: "11",
    label: "Buying a Vehicle",
    termId: 2,
    icon: "buyingdream",
    tenureLabel: "3–7 yrs",
  },
  {
    value: "12",
    label: "Marriage Fund",
    termId: 2,
    icon: "marriage",
    tenureLabel: "3–7 yrs",
  },
  {
    value: "16",
    label: "Gold Savings",
    termId: 2,
    icon: "gold",
    tenureLabel: "3–7 yrs",
  },
  {
    value: "10",
    label: "Home Purchase",
    termId: 3,
    icon: "home",
    tenureLabel: "7+ yrs",
  },
  {
    value: "13",
    label: "Wealth Creation",
    termId: 3,
    icon: "wealth",
    tenureLabel: "7+ yrs",
  },
  {
    value: "14",
    label: "Retirement",
    termId: 3,
    icon: "retire",
    tenureLabel: "7+ yrs",
    hidden: true,
  },
  {
    value: "15",
    label: "Children's Education",
    termId: 3,
    icon: "children",
    tenureLabel: "7+ yrs",
    hideWhenHasChildren: true,
  },
];

function GoalIcon({ name, icon }: { name: string; icon: string }) {
  return (
    <img
      src={`/images/icons/${icon}.png`}
      alt={name}
      className={cn(
        "h-12 w-12 shrink-0 rounded-[12px] border object-contain",
        "border-transparent bg-[var(--arn-bg-2)]"
      )}
    />
  );
}

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
        if (goal.hidden) return false;
        if (goal.hideWhenHasChildren && hasChildren) return false;
        return true;
      }),
    [hasChildren]
  );

  const grouped = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        goals: visibleGoals.filter((goal) => goal.termId === category.termId),
      })).filter((category) => category.goals.length > 0),
    [visibleGoals]
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

        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.termId}>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--arn-txt)]">
                  {group.label}
                </h3>
                <span className="rounded-full bg-[var(--arn-bg-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--arn-txt-3)]">
                  {group.goals.length} {group.goals.length === 1 ? "goal" : "goals"}
                </span>
                <span className="text-xs text-[var(--arn-txt-3)]">
                  ({group.sublabel})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.goals.map((goal) => {
                  const isSelected = selectedGoals.includes(goal.value);
                  return (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => toggleGoal(goal.value)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 rounded-[14px] border p-4 text-center transition-all",
                        isSelected
                          ? "border border-[var(--arn-amber)] bg-[var(--arn-amber-sel-bg)] shadow-[0_4px_16px_var(--arn-amber-bg-grad-1)]"
                          : "border-[var(--arn-bdr)] bg-[var(--arn-bg)] hover:border-[var(--arn-bdr-2)] hover:shadow-[0_4px_16px_rgba(0,0,0,.04)]"
                      )}
                    >
                      {isSelected && (
                        <i
                          className="ti ti-check absolute top-2 right-2 text-[var(--arn-amber)]"
                          aria-hidden="true"
                        />
                      )}
                      <div className="flex shrink-0 items-center justify-center">
                        <GoalIcon name={goal.label} icon={goal.icon} />
                      </div>
                      <div className="w-full min-w-0 break-words text-xs font-bold leading-tight text-[var(--arn-txt)] sm:text-sm">
                        {goal.label}
                      </div>
                      <div className="text-[10px] text-[var(--arn-txt-3)]">
                        {goal.tenureLabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
