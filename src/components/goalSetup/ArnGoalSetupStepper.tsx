import { Fragment } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Select client" },
  { number: 2, label: "Choose path" },
  { number: 3, label: "Set SIP" },
  { number: 4, label: "SIP date" },
  { number: 5, label: "Review" },
] as const;

interface ArnGoalSetupStepperProps {
  currentStep: number;
}

export default function ArnGoalSetupStepper({ currentStep }: ArnGoalSetupStepperProps) {
  return (
    <div className="w-full rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4 sm:p-5">
      <div className="flex w-full items-start">
        {STEPS.map((step, index) => {
          const isActive = step.number === currentStep;
          const isDone = step.number < currentStep;
          const isFuture = step.number > currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <Fragment key={step.number}>
              <div className="flex shrink-0 flex-col items-center gap-1 sm:gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors sm:h-8 sm:w-8 sm:text-sm",
                    isActive && "bg-[var(--arn-amber)] text-white shadow-[0_0_0_3px_rgba(184,134,11,.15)]",
                    isDone && "bg-[var(--arn-green)] text-white",
                    isFuture && "bg-[var(--arn-bdr)] text-[var(--arn-txt-3)]"
                  )}
                >
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "max-w-[4.25rem] text-center text-[10px] font-semibold leading-tight transition-colors sm:max-w-none sm:text-xs",
                    isActive && "text-[var(--arn-amber)]",
                    isDone && "text-[var(--arn-green)]",
                    isFuture && "text-[var(--arn-txt-3)]"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "mx-2 mt-[13px] h-[2px] min-w-0 flex-1 self-start sm:mx-4 sm:mt-[15px]",
                    index < currentStep - 1 ? "bg-[var(--arn-green)]" : "bg-[var(--arn-bdr)]"
                  )}
                  aria-hidden
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
