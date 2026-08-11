"use client";

import { useCallback, useRef, useState } from "react";
import ArnGoalSetupStepper from "@/components/goalSetup/ArnGoalSetupStepper";
import ArnClientSelector from "@/components/goalSetup/ArnClientSelector";
import ArnClientPreview from "@/components/goalSetup/ArnClientPreview";
import ArnGoalSetupBottomBar from "@/components/goalSetup/ArnGoalSetupBottomBar";
import ArnGoalPathSelector from "@/components/goalSetup/ArnGoalPathSelector";
import ArnDirectProductSelector from "@/components/goalSetup/ArnDirectProductSelector";
import ArnSetSipPage, { type ArnSetSipPageRef } from "@/components/goalSetup/ArnSetSipPage";
import type { GoalSetupClient } from "@/services/arnGoalSetupService";
import type { DirectProduct } from "@/components/goalSetup/ArnDirectProductSelector";

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
  const [selectedPath, setSelectedPath] = useState<"goal" | "direct" | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DirectProduct | null>(null);
  const sipPageRef = useRef<ArnSetSipPageRef>(null);

  const handleClientSelect = useCallback((client: GoalSetupClient) => {
    setSelectedClient(client);
  }, []);

  const handleSearchChange = useCallback(() => {
    setSelectedClient(null);
  }, []);

  const handlePageChange = useCallback(() => {
    setSelectedClient(null);
  }, []);

  const handlePathSelect = useCallback((path: "goal" | "direct") => {
    setSelectedPath(path);
  }, []);

  const handleProductSelect = useCallback((product: DirectProduct) => {
    setSelectedProduct(product);
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedClient && step === 1) {
      setStep(2);
    } else if (selectedPath === "direct" && selectedProduct && step === 2) {
      setStep(3);
    } else if (selectedPath === "goal" && step === 2) {
      setStep(3);
    } else if (step === 3 && sipPageRef.current) {
      sipPageRef.current.getConfig();
      setStep(4);
    }
  }, [selectedClient, selectedPath, selectedProduct, step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 pb-32 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ArnGoalSetupStepper currentStep={step} />

      {step === 1 && (
        <>
          <div>
            <h2 className="text-xl font-extrabold text-[var(--arn-txt)] sm:text-2xl">
              Select a <span className="text-[var(--arn-amber)]">client</span>
            </h2>
            <p className="mt-1 text-sm text-[var(--arn-txt-2)] sm:text-base">
              Choose the client you want to set up a goal or SIP for.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
            <div className="space-y-4">
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
        </>
      )}

      {step === 2 && selectedClient && (
        <div className={selectedPath === "direct" ? "pb-40" : ""}>
          {selectedPath === "direct" ? (
            <ArnDirectProductSelector
              selectedClient={selectedClient}
              selectedProductKey={selectedProduct?.key ?? null}
              onSelect={handleProductSelect}
              onBack={() => setSelectedPath(null)}
            />
          ) : (
            <ArnGoalPathSelector
              selectedClient={selectedClient}
              onSelect={handlePathSelect}
            />
          )}
        </div>
      )}

      {step === 3 && (
        <div className="pb-40">
          <ArnSetSipPage
            ref={sipPageRef}
            selectedClient={selectedClient}
            selectedProduct={selectedPath === "direct" ? selectedProduct : null}
            onBack={handleBack}
          />
        </div>
      )}

      <ArnGoalSetupBottomBar
        step={step}
        stepName={STEP_NAMES[step]}
        onBack={handleBack}
        onContinue={handleContinue}
        canContinue={
          step === 1
            ? !!selectedClient
            : step === 2
              ? selectedPath === "direct"
                ? !!selectedProduct
                : !!selectedPath
              : step === 3
                ? true
                : false
        }
        continueLabel="Continue →"
      />
    </div>
  );
}
