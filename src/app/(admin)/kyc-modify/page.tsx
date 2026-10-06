"use client";

import { Suspense, useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { useRouter, useSearchParams } from "next/navigation";
import ArnLoadingState from "@/components/common/ArnLoadingState";
import ModifyKycWizard from "@/components/onboard/ModifyKycWizard";
import { isUnauthorizedError } from "@/services/arnKycService";
import { getUserStage, type UserStage } from "@/services/arnOnboardService";
import { notifyModifyCallback } from "@/utils/kycPopup";

function KycModifyCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<UserStage | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPopup = typeof window !== "undefined" && Boolean(window.opener);

  useEffect(() => {
    if (typeof window === "undefined" || !window.opener) return;
    notifyModifyCallback();
    const timer = window.setTimeout(() => {
      try {
        window.close();
      } catch {
        /* ignore */
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPopup) return;

    const token = getCookie("onboardedUserToken");
    if (!token || typeof token !== "string") {
      router.replace("/arn-onboard");
      return;
    }

    let cancelled = false;
    getUserStage(token)
      .then((next) => {
        if (cancelled) return;
        setStage(next);
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorizedError(err)) {
          router.replace("/arn-onboard");
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load KYC status. Please try again."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isPopup, router]);

  if (isPopup) {
    const proof = searchParams.get("proof");
    const esign = searchParams.get("esign");
    const status = searchParams.get("status");
    const label =
      proof != null
        ? "Completing DigiLocker..."
        : esign != null || status
          ? "Completing e-sign..."
          : "Completing KYC update...";
    return <ArnLoadingState label={label} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center pt-10 pb-10">
        <div className="w-full max-w-[560px] px-4 sm:px-0">
          <div className="step-panel">
            <p className="step-eyebrow">Identity Verification</p>
            <h2 className="step-title">Unable to resume KYC</h2>
            <p className="step-helper">{error}</p>
            <button
              type="button"
              className="btn-primary btn-wide"
              onClick={() => router.replace("/arn-onboard")}
            >
              Back to onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <ArnLoadingState label="Loading KYC update..." />;
  }

  return (
    <div className="flex items-center justify-center pt-10 pb-10">
      <div className="w-full max-w-[560px] px-4 sm:px-0">
        <ModifyKycWizard
          userStage={stage}
          onStageChange={setStage}
          onComplete={() => router.replace("/arn-onboard")}
          onCompleteLater={() => router.replace("/arn")}
          onUnauthorized={() => router.replace("/arn-onboard")}
        />
      </div>
    </div>
  );
}

export default function KycModifyPage() {
  return (
    <Suspense fallback={<ArnLoadingState label="Loading KYC update..." />}>
      <KycModifyCallbackInner />
    </Suspense>
  );
}
