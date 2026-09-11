"use client";

import { useState } from "react";
import Link from "next/link";

const sections = [
  { id: 1, href: "/financial-plan", label: "Personal Details" },
  { id: 2, href: "/financial-plan?section=2", label: "Financial Goals" },
  { id: 3, href: "/financial-plan?section=3", label: "Risk Profile" },
  { id: 4, href: "/financial-plan?section=4", label: "Investment Plan" },
  { id: 5, href: "/financial-plan?section=5", label: "Summary & Submit" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(1);

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
            const isActive = activeSection === section.id;
            const href = section.href;
            return (
              <Link
                key={section.id}
                href={href}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--arn-amber)] text-[var(--arn-bg)]"
                    : "text-[var(--arn-txt-2)] hover:bg-[var(--arn-bg-2)] hover:text-[var(--arn-txt)]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-[var(--arn-bg)] text-[var(--arn-amber)]"
                      : "bg-[var(--arn-bg-2)] text-[var(--arn-txt-3)]"
                  }`}
                >
                  {section.id}
                </span>
                {section.label}
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
        <main className="p-4 lg:p-6">{children}</main>
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