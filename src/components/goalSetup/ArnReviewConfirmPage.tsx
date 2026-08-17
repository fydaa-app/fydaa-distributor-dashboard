"use client";

import { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { type GoalSetupClient } from "@/services/arnGoalSetupService";
import { type DirectProduct } from "@/components/goalSetup/ArnDirectProductSelector";
import type { ArnSetSipPageRef } from "@/components/goalSetup/ArnSetSipPage";
import type { ArnSetSipDatePageRef } from "@/components/goalSetup/ArnSetSipDatePage";
import { calculateProjectedCorpus } from "@/lib/sipMath";
import {
  getUserStage,
  checkKycForUser,
  sendConsentOtpForUser,
  verifyConsentOtpForUser,
  createSipSetupForUser,
  getBuyOrderMfForUser,
  completeWithMandateFirstDebitForUser,
  setupMandateForUser,
  getMandateForUser,
  updateMfiaForUser,
  type UserStageResponse,
  type KycCheckResponse,
  type SipSetupPayload,
  type SetupMandateResponse,
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
  onBack: () => void;
  onCtaChange?: (state: { label: string; disabled: boolean }) => void;
}

type ReadinessStatus = "ok" | "fail" | "loading";

interface ReadinessState {
  kyc: ReadinessStatus;
  consentOtp: ReadinessStatus;
  mandate: ReadinessStatus;
}

const INITIAL_READINESS: ReadinessState = {
  kyc: "loading",
  consentOtp: "fail",
  mandate: "fail",
};

const ArnReviewConfirmPage = forwardRef<ArnReviewConfirmPageRef, ArnReviewConfirmPageProps>(
  function ArnReviewConfirmPage(
    { selectedClient, selectedProduct, selectedGoal, sipConfig, dateConfig, onBack, onCtaChange },
    ref
  ) {
    const router = useRouter();
    const [readiness, setReadiness] = useState<ReadinessState>(INITIAL_READINESS);
    const [otpSent, setOtpSent] = useState(false);
    const [otpInput, setOtpInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [userStage, setUserStage] = useState<UserStageResponse | null>(null);
    const [kycReason, setKycReason] = useState<string | null>(null);
    const [isPollingMandate, setIsPollingMandate] = useState(false);
    const [mandateError, setMandateError] = useState<string | null>(null);

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

    const mandateAmount = userStage?.mandateAmount ?? 0;
    const sipInstallmentLabel = sipConfig.frequency === "daily" ? "/day" : "/mo";

    const ctaState = useMemo(() => {
      if (readiness.kyc === "fail") return { label: "Complete KYC", disabled: false };
      if (isPollingMandate) return { label: "Waiting for mandate...", disabled: true };
      if (readiness.consentOtp === "fail") return { label: "Send consent OTP", disabled: false };
      if (otpSent && readiness.consentOtp !== "ok")
        return { label: "Verify OTP", disabled: otpInput.length < 6 };
      if (readiness.mandate === "fail") return { label: "Set up UPI mandate", disabled: false };
      return { label: "Activate SIP", disabled: false };
    }, [readiness, otpSent, otpInput, isPollingMandate]);

    useEffect(() => {
      onCtaChange?.(ctaState);
    }, [ctaState, onCtaChange]);

    useEffect(() => {
      let cancelled = false;
      setReadiness((r) => ({ ...r, kyc: "loading", mandate: "fail" }));

      getUserStage(selectedClient.userId, product.goalId)
        .then((data) => {
          if (!cancelled) {
            setUserStage(data);
            const mandateOk = data.isMfMandate && data.mandateAmount >= sipConfig.sipAmount;
            setReadiness((r) => ({
              ...r,
              mandate: mandateOk ? "ok" : "fail",
            }));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setReadiness((r) => ({ ...r, mandate: "fail" }));
          }
        });

      return () => {
        cancelled = true;
      };
    }, [selectedClient.userId, product.goalId, sipConfig.sipAmount]);

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

    useImperativeHandle(ref, () => ({
      getPayload: () => ({
        goalId: product.goalId,
        sipAmount: sipConfig.sipAmount.toFixed(2),
        sipName: product.name,
        goalAmount: projectedCorpus.toFixed(2),
        autoRenewDate: dateConfig.autoRenewDate,
        startDate: dateConfig.startDate,
        endDate: dateConfig.endDate,
        status: "INACTIVE" as const,
        sipTenure: String(sipConfig.tenure * 12),
        sipFrequency: dateConfig.sipFrequency,
        ...(dateConfig.sipFrequency === "monthly" && { sipDate: dateConfig.startDate }),
        ...(sipConfig.selectedScheme && { selectedScheme: sipConfig.selectedScheme }),
        ...(sipConfig.selectedMfId && { selectedMfId: sipConfig.selectedMfId }),
      }),
      handleCta: () => handleCta(),
    }));

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

          // Re-fetch mandate status after OTP verified (per MD sequence)
          const stage = await getUserStage(selectedClient.userId, product.goalId);
          setUserStage(stage);
          const mandateOk = stage.isMfMandate && stage.mandateAmount >= sipConfig.sipAmount;
          setReadiness((r) => ({ ...r, mandate: mandateOk ? "ok" : "fail" }));
        } catch (err) {
          setSubmissionError(err instanceof Error ? err.message : "Invalid OTP");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // 4. Mandate setup (after OTP verified, only if mandate needed)
      if (readiness.consentOtp === "ok" && readiness.mandate === "fail") {
        setIsSubmitting(true);
        try {
          const response: SetupMandateResponse = await setupMandateForUser(
            selectedClient.userId,
            "UPI",
            sipConfig.sipAmount,
            //typeof window !== "undefined" ? `${window.location.origin}/arn-orders` : undefined
            typeof window !== "undefined" ? `https://partner.fydaa.com/arn-orders` : undefined
          );
          setIsPollingMandate(true);

          // Open authorization URL in new tab
          if (response.authorizationUrl) {
            window.open(response.authorizationUrl, "_blank");
          }

          // Poll for mandate approval
          const maxAttempts = 40;
          let attempts = 0;
          let approved = false;
          const pollInterval = 3000;

          while (attempts < maxAttempts && !approved) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            attempts++;

            try {
              const mandate = await getMandateForUser(response.mandateId, selectedClient.userId);
              const status = mandate.mandate_status || mandate.status || "";

              if (status === "APPROVED") {
                approved = true;
                const stage = await getUserStage(selectedClient.userId, product.goalId);
                setUserStage(stage);
                const mandateOk = stage.isMfMandate && stage.mandateAmount >= sipConfig.sipAmount;
                setReadiness((r) => ({ ...r, mandate: mandateOk ? "ok" : "fail" }));
                break;
              } else               if (status === "REJECTED" || status === "CANCELLED") {
                const reason = typeof mandate.rejected_reason === "string" ? mandate.rejected_reason : undefined;
                throw new Error(reason || "Mandate was rejected or cancelled");
              }
            } catch (pollErr) {
              if (
                pollErr instanceof Error &&
                (pollErr.message.includes("rejected") || pollErr.message.includes("cancelled"))
              ) {
                throw pollErr;
              }
            }
          }

          if (!approved) {
            throw new Error("UPI mandate authorization was not completed in time. Please try again.");
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to set up UPI mandate. Please try again.";
          setMandateError(message);
          setSubmissionError(message);
          setReadiness((r) => ({ ...r, mandate: "fail" }));
        } finally {
          setIsPollingMandate(false);
          setIsSubmitting(false);
        }
        return;
      }

      // 5. Activate SIP
      if (readiness.kyc === "ok" && readiness.consentOtp === "ok" && readiness.mandate === "ok") {
        setIsSubmitting(true);
        try {
          const updateRes = await updateMfiaForUser(selectedClient.userId);
          if (!updateRes || !updateRes.id) {
            throw new Error(updateRes?.message || "Failed to update MF investment account");
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

          const buyOrderRes = await getBuyOrderMfForUser(selectedClient.userId, currentSipId, sipConfig.sipAmount);
          const orders = buyOrderRes.orders ?? buyOrderRes.data?.orders ?? [];
          const sanitizedOrders = orders.map((order) => ({
            isin: order.isin,
            quantity: "1",
            price: String(order.price ?? "0"),
            orderValue: String(order.orderValue ?? "0"),
          }));

          const userIp = "127.0.0.1";

          await completeWithMandateFirstDebitForUser(selectedClient.userId, currentSipId, sanitizedOrders, userIp);

          setReadiness((r) => ({ ...r, mandate: "ok" }));
          setTimeout(() => {
            router.push("/arn-orders");
          }, 1500);
        } catch (err) {
          setSubmissionError(err instanceof Error ? err.message : "Activation failed. Please try again.");
          setReadiness((r) => ({ ...r, mandate: "fail" }));
        } finally {
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
    ]);

    const freqLabel = sipConfig.frequency === "daily" ? "/day" : "/mo";

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
          {/* LEFT: SIP details */}
          <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--arn-txt-3)]">
              SIP details
            </div>
            <div className="mt-4 space-y-3">
              <ConfirmRow label="Client" value={selectedClient.name} />
              <ConfirmRow label="Goal" value={goalName} />
              <ConfirmRow
                label="Monthly SIP"
                value={`${formatRupee(sipConfig.sipAmount)}${freqLabel}`}
              />
              <ConfirmRow
                label="Tenure"
                value={`${sipConfig.tenure} years · ${sipConfig.tenure * 12} installments`}
              />
              <ConfirmRow
                label="SIP date"
                value={`${dateConfig.sipDate}${ordinal(dateConfig.sipDate)} of every month`}
              />
              <ConfirmRow label="Next debit" value={formatDisplayDate(dateConfig.startDate)} />
              <ConfirmRow
                label="Fund"
                value={sipConfig.selectedFund.split(" —")[0] || sipConfig.selectedFund}
              />
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
              <StatusItem
                label="Consent OTP"
                status={readiness.consentOtp}
                sub={
                  readiness.consentOtp === "ok"
                    ? "Verified"
                    : readiness.consentOtp === "fail"
                      ? "Required before mandate setup"
                      : "Sending..."
                }
              />
              <StatusItem
                label="UPI auto-debit mandate"
                status={readiness.mandate}
                sub={
                  readiness.mandate === "ok"
                    ? "Active"
                    : isPollingMandate
                      ? "Waiting for UPI authorization..."
                      : mandateError
                        ? mandateError
                        : `Current limit ₹${mandateAmount.toLocaleString("en-IN")} — SIP needs ₹${sipConfig.sipAmount.toLocaleString("en-IN")}${sipInstallmentLabel}`
                }
              />
            </div>
          </div>
        </div>

        {/* OTP section */}
        {otpSent && readiness.consentOtp !== "ok" && (
          <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <div className="text-sm font-semibold text-[var(--arn-txt)]">
              Enter the 6-digit OTP sent to the client
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="h-12 w-32 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-surf)] text-center text-lg font-bold tracking-widest text-[var(--arn-txt)] outline-none transition-colors focus:border-[var(--arn-amber)]"
              />
              <button
                type="button"
                onClick={handleCta}
                disabled={otpInput.length < 6 || isSubmitting}
                className="h-12 rounded-[12px] bg-[var(--arn-amber)] px-6 text-sm font-bold text-white transition-all hover:bg-[var(--arn-amber-h)] disabled:opacity-40 disabled:pointer-events-none"
              >
                Verify
              </button>
            </div>
            {submissionError && (
              <div className="mt-2 text-xs text-red-500">{submissionError}</div>
            )}
          </div>
        )}

        {/* Mandate polling indicator */}
        {isPollingMandate && (
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

        {/* Mandate error / retry */}
        {mandateError && !isPollingMandate && (
          <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <div className="font-semibold">Mandate setup failed</div>
            <div className="mt-1">{mandateError}</div>
            <button
              type="button"
              onClick={handleCta}
              disabled={isSubmitting}
              className="mt-3 rounded-[12px] bg-[var(--arn-amber)] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[var(--arn-amber-h)] disabled:opacity-40"
            >
              Retry mandate setup
            </button>
          </div>
        )}

        {submissionError && !otpSent && !mandateError && (
          <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {submissionError}
          </div>
        )}

        {readiness.mandate === "ok" && (
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
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default ArnReviewConfirmPage;
