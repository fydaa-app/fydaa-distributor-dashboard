"use client";

import { useCallback, useRef, useState } from "react";
import ArnGoalSetupStepper from "@/components/goalSetup/ArnGoalSetupStepper";
import ArnClientSelector from "@/components/goalSetup/ArnClientSelector";
import ArnClientPreview from "@/components/goalSetup/ArnClientPreview";
import ArnGoalSetupBottomBar from "@/components/goalSetup/ArnGoalSetupBottomBar";
import ArnGoalPathSelector from "@/components/goalSetup/ArnGoalPathSelector";
import ArnDirectProductSelector from "@/components/goalSetup/ArnDirectProductSelector";
import ArnGoalGrid from "@/components/goalSetup/ArnGoalGrid";
import ArnSetSipPage, { type ArnSetSipPageRef } from "@/components/goalSetup/ArnSetSipPage";
import ArnSetSipDatePage, { type ArnSetSipDatePageRef } from "@/components/goalSetup/ArnSetSipDatePage";
import ArnReviewConfirmPage, { type ArnReviewConfirmPageRef } from "@/components/goalSetup/ArnReviewConfirmPage";
import type { GoalSetupClient } from "@/services/arnGoalSetupService";
import type { GoalResponse } from "@/services/arnStockApi";
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
  const [selectedGoal, setSelectedGoal] = useState<GoalResponse | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DirectProduct | null>(null);
  const sipPageRef = useRef<ArnSetSipPageRef>(null);
  const sipDatePageRef = useRef<ArnSetSipDatePageRef>(null);
  const reviewPageRef = useRef<ArnReviewConfirmPageRef>(null);
  const [reviewCta, setReviewCta] = useState<{ label: string; disabled: boolean; isLoading?: boolean }>({ label: "Activate SIP", disabled: false });
  const [sipConfig, setSipConfig] = useState<ReturnType<ArnSetSipPageRef["getConfig"]>>({
    sipAmount: 10000,
    frequency: "monthly",
    tenure: 10,
    selectedFund: "",
    selectedScheme: null,
    selectedMfId: null,
    lumpSumEnabled: false,
    lumpSumAmount: 0,
    expectedCagr: 0.12,
  });
  const [dateConfig, setDateConfig] = useState<ReturnType<ArnSetSipDatePageRef["getDateConfig"]>>({
    sipDate: 10,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    autoRenewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    sipFrequency: "monthly",
  });

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
    setSelectedGoal(null);
    setSelectedProduct(null);
  }, []);

  const handleProductSelect = useCallback((product: DirectProduct) => {
    setSelectedProduct(product);
  }, []);

  const handleGoalSelect = useCallback((goal: GoalResponse) => {
    setSelectedGoal(goal);
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedClient && step === 1) {
      setStep(2);
    } else if (selectedPath === "direct" && selectedProduct && step === 2) {
      setStep(3);
    } else if (selectedPath === "goal" && selectedGoal && step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (sipPageRef.current) {
        try {
          sipPageRef.current.getConfig();
        } catch {}
      }
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      reviewPageRef.current?.handleCta();
    }
  }, [selectedClient, selectedPath, selectedGoal, selectedProduct, step]);

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
        <div className="pb-40">
          {selectedPath === "direct" ? (
            <ArnDirectProductSelector
              selectedClient={selectedClient!}
              selectedProductKey={selectedProduct?.key ?? null}
              onSelect={handleProductSelect}
              onBack={() => setSelectedPath(null)}
            />
          ) : selectedPath === "goal" ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPath(null);
                  setSelectedGoal(null);
                }}
                className="shrink-0 text-xs font-semibold text-[var(--arn-amber)] transition-opacity hover:opacity-70"
              >
                ← Change path
              </button>
              <div className="mt-4">
                <ArnGoalGrid
                  selectedGoalId={selectedGoal?.id ?? null}
                  onSelect={handleGoalSelect}
                />
              </div>
            </div>
          ) : (
            <ArnGoalPathSelector
              selectedClient={selectedClient!}
              onSelect={handlePathSelect}
            />
          )}
        </div>
      )}

      {step === 3 && (
        <div className="pb-40">
          <ArnSetSipPage
            ref={sipPageRef}
            selectedClient={selectedClient!}
            selectedGoal={selectedPath === "goal" ? selectedGoal : null}
            selectedProduct={selectedPath === "direct" ? selectedProduct : null}
            mode={selectedPath === "goal" ? "goal" : "direct"}
            onBack={handleBack}
            onConfigChange={setSipConfig}
          />
        </div>
      )}

      {step === 4 && (
        <div className="pb-40">
          <ArnSetSipDatePage
            ref={sipDatePageRef}
            selectedProduct={selectedPath === "direct" ? selectedProduct : null}
            sipConfig={sipConfig}
            onBack={handleBack}
            onDateConfigChange={setDateConfig}
          />
        </div>
      )}

      {step === 5 && (
        <div className="pb-40">
          <ArnReviewConfirmPage
            ref={reviewPageRef}
            selectedClient={selectedClient!}
            selectedProduct={selectedPath === "direct" ? selectedProduct : null}
            selectedGoal={null}
            sipConfig={sipConfig}
            dateConfig={dateConfig}
            onBack={handleBack}
            onCtaChange={setReviewCta}
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
                : !!selectedGoal
              : step === 3 || step === 4
                ? true
                : step === 5
                  ? !reviewCta.disabled
                  : false
        }
        continueLabel={step === 5 ? reviewCta.label : "Continue →"}
        isLoading={step === 5 ? reviewCta.isLoading : false}
      />
    </div>
  );
}
