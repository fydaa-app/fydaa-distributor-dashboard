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

export default function Section5Summary({
  formData,
  onChange,
  isSubmitting,
  onSubmit,
  submitError,
  onPrev,
}: SectionProps) {
  const section = FINANCIAL_PLAN_SECTIONS[4];

  // Build summary of all previous sections
  const allSections = FINANCIAL_PLAN_SECTIONS.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="step-eyebrow">Section 5 of 5</p>
        <h2 className="step-title">{section.title}</h2>
        <p className="step-helper">{section.description}</p>
      </div>

      {/* Summary of previous sections */}
      <div className="bg-[var(--arn-bg)] border border-[var(--arn-bdr)] rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--arn-txt)]">Review Your Answers</h3>
        <div className="space-y-3">
          {allSections.map((s) => (
            <details key={s.id} className="group">
              <summary className="flex items-center justify-between cursor-pointer p-3 bg-[var(--arn-bg-2)] rounded-lg list-none">
                <span className="font-medium text-[var(--arn-txt)]">{s.title}</span>
                <i className="ti ti-chevron-down text-[var(--arn-txt-3)] group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-3 space-y-2 border-t border-[var(--arn-bdr)]">
                {s.fields.map((f) => {
                  const val = formData[f.questionId];
                  return val ? (
                    <div key={f.questionId} className="flex justify-between text-sm">
                      <span className="text-[var(--arn-txt-2)]">{f.label}</span>
                      <span className="text-[var(--arn-txt)] font-medium">{val}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Current section fields */}
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5">
        <div className="space-y-1.5">
          <label className="field-label">
            {section.fields[0].label} {section.fields[0].required && <span className="req">Required</span>}
          </label>
          <input
            type="email"
            value={formData[section.fields[0].questionId] || ""}
            onChange={(e) => onChange(section.fields[0].questionId, e.target.value)}
            placeholder={section.fields[0].placeholder}
            className="field-input w-full"
            required={section.fields[0].required}
          />
          {submitError && (
            <div className="field-error text-sm">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {submitError}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="field-label">
            {section.fields[1].label} {section.fields[1].required && <span className="req">Required</span>}
          </label>
          <div className="space-y-3">
            {section.fields[1].options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 p-3 border border-[var(--arn-bdr)] rounded-lg cursor-pointer hover:bg-[var(--arn-bg-2)] transition-colors">
                <input
                  type="radio"
                  name={`q-${section.fields[1].questionId}`}
                  value={opt.value}
                  checked={formData[section.fields[1].questionId] === opt.value}
                  onChange={(e) => onChange(section.fields[1].questionId, e.target.value)}
                  className="w-4 h-4 text-[var(--arn-amber)] border-[var(--arn-bdr)] focus:ring-2 focus:ring-[var(--arn-amber)]"
                />
                <span className="text-[var(--arn-txt)]">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

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
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Financial Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}