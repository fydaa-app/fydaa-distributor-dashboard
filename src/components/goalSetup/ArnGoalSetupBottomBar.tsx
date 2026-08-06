import { cn } from "@/lib/utils";

interface ArnGoalSetupBottomBarProps {
  step: number;
  stepName: string;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  continueLabel: string;
}

const STEP_NAMES: Record<number, string> = {
  1: "Select a client",
  2: "Choose path",
  3: "Set SIP",
  4: "Pick SIP date",
  5: "Review & confirm",
};

export default function ArnGoalSetupBottomBar({
  step,
  stepName,
  onBack,
  onContinue,
  canContinue,
  continueLabel,
}: ArnGoalSetupBottomBarProps) {
  const displayName = stepName || STEP_NAMES[step] || "";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:left-[220px]">
      <div className="mx-auto max-w-[1100px] px-4 pb-5 sm:px-6 sm:pb-6 lg:px-8">
        <div className="flex items-center gap-3 rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4 shadow-[0_-4px_24px_rgba(0,0,0,.06)]">
          <div className="flex-1 text-xs font-medium text-[var(--arn-txt-3)] sm:text-sm">
            Step {step} of 5 · <span className="font-semibold text-[var(--arn-txt)]">{displayName}</span>
          </div>

          {step > 1 && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-[10px] border border-[var(--arn-bdr)] px-4 py-2.5 text-xs font-semibold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)] hover:text-[var(--arn-txt)] sm:text-sm"
            >
              ← Back
            </button>
          )}

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className={cn(
              "rounded-[10px] px-5 py-2.5 text-xs font-bold text-white transition-all sm:px-6 sm:text-sm",
              canContinue
                ? "bg-[var(--arn-amber)] shadow-[0_2px_8px_rgba(184,134,11,.2)] hover:bg-[#A46512] hover:shadow-[0_4px_16px_rgba(184,134,11,.3)] active:scale-[0.99]"
                : "bg-[var(--arn-bg-2)] text-[var(--arn-txt-3)] cursor-not-allowed"
            )}
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
