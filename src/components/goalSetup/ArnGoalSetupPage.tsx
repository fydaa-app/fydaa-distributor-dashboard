"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ArnGoalSetupStepper from "@/components/goalSetup/ArnGoalSetupStepper";
import ArnClientSelector from "@/components/goalSetup/ArnClientSelector";
import ArnClientPreview from "@/components/goalSetup/ArnClientPreview";
import ArnGoalSetupBottomBar from "@/components/goalSetup/ArnGoalSetupBottomBar";
import ArnGoalPathSelector from "@/components/goalSetup/ArnGoalPathSelector";
import ArnFundSearchBar from "@/components/goalSetup/ArnFundSearchBar";
import ArnDirectProductSelector from "@/components/goalSetup/ArnDirectProductSelector";
import ArnGoalGrid from "@/components/goalSetup/ArnGoalGrid";
import ArnSetSipPage, { type ArnSetSipPageRef } from "@/components/goalSetup/ArnSetSipPage";
import ArnSetSipDatePage, { type ArnSetSipDatePageRef } from "@/components/goalSetup/ArnSetSipDatePage";
import ArnReviewConfirmPage, { type ArnReviewConfirmPageRef } from "@/components/goalSetup/ArnReviewConfirmPage";
import ArnIncompleteOnboardingModal from "@/components/goalSetup/ArnIncompleteOnboardingModal";
import type { GoalSetupClient } from "@/services/arnGoalSetupService";
import type { GoalResponse, FundOption } from "@/services/arnStockApi";
import type { DirectProduct } from "@/components/goalSetup/ArnDirectProductSelector";
import { getUserStage } from "@/services/arnReviewApi";

const STEP_NAMES_SIP: Record<number, string> = {
  1: "Select a client",
  2: "Choose path",
  3: "Set SIP",
  4: "Pick SIP date",
  5: "Review & confirm",
};

const STEP_NAMES_LUMPSUM: Record<number, string> = {
  1: "Select a client",
  2: "Choose path",
  3: "Set investment",
  4: "Review & confirm",
};

function normalizeFundGoal(fund: FundOption): FundOption {
  if (fund.suggestedGoalId && fund.suggestedGoalName) return fund;
  return {
    ...fund,
    suggestedGoalId: fund.suggestedGoalId ?? 42,
    suggestedGoalName: fund.suggestedGoalName ?? "Custom",
  };
}

interface OnboardedTarget {
  userId: string;
  name: string;
  phone: string;
  email: string;
  skipClientStep?: boolean;
}

function readOnboardTarget(): OnboardedTarget | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem("arn_onboard_target_user");
    if (!stored) return null;
    return JSON.parse(stored) as OnboardedTarget;
  } catch {
    return null;
  }
}

function buildClientFromTarget(target: OnboardedTarget): GoalSetupClient | null {
  const userId = Number(target.userId);
  if (!target.userId || !Number.isFinite(userId) || userId <= 0) return null;

  return {
    userId,
    name: target.name.trim(),
    mobileNumber: target.phone || "",
    email: target.email || "",
    mandateStatus: "PENDING",
    panStatus: undefined,
    createdAt: new Date().toISOString(),
  };
}

function needsClientLookup(
  client: GoalSetupClient | null,
  target: OnboardedTarget | null
): boolean {
  if (!target?.skipClientStep) return false;

  const phone = target.phone || client?.mobileNumber;
  if (!phone) return false;

  if (!client) return true;

  return !client.name.trim();
}

export default function ArnGoalSetupPage() {
  const router = useRouter();
  const initialOnboardTarget = readOnboardTarget();
  const initialClient = initialOnboardTarget
    ? buildClientFromTarget(initialOnboardTarget)
    : null;
  const shouldSkipClientStep =
    initialOnboardTarget?.skipClientStep === true && !!initialClient;

  const [step, setStep] = useState(shouldSkipClientStep ? 2 : 1);
  const [selectedClient, setSelectedClient] = useState<GoalSetupClient | null>(initialClient);
  const [selectedPath, setSelectedPath] = useState<"goal" | "direct" | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalResponse | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DirectProduct | null>(null);
  const [preselectedFund, setPreselectedFund] = useState<FundOption | null>(null);
  const [fundSelectError, setFundSelectError] = useState<string | null>(null);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [incompleteClientName, setIncompleteClientName] = useState("");
  const [incompleteUserMobile, setIncompleteUserMobile] = useState("");
  const [isCheckingStage, setIsCheckingStage] = useState(false);
  const [investmentMode, setInvestmentMode] = useState<"sip" | "lumpsum">("sip");
  const sipPageRef = useRef<ArnSetSipPageRef>(null);
  const sipDatePageRef = useRef<ArnSetSipDatePageRef>(null);
  const reviewPageRef = useRef<ArnReviewConfirmPageRef>(null);
  const didMount = useRef(false);

  const onboardedTarget = initialOnboardTarget;

  const STEP_NAMES = investmentMode === "lumpsum" ? STEP_NAMES_LUMPSUM : STEP_NAMES_SIP;

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  useEffect(() => {
    if (!initialOnboardTarget) return;
    sessionStorage.removeItem("arn_onboard_target_user");
  }, [initialOnboardTarget]);

  const [sipConfig, setSipConfig] = useState<ReturnType<ArnSetSipPageRef["getConfig"]>>({
    sipAmount: 10000,
    frequency: "monthly",
    tenure: 10,
    selectedFund: "",
    selectedScheme: null,
    selectedMfId: null,
    investmentMode: "sip",
    expectedCagr: 0.12,
    portfolioId: null,
  });
  const [dateConfig, setDateConfig] = useState<ReturnType<ArnSetSipDatePageRef["getDateConfig"]>>({
    sipDate: 10,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    autoRenewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    sipFrequency: "monthly",
  });
  const [reviewCta, setReviewCta] = useState<{ label: string; disabled: boolean; isLoading?: boolean }>({ label: "Activate SIP", disabled: false });

  useEffect(() => {
    if (!needsClientLookup(selectedClient, onboardedTarget)) return;

    const phone = onboardedTarget?.phone || selectedClient?.mobileNumber || "";
    let cancelled = false;

    import("@/services/arnGoalSetupService")
      .then(({ getGoalSetupClients }) =>
        getGoalSetupClients({
          page: 1,
          limit: 10,
          search: phone,
        })
      )
      .then((response) => {
        if (cancelled) return;

        const normalizedPhone = phone.replace(/\D/g, "");
        const match = response.users.find((client) => {
          const clientPhone = client.mobileNumber.replace(/\D/g, "");
          return (
            clientPhone === normalizedPhone ||
            clientPhone.endsWith(normalizedPhone) ||
            normalizedPhone.endsWith(clientPhone)
          );
        });

        if (match) {
          setSelectedClient(match);
          setStep(2);
          return;
        }

        const fallbackName = onboardedTarget?.name?.trim();
        if (selectedClient && fallbackName) {
          setSelectedClient({ ...selectedClient, name: fallbackName });
        }
      })
      .catch(() => {
        const fallbackName = onboardedTarget?.name?.trim();
        if (selectedClient && fallbackName) {
          setSelectedClient({ ...selectedClient, name: fallbackName });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onboardedTarget, selectedClient]);

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
    setPreselectedFund(null);
    setFundSelectError(null);
  }, []);

  const handleProductSelect = useCallback((product: DirectProduct) => {
    setSelectedProduct(product);
    setPreselectedFund(null);
    setFundSelectError(null);
  }, []);

  const handleGoalSelect = useCallback((goal: GoalResponse) => {
    setSelectedGoal(goal);
    setPreselectedFund(null);
    setFundSelectError(null);
  }, []);

  const handleSearchFundSelect = useCallback((fund: FundOption) => {
    const normalized = normalizeFundGoal(fund);
    setFundSelectError(null);
    setSelectedPath("goal");
    setSelectedGoal(null);
    setSelectedProduct(null);
    setPreselectedFund(normalized);
  }, []);

  const handleContinue = useCallback(async () => {
    if (selectedClient && step === 1) {
      if (isCheckingStage) return;

      setIsCheckingStage(true);
      try {
        const stage = await getUserStage(selectedClient.userId, 0, "MUTUALFUND");

        if (
          stage.isRiskProfileComplete &&
          stage.isEmail &&
          stage.isKycCompliant &&
          stage.isBank &&
          stage.isNominee &&
          !!stage.kycExtraData
        ) {
          setStep(2);
          return;
        }

        setIncompleteClientName(selectedClient.name);
        setIncompleteUserMobile(selectedClient.mobileNumber);
        setShowIncompleteModal(true);
      } catch {
        setIncompleteClientName(selectedClient.name);
        setIncompleteUserMobile(selectedClient.mobileNumber);
        setShowIncompleteModal(true);
      } finally {
        setIsCheckingStage(false);
      }
      return;
    } else if (selectedPath === "direct" && selectedProduct && step === 2) {
      setStep(3);
    } else if (step === 2 && selectedPath === "goal" && !selectedGoal && preselectedFund) {
      const normalized = normalizeFundGoal(preselectedFund);

      const syntheticGoal: GoalResponse = {
        id: normalized.suggestedGoalId,
        name: normalized.suggestedGoalName,
        termId: 2,
        termName: "Medium Term",
        tenureMin: 36,
        tenureMax: 360,
        feePricing: 0,
        goalAmountMin: 10000,
        goalAmountMax: 10000000,
        description: normalized.suggestedGoalName,
        items: [],
        imageUrl: "",
        iconUrl: "",
      };

      const syntheticProduct: DirectProduct = {
        key: `fund-search-${preselectedFund.id ?? preselectedFund.isin}`,
        name: normalized.suggestedGoalName,
        tagline: normalized.suggestedGoalName,
        goldLine: normalized.suggestedGoalName,
        description: normalized.suggestedGoalName,
        goalId: normalized.suggestedGoalId,
        stockType: preselectedFund.stockType || "IndianStock",
        assumedCagr: "12%",
        defAmt: 10000,
        defTenure: 10,
        tenures: [3, 5, 10, 20, 30],
        defFund: preselectedFund.schemeName || preselectedFund.fundName || preselectedFund.stockName || preselectedFund.name || "",
      };

      setSelectedGoal(syntheticGoal);
      setSelectedProduct(syntheticProduct);
      setFundSelectError(null);
      setStep(3);
    } else if (selectedPath === "goal" && selectedGoal && step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (sipPageRef.current?.hasTenureError) return;
      if (sipPageRef.current) {
        try {
          sipPageRef.current.getConfig();
        } catch {}
      }
      if (investmentMode === "lumpsum") {
        setStep(5);
      } else {
        setStep(4);
      }
    } else if (step === 4 && investmentMode === "sip") {
      setStep(5);
    } else if (step === 5) {
      reviewPageRef.current?.handleCta();
    }
  }, [selectedClient, selectedPath, selectedGoal, selectedProduct, step, preselectedFund, isCheckingStage, investmentMode]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      if (step === 3) setInvestmentMode("sip");

      if (step === 5 && investmentMode === "lumpsum") {
        setStep(3);
      } else {
        setStep(step - 1);
      }
    }
  }, [step, investmentMode]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ArnGoalSetupStepper currentStep={step} investmentMode={investmentMode} />

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
        <div>
          {selectedPath === "direct" ? (
            <ArnDirectProductSelector
              selectedClient={selectedClient!}
              selectedProductKey={selectedProduct?.key ?? null}
              onSelect={handleProductSelect}
              onBack={() => setSelectedPath(null)}
            />
          ) : selectedPath === "goal" ? (
            preselectedFund ? (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPath(null);
                    setSelectedGoal(null);
                    setPreselectedFund(null);
                    setFundSelectError(null);
                  }}
                  className="shrink-0 text-xs font-semibold text-[var(--arn-amber)] transition-opacity hover:opacity-70"
                >
                  ← Change path
                </button>
                <div className="mt-6">
                  <ArnFundSearchBar onSelect={handleSearchFundSelect} />
                  {preselectedFund && (
                    <div className="mt-3 rounded-[12px] border border-[var(--arn-input-ring)] bg-[var(--arn-amber-bg)] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--arn-input-ring)] text-[10px] font-bold text-[var(--arn-amber)]">
                          ✓
                        </span>
                        <span className="text-sm font-semibold text-[var(--arn-txt)]">
                          {preselectedFund.schemeName || preselectedFund.fundName || preselectedFund.stockName || preselectedFund.name}
                        </span>
                      </div>
                    </div>
                  )}
                  {fundSelectError && (
                    <p className="mt-2 text-xs text-[var(--arn-red)]">{fundSelectError}</p>
                  )}
                </div>
              </div>
            ) : (
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
            )
          ) : (
              <div className="space-y-6">
                <ArnGoalPathSelector
                  selectedClient={selectedClient!}
                  onSelect={handlePathSelect}
                />
                <div className="mt-6">
                  <ArnFundSearchBar onSelect={handleSearchFundSelect} />
                  {fundSelectError && (
                    <p className="mt-2 text-xs text-[var(--arn-red)]">{fundSelectError}</p>
                  )}
                </div>
              </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <ArnSetSipPage
            ref={sipPageRef}
            selectedClient={selectedClient!}
            selectedGoal={selectedPath === "goal" ? selectedGoal : null}
            selectedProduct={selectedPath === "direct" ? selectedProduct : null}
            mode={selectedPath === "goal" ? "goal" : "direct"}
            investmentMode={investmentMode}
            onModeChange={setInvestmentMode}
            onBack={handleBack}
            onConfigChange={setSipConfig}
            preselectedFund={preselectedFund}
          />
        </div>
      )}

      {step === 4 && investmentMode === "sip" && (
        <div>
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
        <div>
          <ArnReviewConfirmPage
            ref={reviewPageRef}
            selectedClient={selectedClient!}
            selectedProduct={selectedPath === "direct" ? selectedProduct : null}
            selectedGoal={null}
            sipConfig={sipConfig}
            dateConfig={dateConfig}
            onBack={handleBack}
            onCtaChange={setReviewCta}
            investmentMode={investmentMode}
          />
        </div>
      )}

      <ArnGoalSetupBottomBar
        step={step}
        stepName={STEP_NAMES[step]}
        investmentMode={investmentMode}
        onBack={handleBack}
        onContinue={handleContinue}
        canContinue={
          step === 1
            ? !!selectedClient
            : step === 2
              ? selectedPath === "direct"
                ? !!selectedProduct
                : selectedPath === "goal"
                  ? !!selectedGoal || !!preselectedFund
                  : !!preselectedFund
              : step === 3
                ? !sipPageRef.current?.hasTenureError
                : step === 4 && investmentMode === "sip"
                  ? true
                  : step === 5
                    ? !reviewCta.disabled
                    : false
        }
        continueLabel={step === 5 ? reviewCta.label : "Continue →"}
        isLoading={step === 5 ? reviewCta.isLoading : false}
      />

      {showIncompleteModal && (
        <ArnIncompleteOnboardingModal
          isOpen={showIncompleteModal}
          clientName={incompleteClientName}
          onCancel={() => setShowIncompleteModal(false)}
          onContinue={() => {
            setShowIncompleteModal(false);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem("arn_onboard_mobile", incompleteUserMobile);
            }
            router.push(`/arn-onboard?mobile=${encodeURIComponent(incompleteUserMobile)}`);
          }}
        />
      )}
    </div>
  );
}
