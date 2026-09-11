"use client";

import { FINANCIAL_PLAN_SECTIONS } from "@/types/financialPlan";

interface SectionProps {
  formData: Record<number, string>;
  onChange: (questionId: number, value: string) => void;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  submitError: string | null;
  onPrev?: () => void;
  onNext?: () => void;
  isLastSection: boolean;
}

function renderField(field: typeof FINANCIAL_PLAN_SECTIONS[0]["fields"][0], formData: Record<number, string>, onChange: (questionId: number, value: string) => void) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange(field.questionId, e.target.value);
  };

  switch (field.type) {
    case "radio":
      return (
        <div className="space-y-3">
          {field.options?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 p-3 border border-[var(--arn-bdr)] rounded-lg cursor-pointer hover:bg-[var(--arn-bg-2)] transition-colors">
              <input
                type="radio"
                name={`q-${field.questionId}`}
                value={opt.value}
                checked={formData[field.questionId] === opt.value}
                onChange={(e) => onChange(field.questionId, e.target.value)}
                className="w-4 h-4 text-[var(--arn-amber)] border-[var(--arn-bdr)] focus:ring-2 focus:ring-[var(--arn-amber)]"
              />
              <span className="text-[var(--arn-txt)]">{opt.label}</span>
            </label>
          ))}
        </div>
      );
    case "select":
      return (
        <select
          value={formData[field.questionId] || ""}
          onChange={handleChange}
          className="field-input w-full"
          required={field.required}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "number":
      return (
        <input
          type="number"
          value={formData[field.questionId] || ""}
          onChange={handleChange}
          placeholder={field.placeholder}
          min={field.validation?.min}
          max={field.validation?.max}
          className="field-input w-full"
          required={field.required}
          inputMode="numeric"
        />
      );
    case "textarea":
      return (
        <textarea
          value={formData[field.questionId] || ""}
          onChange={handleChange}
          placeholder={field.placeholder}
          minLength={field.validation?.minLength}
          maxLength={field.validation?.maxLength}
          className="field-input w-full min-h-[100px]"
          required={field.required}
        />
      );
    default:
      return (
        <input
          type="text"
          value={formData[field.questionId] || ""}
          onChange={handleChange}
          placeholder={field.placeholder}
          pattern={field.validation?.pattern}
          minLength={field.validation?.minLength}
          maxLength={field.validation?.maxLength}
          className="field-input w-full"
          required={field.required}
        />
      );
  }
}

export default function Section4InvestmentPlan({
  formData,
  onChange,
  isSubmitting,
  onSubmit,
  submitError,
  onPrev,
  onNext,
  isLastSection,
}: SectionProps) {
  const section = FINANCIAL_PLAN_SECTIONS[3];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLastSection) {
      onSubmit();
    } else if (onNext) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="step-eyebrow">Section 4 of 5</p>
        <h2 className="step-title">{section.title}</h2>
        <p className="step-helper">{section.description}</p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        {section.fields.map((field) => (
          <div key={field.questionId} className="space-y-1.5">
            <label className="field-label">
              {field.label} {field.required && <span className="req">Required</span>}
            </label>
            {renderField(field, formData, onChange)}
            {submitError && (
              <div className="field-error text-sm">
                <i className="ti ti-alert-circle" aria-hidden="true" />
                {submitError}
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-4 border-t border-[var(--arn-bdr)]">
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            className="btn-secondary flex-1"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? "Submitting..." : isLastSection ? "Submit Financial Plan" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}