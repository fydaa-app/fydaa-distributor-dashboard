"use client";

import { useState } from "react";
import Link from "next/link";
import Section1PersonalDetails from "./sections/Section1PersonalDetails";
import Section2FinancialGoals from "./sections/Section2FinancialGoals";
import Section3RiskProfile from "./sections/Section3RiskProfile";
import Section4InvestmentPlan from "./sections/Section4InvestmentPlan";
import Section5Summary from "./sections/Section5Summary";
import { FINANCIAL_PLAN_SECTIONS } from "@/types/financialPlan";

interface SectionComponentProps {
  formData: Record<number, string>;
  onChange: (questionId: number, value: string) => void;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  submitError: string | null;
  onPrev?: () => void;
  onNext?: () => void;
  isLastSection: boolean;
}

interface FinancialPlanFormProps {
  sections: typeof FINANCIAL_PLAN_SECTIONS;
  currentSection: 1 | 2 | 3 | 4 | 5;
  onSectionChange: (section: 1 | 2 | 3 | 4 | 5) => void;
  formData: Record<number, string>;
  onFormDataChange: (questionId: number, value: string) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

export default function FinancialPlanForm({
  sections,
  currentSection,
  onSectionChange,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
  submitError,
}: FinancialPlanFormProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SectionComponents: Record<number, React.ComponentType<SectionComponentProps>> = {
    1: Section1PersonalDetails,
    2: Section2FinancialGoals,
    3: Section3RiskProfile,
    4: Section4InvestmentPlan,
    5: Section5Summary,
  };

  const ActiveSection = SectionComponents[currentSection];

  const handlePrev = () => {
    if (currentSection > 1) {
      onSectionChange((currentSection - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleNext = () => {
    if (currentSection < 5) {
      onSectionChange((currentSection + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--arn-bg-3)]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[var(--arn-bg)] border-r border-[var(--arn-bdr)] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Financial Plan Sections"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--arn-bdr)]">
          <h2 className="text-lg font-bold text-[var(--arn-txt)]">360° Financial Plan</h2>
          <button
            className="lg:hidden text-[var(--arn-txt-2)] hover:text-[var(--arn-txt)]"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-4 space-y-2" aria-label="Section navigation">
          {sections.map((section) => {
            const isActive = currentSection === section.id;
            const isComplete = section.id < currentSection;
            return (
              <Link
                key={section.id}
                href={`/financial-plan?section=${section.id}`}
                onClick={() => onSectionChange(section.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--arn-amber)] text-[var(--arn-bg)]"
                    : isComplete
                    ? "text-[var(--arn-amber)] hover:bg-[var(--arn-bg-2)]"
                    : "text-[var(--arn-txt-2)] hover:bg-[var(--arn-bg-2)] hover:text-[var(--arn-txt)]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-[var(--arn-bg)] text-[var(--arn-amber)]"
                      : isComplete
                      ? "bg-[var(--arn-amber)] text-[var(--arn-bg)]"
                      : "bg-[var(--arn-bg-2)] text-[var(--arn-txt-3)]"
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    section.id
                  )}
                </span>
                {section.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-4 lg:px-6">
          <button
            className="lg:hidden p-2 text-[var(--arn-txt-2)] hover:text-[var(--arn-txt)] hover:bg-[var(--arn-bg-2)] rounded-lg"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[var(--arn-txt)]">360° Financial Plan</h1>
        </header>
        <main className="p-4 lg:p-6">
          <div className="max-w-3xl mx-auto">
            <ActiveSection
              formData={formData}
              onChange={onFormDataChange}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              submitError={submitError}
              onPrev={currentSection > 1 ? handlePrev : undefined}
              onNext={currentSection < 5 ? handleNext : undefined}
              isLastSection={currentSection === 5}
            />
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}