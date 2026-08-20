import { cn } from "@/lib/utils";

interface ArnGoalSetupBottomBarProps {
  step: number;
  stepName: string;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  continueLabel: string;
  isLoading?: boolean;
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
  isLoading,
}: ArnGoalSetupBottomBarProps) {
  const displayName = stepName || STEP_NAMES[step] || "";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:left-[220px]">
      <div
        className="
          pointer-events-auto
          mx-auto
          w-full
          max-w-[1100px]
          px-3
          pb-[max(1rem,env(safe-area-inset-bottom))]
          sm:px-4
          sm:pb-5
          md:px-6
          md:pb-7
          lg:px-8
          lg:pb-10
          xl:pb-12
        "
      >
        <div
          className="
            flex
            w-full
            flex-col
            gap-3
            rounded-2xl
            border
            border-[var(--arn-bdr)]
            bg-[var(--arn-bg)]
            p-3
            shadow-[0_-4px_24px_rgba(0,0,0,.06)]
            
            sm:p-4
            md:flex-row
            md:items-center
            md:justify-between
            md:gap-4
            md:p-5
            
            lg:p-6
          "
        >
          {/* Step information */}
          <div
            className="
              min-w-0
              flex-1
              text-xs
              font-medium
              leading-5
              text-[var(--arn-txt-3)]
              sm:text-sm
            "
          >
            <span className="whitespace-nowrap">
              Step {step} of 5
            </span>

            <span className="mx-1.5 sm:mx-2">·</span>

            <span className="font-semibold text-[var(--arn-txt)]">
              {displayName}
            </span>
          </div>

          {/* Actions */}
          <div
            className="
              grid
              w-full
              grid-cols-1
              gap-2.5
              
              min-[380px]:grid-cols-2
              
              md:w-auto
              md:flex
              md:shrink-0
              md:items-center
              md:gap-3
            "
          >
            {step > 1 && (
              <button
                type="button"
                onClick={onBack}
                className="
                  min-h-11
                  w-full
                  rounded-[10px]
                  border
                  border-[var(--arn-bdr)]
                  px-4
                  py-2.5
                  text-xs
                  font-semibold
                  text-[var(--arn-txt-2)]
                  transition-colors
                  hover:bg-[var(--arn-bg-2)]
                  hover:text-[var(--arn-txt)]
                  
                  sm:min-h-12
                  sm:px-5
                  sm:text-sm
                  
                  md:w-auto
                  md:min-w-[100px]
                "
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              className={cn(
                `
                  min-h-11
                  w-full
                  rounded-[10px]
                  px-5
                  py-2.5
                  text-xs
                  font-bold
                  transition-all
                  
                  sm:min-h-12
                  sm:px-6
                  sm:text-sm
                  
                  md:w-auto
                  md:min-w-[140px]
                  
                  lg:px-7
                `,
                canContinue
                  ? `
                    bg-[var(--arn-amber)]
                    text-white
                    shadow-[0_2px_8px_rgba(184,134,11,.2)]
                    hover:bg-[#A46512]
                    hover:shadow-[0_4px_16px_rgba(184,134,11,.3)]
                    active:scale-[0.99]
                  `
                  : `
                    cursor-not-allowed
                    bg-[var(--arn-bg-2)]
                    text-[var(--arn-txt-3)]
                  `
              )}
            >
              {isLoading && (
                <span className="mr-1.5 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[var(--arn-amber)] border-t-transparent" />
              )}
              {continueLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}