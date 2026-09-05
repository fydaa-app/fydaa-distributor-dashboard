"use client";

import { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { type GoalSetupClient } from "@/services/arnGoalSetupService";
import { type DirectProduct } from "@/components/goalSetup/ArnDirectProductSelector";
import type { ArnSetSipPageRef } from "@/components/goalSetup/ArnSetSipPage";
import type { ArnSetSipDatePageRef } from "@/components/goalSetup/ArnSetSipDatePage";
import { calculateProjectedCorpus } from "@/lib/sipMath";
import {
  checkKycForUser,
  sendConsentOtpForUser,
  verifyConsentOtpForUser,
  createSipSetupForUser,
  getBuyOrderMfForUser,
  completeWithMandateFirstDebitForUser,
  setupMandateForUser,
  getMandateForSip,
  updateMfiaForUser,
  getMySipMfForUser,
  checkLumpsumCanCreate,
  createLumpsumForUser,
  completeLumpsumForUser,
  captureLumpsumPayment,
  getBuyOrderMfForPortfolio,
  type KycCheckResponse,
  type SipSetupPayload,
  type SetupMandateResponse,
  type LumpsumCreatePayload,
  type LumpsumOrder,
} from "@/services/arnReviewApi";

export interface ArnReviewConfirmPageRef {
  getPayload: () => SipSetupPayload;
  handleCta: () => Promise<void>;
}

interface ArnReviewConfirmPageProps {
  selectedClient: GoalSetupClient;
  selectedProduct: DirectProduct | null;
  selectedGoal?: { name: string } | null;
  sipConfig: ReturnType<ArnSetSipPageRef["getConfig"]>;
  dateConfig: ReturnType<ArnSetSipDatePageRef["getDateConfig"]>;
  investmentMode: "sip" | "lumpsum";
  onBack: () => void;
  onCtaChange?: (state: { label: string; disabled: boolean; isLoading?: boolean }) => void;
}

type ReadinessStatus = "ok" | "fail" | "loading";

interface ReadinessState {
  kyc: ReadinessStatus;
  consentOtp: ReadinessStatus;
  mandate: ReadinessStatus;
  paymentMethod: ReadinessStatus;
}

const INITIAL_READINESS: ReadinessState = {
  kyc: "loading",
  consentOtp: "fail",
  mandate: "fail",
  paymentMethod: "ok",
};

const ArnReviewConfirmPage = forwardRef<ArnReviewConfirmPageRef, ArnReviewConfirmPageProps>(
  function ArnReviewConfirmPage(
    { selectedClient, selectedProduct, selectedGoal, sipConfig, dateConfig, investmentMode, onBack, onCtaChange },
    ref
  ) {
    const router = useRouter();
    const [readiness, setReadiness] = useState<ReadinessState>(INITIAL_READINESS);
    const [otpSent, setOtpSent] = useState(false);
    const [otpInput, setOtpInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [kycReason, setKycReason] = useState<string | null>(null);
    const [isPollingMandate, setIsPollingMandate] = useState(false);
    const [mandateError, setMandateError] = useState<string | null>(null);
    const [sipActivated, setSipActivated] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [resendSeconds, setResendSeconds] = useState(25);
    const [paymentMethod, setPaymentMethod] = useState<"UPI" | "NETBANKING">("UPI");
    const [lumpsumId, setLumpsumId] = useState<number | null>(null);
    const [isPollingPayment, setIsPollingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [investmentComplete, setInvestmentComplete] = useState(false);
    const paymentWindowRef = useRef<Window | null>(null);

    const product = useMemo(
      () =>
        selectedProduct ?? {
          key: "equity",
          name: "Equity",
          assumedCagr: "12%",
          goalId: 36,
          stockType: "IndianStock",
          defAmt: 10000,
          defTenure: 10,
          tenures: [3, 5, 10, 20, 30],
          defFund: "HDFC Flexi Cap Fund — Direct Plan — Growth",
        },
      [selectedProduct]
    );

    const goalName = useMemo(() => {
      if (selectedProduct) return selectedProduct.name;
      if (selectedGoal?.name) return selectedGoal.name;
      return "Goal-based investing";
    }, [selectedProduct, selectedGoal]);

    const projectedCorpus = useMemo(
      () =>
        calculateProjectedCorpus({
          sipAmount: sipConfig.sipAmount,
          frequency: sipConfig.frequency,
          tenure: sipConfig.tenure,
          expectedCagr: sipConfig.expectedCagr,
        }),
      [sipConfig]
    );

    const sipInstallmentLabel = sipConfig.frequency === "daily" ? "/day" : "/mo";

    const ctaState = useMemo(() => {
      if (investmentMode === "lumpsum") {
        if (investmentComplete) return { label: "Redirecting...", disabled: true };
        if (isPollingPayment) return { label: "Waiting for payment...", disabled: true };
        if (isSubmitting) return { label: "Processing...", disabled: true, isLoading: true };
        if (readiness.kyc === "fail") return { label: "Complete KYC", disabled: false };
        if (readiness.consentOtp === "fail") return { label: "Send consent OTP", disabled: false };
        if (otpSent && readiness.consentOtp !== "ok")
          return { label: "Verify OTP", disabled: otpInput.length < 6 };
        return { label: "Pay now", disabled: false };
      }

      if (readiness.kyc === "fail") return { label: "Complete KYC", disabled: false };
      if (isPollingMandate) return { label: "Waiting for mandate...", disabled: true };
      if (readiness.consentOtp === "fail") return { label: "Send consent OTP", disabled: false };
      if (otpSent && readiness.consentOtp !== "ok")
        return { label: "Verify OTP", disabled: otpInput.length < 6 };
      if (readiness.mandate === "fail") return { label: "Set up UPI mandate", disabled: false };
      if (isSubmitting) return { label: "Activating SIP...", disabled: true, isLoading: true };
      return { label: "Activate SIP", disabled: false };
    }, [readiness, otpSent, otpInput, isPollingMandate, isSubmitting, investmentMode, investmentComplete, isPollingPayment]);

    useEffect(() => {
      onCtaChange?.(ctaState);
    }, [ctaState, onCtaChange]);

    useEffect(() => {
      if (investmentMode === "lumpsum") {
        setReadiness((r) => ({ ...r, kyc: "loading", paymentMethod: "ok" }));
        return;
      }
      setReadiness((r) => ({ ...r, mandate: "fail" }));
    }, [investmentMode]);

    useEffect(() => {
      let cancelled = false;
      setReadiness((r) => ({ ...r, kyc: "loading" }));
      setKycReason(null);

      checkKycForUser(selectedClient.userId)
        .then((data: KycCheckResponse) => {
          if (!cancelled) {
            setKycReason(data.reason ?? null);
            setReadiness((r) => ({
              ...r,
              kyc: data.status === true ? "ok" : "fail",
            }));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setReadiness((r) => ({ ...r, kyc: "fail" }));
          }
        });

      return () => {
        cancelled = true;
      };
    }, [selectedClient.userId]);

    useEffect(() => {
      setSipActivated(false);
    }, [selectedClient.userId]);

    useEffect(() => {
      const paymentWindow = paymentWindowRef.current;
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
      paymentWindowRef.current = null;
      return () => {
        const win = paymentWindowRef.current;
        if (win && !win.closed) {
          win.close();
        }
        paymentWindowRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (!otpSent) {
        setCanResend(false);
        setResendSeconds(25);
        return;
      }

      if (resendSeconds <= 0) {
        setCanResend(true);
        return;
      }

      const timer = setInterval(() => {
        setResendSeconds((s) => s - 1);
      }, 1000);

      return () => clearInterval(timer);
    }, [otpSent, resendSeconds]);

    useImperativeHandle(ref, () => ({
      getPayload: () => ({
        goalId: product.goalId,
        sipAmount: sipConfig.sipAmount.toFixed(2),
        sipName: product.name,
        goalAmount: investmentMode === "sip" ? projectedCorpus.toFixed(2) : sipConfig.sipAmount.toFixed(2),
        autoRenewDate: dateConfig.autoRenewDate,
        startDate: dateConfig.startDate,
        endDate: dateConfig.endDate,
        status: "INACTIVE" as const,
        sipTenure: String(sipConfig.tenure * 12),
        sipFrequency: dateConfig.sipFrequency,
        ...(dateConfig.sipFrequency === "monthly" && { sipDate: dateConfig.startDate }),
        ...(sipConfig.selectedScheme && { selectedScheme: sipConfig.selectedScheme }),
        ...(sipConfig.selectedMfId && { selectedMfId: sipConfig.selectedMfId }),
        investmentMode,
        paymentMethod,
        ...(investmentMode === "lumpsum" && lumpsumId ? { lumpsumId } : {}),
      }),
      handleCta: () => handleCta(),
    }));

    const handleResendOtp = useCallback(async () => {
      if (!canResend || isSubmitting) return;
      setIsSubmitting(true);
      setSubmissionError(null);
      try {
        await sendConsentOtpForUser(selectedClient.userId);
        setResendSeconds(25);
        setCanResend(false);
      } catch (err) {
        setSubmissionError(err instanceof Error ? err.message : "Failed to resend OTP");
      } finally {
        setIsSubmitting(false);
      }
    }, [canResend, isSubmitting, selectedClient.userId]);

    const handleCta = useCallback(async () => {
      setSubmissionError(null);
      setMandateError(null);

      // 1. KYC gate
      if (readiness.kyc === "fail") {
        return;
      }

      // 2. Send consent OTP
      if (readiness.consentOtp === "fail") {
        setIsSubmitting(true);
        try {
          await sendConsentOtpForUser(selectedClient.userId);
          setOtpSent(true);
          setReadiness((r) => ({ ...r, consentOtp: "loading" }));
        } catch (err) {
          setSubmissionError(err instanceof Error ? err.message : "Failed to send OTP");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // 3. Verify OTP
      if (otpSent && readiness.consentOtp !== "ok") {
        setIsSubmitting(true);
        try {
          await verifyConsentOtpForUser(selectedClient.userId, otpInput);
          setReadiness((r) => ({ ...r, consentOtp: "ok" }));
          setOtpSent(false);
          setResendSeconds(25);
          setCanResend(false);

          if (investmentMode === "lumpsum") {
            setReadiness((r) => ({ ...r, paymentMethod: "ok" }));
          } else {
            setReadiness((r) => ({ ...r, mandate: "fail" }));
          }
        } catch (err) {
          setSubmissionError(err instanceof Error ? err.message : "Invalid OTP");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // 4. Lumpsum execution (after OTP verified)
      if (investmentMode === "lumpsum" && readiness.consentOtp === "ok") {
        if (!paymentWindowRef.current || paymentWindowRef.current.closed) {
          paymentWindowRef.current = window.open("/payment-loading", "_blank");
        }
        setIsSubmitting(true);
        try {
          const mfiaRes = await updateMfiaForUser(selectedClient.userId);
          if (!mfiaRes || !mfiaRes.id) {
            throw new Error("Failed to update MF investment account");
          }

          const canCreate = await checkLumpsumCanCreate(
            selectedClient.userId,
            product.goalId,
            sipConfig.selectedMfId ?? undefined,
            sipConfig.selectedScheme ?? undefined
          );

          let currentLumpsumId: number;
          let portfolioId: number;

          if (canCreate.action === "add_money" && canCreate.existingLumpsum) {
            currentLumpsumId = canCreate.existingLumpsum.id;
            portfolioId = canCreate.existingLumpsum.portfolioId;
          } else {
            const createPayload: LumpsumCreatePayload = {
              investedAmount: sipConfig.sipAmount,
              goalId: product.goalId,
              investmentDate: new Date().toISOString(),
              ...(sipConfig.portfolioId && { portfolioId: sipConfig.portfolioId }),
              ...(sipConfig.selectedMfId && { selectedMfId: sipConfig.selectedMfId }),
              ...(sipConfig.selectedScheme && { selectedScheme: sipConfig.selectedScheme }),
            };
            const createRes = await createLumpsumForUser(selectedClient.userId, createPayload);
            currentLumpsumId = createRes.lumpsumData.id ?? createRes.lumpsumId;
            portfolioId = createRes.lumpsumData.portfolioId ?? createRes.portfolioId ?? 0;
          }

          setLumpsumId(currentLumpsumId);

          let orders: LumpsumOrder[];
          const useSchemeAllocations =
            Array.isArray(sipConfig.schemeAllocations) &&
            sipConfig.schemeAllocations.length > 0 &&
            !sipConfig.userSelectedFund;

          if (useSchemeAllocations && sipConfig.schemeAllocations) {
            orders = sipConfig.schemeAllocations.map((sa) => {
              const weight = (sa.weightPercent ?? 0) / 100;
              const orderValue = Math.floor(weight * sipConfig.sipAmount);
              return {
                stockId: sa.mutualFundId,
                ticker: sa.ticker ?? "",
                stockName: sa.stockName ?? "",
                stockType: sa.StockType ?? "Equity",
                capType: sa.CapType ?? "others",
                weight: weight || 1,
                price: 0,
                minimumamount: sa.minInitialInvestment ?? 0,
                quantity: 0,
                systemQty: 0,
                orderValue,
                balanceQty: 0,
                stock: 0,
                scheme: sa.ticker ?? "",
                type: "purchase" as const,
                transactionType: 1,
                portfolioType: 2,
                portfolioId,
              };
            });
          } else if (sipConfig.portfolioId) {
            const buyOrderRes = await getBuyOrderMfForPortfolio(
              selectedClient.userId,
              sipConfig.portfolioId,
              sipConfig.sipAmount
            );
            const rawArray = Array.isArray(buyOrderRes.data)
              ? buyOrderRes.data
              : buyOrderRes.data?.orders;
            const rawOrders = buyOrderRes.orders ?? rawArray ?? [];
            const displayFund = sipConfig.selectedFund || "";
            const displayMfId = sipConfig.selectedMfId;
            const displayScheme = sipConfig.selectedScheme;
            const primaryRaw = rawOrders[0] as unknown as Record<string, unknown> | undefined;
            const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));
            const toStr = (v: unknown) => (typeof v === 'string' ? v : String(v ?? ''));
            const backendPrimaryId = primaryRaw ? toNum(primaryRaw.stockId) : 0;
            const backendPrimaryName = primaryRaw ? toStr(primaryRaw.stockName) : "";
            const primaryMismatch =
              primaryRaw != null &&
              displayMfId != null &&
              backendPrimaryId !== displayMfId &&
              displayFund.length > 0 &&
              !backendPrimaryName.toUpperCase().includes(displayFund.toUpperCase().split(" ")[0] || "");

            if (primaryMismatch && displayMfId != null) {
              orders = [{
                stockId: displayMfId,
                ticker: displayScheme ?? "",
                stockName: displayFund,
                stockType: toStr(primaryRaw!.stockType) || 'Equity',
                capType: toStr(primaryRaw!.capType) || 'others',
                weight: 1,
                price: toNum(primaryRaw!.price),
                minimumamount: toNum(primaryRaw!.minimumamount),
                quantity: toNum(primaryRaw!.quantity),
                systemQty: toNum(primaryRaw!.systemQty),
                orderValue: Number(sipConfig.sipAmount.toFixed(2)),
                stock: toNum(primaryRaw!.stock),
                scheme: displayScheme ?? "",
                type: "purchase" as const,
                transactionType: 1,
                portfolioType: 2,
                portfolioId,
              }];
            } else {
              orders = rawOrders.map((order) => {
                const raw = order as unknown as Record<string, unknown>;
                return {
                  stockId: toNum(raw.stockId) || sipConfig.selectedMfId || 0,
                  ticker: toStr(raw.ticker) || toStr(raw.isin) || sipConfig.selectedScheme || '',
                  stockName: toStr(raw.stockName) || sipConfig.selectedFund || '',
                  stockType: toStr(raw.stockType) || 'Equity',
                  capType: toStr(raw.capType) || 'others',
                  weight: toNum(raw.weight) || 1,
                  price: toNum(raw.price),
                  minimumamount: toNum(raw.minimumamount),
                  quantity: toNum(raw.quantity),
                  systemQty: toNum(raw.systemQty),
                  orderValue: toNum(raw.orderValue),
                  stock: toNum(raw.stock),
                  scheme: toStr(raw.scheme) || toStr(raw.ticker) || sipConfig.selectedScheme || '',
                  type: "purchase" as const,
                  transactionType: 1,
                  portfolioType: 2,
                  portfolioId,
                };
              });
            }
          } else {
            orders = [{
              stockId: sipConfig.selectedMfId ?? 0,
              ticker: sipConfig.selectedScheme ?? "",
              stockName: sipConfig.selectedFund,
              stockType: "Custom",
              capType: "others",
              weight: 1,
              price: 0,
              minimumamount: 0,
              quantity: 0,
              systemQty: 0,
              orderValue: Number(sipConfig.sipAmount.toFixed(2)),
              stock: 0,
              scheme: sipConfig.selectedScheme ?? "",
              type: "purchase" as const,
              transactionType: 1,
              portfolioType: 2,
              portfolioId,
            }];
          }

          const userIp = "127.0.0.1";
          const completeRes = await completeLumpsumForUser(currentLumpsumId, {
            user_ip: userIp,
            payment_postback_url: "https://fydaa.com",
            payment_method: paymentMethod,
            userId: selectedClient.userId,
            orders,
          });

          if (completeRes.paymentUrl) {
            if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
              paymentWindowRef.current.location.href = completeRes.paymentUrl;
            } else {
              setSubmissionError("Unable to open the payment window. Please allow pop-ups and try again.");
            }
          } else {
            setInvestmentComplete(true);
            setReadiness((r) => ({ ...r, consentOtp: "ok" }));
            setTimeout(() => router.push("/arn-orders"), 1500);
          }

          if (completeRes.paymentId) {
            setIsPollingPayment(true);
            const maxAttempts = 40;
            let attempts = 0;
            const pollInterval = 3000;

            while (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, pollInterval));
              attempts++;

              try {
                const capture = await captureLumpsumPayment(completeRes.paymentId, selectedClient.userId);
                const status = (capture as Record<string, unknown>).status as string | undefined;

                if (status === "SUCCESS") {
                  setInvestmentComplete(true);
                  paymentWindowRef.current?.close();
                  setTimeout(() => router.push("/arn-orders"), 1500);
                  break;
                }
              } catch {
                // Continue polling on transient errors
              }
            }

            if (!investmentComplete) {
              setPaymentError("Payment verification timed out. Please check your orders.");
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Investment failed. Please try again.";
          setSubmissionError(message);
          setReadiness((r) => ({ ...r, consentOtp: "fail" }));
          if (investmentMode === "lumpsum") {
            paymentWindowRef.current?.close();
            paymentWindowRef.current = null;
          }
        } finally {
          setIsSubmitting(false);
          setIsPollingPayment(false);
        }
        return;
      }

      // 5. Activate SIP with per-SIP mandate flow
      if (readiness.consentOtp === "ok" && readiness.mandate === "fail") {
        setIsSubmitting(true);
        try {
          const updateRes = await updateMfiaForUser(selectedClient.userId);
          if (!updateRes || !updateRes.id) {
            throw new Error("Failed to update MF investment account");
          }

          const payload: SipSetupPayload = {
            goalId: product.goalId,
            sipAmount: sipConfig.sipAmount.toFixed(2),
            sipName: product.name,
            goalAmount: projectedCorpus.toFixed(2),
            autoRenewDate: dateConfig.autoRenewDate,
            startDate: dateConfig.startDate,
            endDate: dateConfig.endDate,
            status: "INACTIVE",
            sipTenure: String(sipConfig.tenure * 12),
            sipFrequency: dateConfig.sipFrequency,
            ...(dateConfig.sipFrequency === "monthly" && { sipDate: dateConfig.startDate }),
            ...(sipConfig.selectedScheme && { selectedScheme: sipConfig.selectedScheme }),
            ...(sipConfig.selectedMfId && { selectedMfId: sipConfig.selectedMfId }),
          };

          // Step A: Create the SIP first so we have a sipId
          let currentSipId: number;
          try {
            const res = await createSipSetupForUser(selectedClient.userId, payload);
            currentSipId = res.sipData.id;
          } catch (err: unknown) {
            const error = err as { status?: number; sipId?: number; sipData?: { id: number } };
            if (error.status === 409 && (error.sipId || error.sipData?.id)) {
              currentSipId = error.sipId ?? error.sipData!.id;
            } else {
              throw err;
            }
          }

          // Step B: Check if THIS SIP already has an approved mandate
          const existingMandate = await getMandateForSip(currentSipId, selectedClient.userId);
          if (existingMandate.isApproved) {
            setReadiness((r) => ({ ...r, mandate: "ok" }));
          } else {
            // Step C: Create + authorize mandate for this SIP
            const response: SetupMandateResponse = await setupMandateForUser(
              selectedClient.userId,
              "UPI",
              sipConfig.sipAmount,
              currentSipId
            );

            if (response.alreadyAuthorized) {
              setReadiness((r) => ({ ...r, mandate: "ok" }));
            } else if (response.authorizationUrl) {
              setIsPollingMandate(true);
              paymentWindowRef.current = window.open(response.authorizationUrl, "_blank");

              const maxAttempts = 40;
              let attempts = 0;
              let approved = false;
              const pollInterval = 3000;

              while (attempts < maxAttempts && !approved) {
                await new Promise((resolve) => setTimeout(resolve, pollInterval));
                attempts++;

                try {
                  const sipMandate = await getMandateForSip(currentSipId, selectedClient.userId);
                  if (sipMandate.isApproved) {
                    approved = true;
                    const paymentWindow = paymentWindowRef.current;
                    if (paymentWindow && !paymentWindow.closed) {
                      paymentWindow.close();
                    }
                    paymentWindowRef.current = null;
                    setReadiness((r) => ({ ...r, mandate: "ok" }));
                  }
                } catch {
                  // Continue polling on transient errors
                }
              }

              if (!approved) {
                throw new Error("UPI mandate authorization was not completed in time. Please try again.");
              }
            } else {
              throw new Error("Mandate authorization URL not received. Please try again.");
            }
          }

          // Step D: First debit using this SIP's mandate
          const buyOrderRes = await getBuyOrderMfForUser(selectedClient.userId, currentSipId, sipConfig.sipAmount);
          const rawArray = Array.isArray(buyOrderRes.data)
            ? buyOrderRes.data
            : buyOrderRes.data?.orders;
          const orders = buyOrderRes.orders ?? rawArray ?? [];
          const sanitizedOrders = orders.map((order) => ({
            isin: order.isin ?? '',
            quantity: "1",
            price: String(order.price ?? "0"),
            orderValue: String(order.orderValue ?? "0"),
          }));

          const userIp = "127.0.0.1";

          const debitResult = await completeWithMandateFirstDebitForUser(
            selectedClient.userId,
            currentSipId,
            sanitizedOrders,
            userIp
          );

          const hasSuccess = debitResult.results?.some((r) => r.success);

          if (hasSuccess) {
            setSipActivated(true);
            getMySipMfForUser(selectedClient.userId).catch(() => {});
            setTimeout(() => {
              router.push("/arn-orders");
            }, 1500);
          } else {
            const errorMsg = debitResult.results?.[0]?.error || "SIP activation failed. Please try again.";
            setSubmissionError(errorMsg);
            setOtpSent(false);
            setReadiness((r) => ({ ...r, consentOtp: "fail", mandate: "fail" }));
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to activate SIP. Please try again.";
          setMandateError(message);
          setSubmissionError(message);
          setReadiness((r) => ({ ...r, mandate: "fail" }));
        } finally {
          setIsPollingMandate(false);
          setIsSubmitting(false);
        }
        return;
      }
    }, [
      readiness,
      otpSent,
      otpInput,
      sipConfig,
      dateConfig,
      projectedCorpus,
      product,
      selectedClient,
      router,
      paymentMethod,
      investmentMode,
      investmentComplete,
    ]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--arn-txt)] sm:text-2xl">
              Review & <span className="text-[var(--arn-amber)]">confirm</span>
            </h2>
            <p className="mt-1 text-sm text-[var(--arn-txt-2)] sm:text-base">
              Verify the details below before submitting.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 text-xs font-semibold text-[var(--arn-amber)] transition-opacity hover:opacity-70"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* LEFT: Details */}
          <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--arn-txt-3)]">
              {investmentMode === "lumpsum" ? "Lumpsum details" : "SIP details"}
            </div>
            <div className="mt-4 space-y-3">
              <ConfirmRow label="Client" value={selectedClient.name} />
              <ConfirmRow label="Goal" value={goalName} />
              {investmentMode === "lumpsum" ? (
                <>
                  <ConfirmRow label="Amount" value={formatRupee(sipConfig.sipAmount)} />
                  <ConfirmRow label="Fund" value={sipConfig.selectedFund.split(" —")[0] || sipConfig.selectedFund} />
                </>
              ) : (
                <>
                  <ConfirmRow
                    label={sipConfig.frequency === "daily" ? "Daily SIP" : "Monthly SIP"}
                    value={`${formatRupee(sipConfig.sipAmount)}${sipInstallmentLabel}`}
                  />
                  <ConfirmRow
                    label="Tenure"
                    value={`${sipConfig.tenure} years · ${sipConfig.tenure * 12} installments`}
                  />
                  <ConfirmRow
                    label="SIP date"
                    value={`${ordinal(dateConfig.sipDate)} of every month`}
                  />
                  <ConfirmRow label="Next debit" value={formatDisplayDate(dateConfig.startDate)} />
                  <ConfirmRow
                    label="Fund"
                    value={sipConfig.selectedFund.split(" —")[0] || sipConfig.selectedFund}
                  />
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Setup checklist */}
          <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--arn-txt-3)]">
              Setup checklist
            </div>
            <div className="mt-4 space-y-0">
              <StatusItem
                label="KYC"
                status={readiness.kyc}
                sub={
                  readiness.kyc === "ok"
                    ? "Verified"
                    : kycReason
                      ? kycReason
                      : "Required before activation"
                }
              />
              {investmentMode === "sip" && readiness.mandate === "ok" && (
                <StatusItem
                  label="UPI auto-debit mandate"
                  status={readiness.mandate}
                  sub="Active"
                />
              )}
              <StatusItem
                label="Consent OTP"
                status={readiness.consentOtp}
                sub={
                  readiness.consentOtp === "ok"
                    ? "Verified"
                    : readiness.consentOtp === "fail"
                      ? investmentMode === "lumpsum"
                        ? "Required before activation"
                        : readiness.mandate === "ok"
                          ? "Required before activation"
                          : "Required before mandate setup"
                      : "Sending..."
                }
              />
              {investmentMode === "lumpsum" && (
                <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
                  <span className="text-sm text-[var(--arn-txt-2)]">Payment method</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as "UPI" | "NETBANKING")}
                    className="rounded-[8px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--arn-txt)]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="NETBANKING">Netbanking</option>
                  </select>
                </div>
              )}
              {investmentMode === "sip" && readiness.mandate !== "ok" && (
                <StatusItem
                  label="UPI auto-debit mandate"
                  status={readiness.mandate}
                  sub={
                    isPollingMandate
                      ? "Waiting for UPI authorization..."
                      : mandateError
                        ? mandateError
                        : `UPI mandate required to debit ₹${sipConfig.sipAmount.toLocaleString("en-IN")}${sipInstallmentLabel}`
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* OTP section */}
        {otpSent && readiness.consentOtp !== "ok" && (
          <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <div className="text-sm font-semibold text-[var(--arn-txt)]">
              Enter the 6-digit OTP sent to the client
            </div>
            <div className="mt-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder=""
                className="h-12 w-32 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] text-center text-lg font-bold tracking-widest text-[var(--arn-txt)] outline-none transition-colors focus:border-[var(--arn-amber)]"
              />
            </div>
             {submissionError && (
               <div className="mt-2 text-xs text-red-500">{submissionError}</div>
             )}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[var(--arn-txt-3)]">
                  Didn&apos;t receive it?
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || isSubmitting}
                  className="text-xs font-semibold text-[var(--arn-amber)] transition-opacity hover:opacity-70 disabled:opacity-40"
                >
                  {canResend ? "Resend OTP" : `Resend in ${resendSeconds}s`}
                </button>
              </div>
           </div>
         )}

         {/* Mandate polling indicator */}
         {isPollingMandate && investmentMode === "sip" && (
           <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
             <div className="flex items-center gap-3">
               <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--arn-amber)] border-t-transparent" />
               <div>
                 <div className="text-sm font-semibold text-[var(--arn-txt)]">
                   Waiting for UPI authorization...
                 </div>
                 <div className="text-xs text-[var(--arn-txt-3)]">
                   Complete the approval in your UPI app. Do not close this page.
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Payment polling indicator (lumpsum) */}
         {isPollingPayment && investmentMode === "lumpsum" && (
           <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
             <div className="flex items-center gap-3">
               <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--arn-amber)] border-t-transparent" />
               <div>
                 <div className="text-sm font-semibold text-[var(--arn-txt)]">
                   Waiting for payment confirmation...
                 </div>
                 <div className="text-xs text-[var(--arn-txt-3)]">
                   Complete the payment in the open tab. Do not close this page.
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Mandate error / retry */}
         {mandateError && !isPollingMandate && investmentMode === "sip" && (
           <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
             <div className="font-semibold">Mandate setup failed</div>
             <div className="mt-1">{mandateError}</div>
             <button
               type="button"
               onClick={handleCta}
               disabled={isSubmitting}
                className="mt-3 rounded-[12px] bg-[var(--arn-amber)] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[var(--arn-amber-hover)] disabled:opacity-40"
             >
               Retry mandate setup
             </button>
           </div>
         )}

          {investmentComplete && investmentMode === "lumpsum" && (
            <div className="rounded-[12px] border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              Investment submitted successfully. Lumpsum ID: {lumpsumId}. Redirecting to orders...
            </div>
          )}

         {paymentError && investmentMode === "lumpsum" && (
           <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
             {paymentError}
           </div>
         )}

         {submissionError && !otpSent && !mandateError && investmentMode === "sip" && (
           <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
             {submissionError}
           </div>
         )}

         {submissionError && !otpSent && investmentMode === "lumpsum" && (
           <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
             {submissionError}
           </div>
         )}

         {sipActivated && investmentMode === "sip" && (
           <div className="rounded-[12px] border border-green-200 bg-green-50 p-4 text-sm text-green-700">
             SIP activated successfully. Redirecting to orders...
           </div>
         )}
      </div>
    );
  }
);

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-[var(--arn-txt-2)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--arn-txt)] text-right">{value}</span>
    </div>
  );
}

function StatusItem({
  label,
  status,
  sub,
}: {
  label: string;
  status: ReadinessStatus;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#F5F5F5] pb-3 first:border-0 first:pt-0 last:border-0 last:pb-0">
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          status === "ok" && "bg-green-100 text-green-600",
          status === "fail" && "bg-red-100 text-red-600",
          status === "loading" && "bg-gray-100 text-gray-400"
        )}
      >
        {status === "ok" ? "✓" : status === "fail" ? "✕" : "..."}
      </div>
      <div className="flex-1">
        <div
          className={cn(
            "text-sm font-bold",
            status === "ok" && "text-green-600",
            status === "fail" && "text-[var(--arn-txt)]"
          )}
        >
          {label}
        </div>
        <div className="text-xs text-[var(--arn-txt-3)]">{sub}</div>
      </div>
    </div>
  );
}

function formatRupee(n: number): string {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(1) + "Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + "L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(0) + "K";
  return "₹" + n.toLocaleString("en-IN");
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default ArnReviewConfirmPage;
