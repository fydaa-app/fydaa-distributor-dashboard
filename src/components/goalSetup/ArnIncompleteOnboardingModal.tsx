"use client";

interface ArnIncompleteOnboardingModalProps {
  isOpen: boolean;
  clientName: string;
  onCancel: () => void;
  onContinue: () => void;
}

export default function ArnIncompleteOnboardingModal({
  isOpen,
  clientName,
  onCancel,
  onContinue,
}: ArnIncompleteOnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[400px] rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--arn-avatar-bg)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--arn-red)]">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[var(--arn-txt)]">User Onboarding Incomplete</h3>
            <p className="mt-1 text-sm text-[var(--arn-txt-2)]">
              <span className="font-semibold text-[var(--arn-txt)]">{clientName}</span> hasn&apos;t completed onboarding yet. Please complete their onboarding before setting up a goal or SIP.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-10 rounded-[10px] border border-[var(--arn-bdr)] px-4 py-2 text-xs font-semibold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)] hover:text-[var(--arn-txt)] sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="min-h-10 rounded-[10px] bg-[var(--arn-amber)] px-4 py-2 text-xs font-bold text-white shadow-[0_2px_8px_var(--arn-login-shadow)] transition-colors hover:bg-[var(--arn-amber-hover)] hover:shadow-[0_4px_16px_var(--arn-login-shadow-hover)] active:scale-[0.99] sm:text-sm"
          >
            Complete Onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
