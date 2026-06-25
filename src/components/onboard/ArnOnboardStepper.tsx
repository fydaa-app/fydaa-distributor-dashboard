import React from 'react';

interface ArnOnboardStepperProps {
  currentStep: number;
  labels: string[];
}

export default function ArnOnboardStepper({ currentStep, labels }: ArnOnboardStepperProps) {
  return (
    <div className="flex items-center mb-4">
      {labels.map((label, index) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                index + 1 < currentStep
                  ? 'bg-[var(--arn-green)] text-[var(--arn-grn-txt)]'
                  : index + 1 === currentStep
                  ? 'bg-[var(--arn-amber)] text-white'
                  : 'bg-[var(--arn-bg-2)] text-[var(--arn-txt-3)]'
              }`}
            >
              {index + 1}
            </div>
            <div
              className={`text-[10px] ${
                index + 1 === currentStep ? 'text-[var(--arn-txt)] font-bold' : 'text-[var(--arn-txt-2)]'
              }`}
            >
              {label}
            </div>
          </div>
          {index < labels.length - 1 && (
            <div
              className={`flex-1 h-px mx-1.5 ${
                index + 1 < currentStep ? 'bg-[var(--arn-green)]' : 'bg-[var(--arn-bdr)]'
              }`}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
