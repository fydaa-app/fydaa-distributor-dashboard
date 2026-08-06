"use client";

import { useCallback, useState } from "react";
import ArnGoalSetupStepper from "@/components/goalSetup/ArnGoalSetupStepper";
import ArnClientSelector from "@/components/goalSetup/ArnClientSelector";
import ArnClientPreview from "@/components/goalSetup/ArnClientPreview";
import ArnGoalSetupBottomBar from "@/components/goalSetup/ArnGoalSetupBottomBar";
import type { GoalSetupClient } from "@/services/arnGoalSetupService";

const STEP_NAMES: Record<number, string> = {
  1: "Select a client",
  2: "Choose path",
  3: "Set SIP",
  4: "Pick SIP date",
  5: "Review & confirm",
};

export default function ArnGoalSetupPage() {
  const [step, setStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState<GoalSetupClient | null>(null);

  const handleClientSelect = useCallback((client: GoalSetupClient) => {
    setSelectedClient(client);
  }, []);

  const handleSearchChange = useCallback(() => {
    setSelectedClient(null);
  }, []);

  const handlePageChange = useCallback(() => {
    setSelectedClient(null);
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedClient && step === 1) {
      setStep(2);
    }
  }, [selectedClient, step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 pb-32 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ArnGoalSetupStepper currentStep={step} />

      {step === 1 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-[var(--arn-txt)] sm:text-base">
              Select a client
            </h2>
            <ArnClientSelector
              onSelect={handleClientSelect}
              selectedClientId={selectedClient?.userId ?? null}
              onSearchChange={handleSearchChange}
              onPageChange={handlePageChange}
            />
          </div>
          <div className="hidden lg:block">
            <div className="lg:sticky lg:top-[100px]">
              <ArnClientPreview client={selectedClient} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && selectedClient && (
        <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
          <h2 className="mb-2 text-sm font-black text-[var(--arn-txt)] sm:text-base">
            Step 2 — coming soon
          </h2>
          <p className="text-sm text-[var(--arn-txt-2)]">
            Selected client: {selectedClient.name} (ID: {selectedClient.userId})
          </p>
        </div>
      )}

      <ArnGoalSetupBottomBar
        step={step}
        stepName={STEP_NAMES[step]}
        onBack={handleBack}
        onContinue={handleContinue}
        canContinue={!!selectedClient}
        continueLabel="Continue →"
      />
    </div>
  );
}
