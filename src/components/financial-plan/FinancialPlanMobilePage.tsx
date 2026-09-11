"use client";

import { useState } from "react";
import { MobileEntryForm } from "@/components/onboard/shared";
import { requestArnOtp } from "@/services/arnOnboardService";

export default function FinancialPlanMobilePage() {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (mobileNum: string) => {
    const digits = mobileNum.replace(/\D/g, "");
    if (digits.length !== 10) return;

    setSubmitting(true);
    setError(null);

    try {
      await requestArnOtp({
        callingCode: "+91",
        mobileNumber: digits,
        referredBy: "",
      });
      // Navigate to OTP page with mobile in sessionStorage or URL
      if (typeof window !== "undefined") {
        sessionStorage.setItem("financial_plan_mobile", digits);
        window.location.href = "/financial-plan/otp";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--arn-bg-3)] flex items-center justify-center pt-10 pb-10">
      <div className="w-full max-w-[560px] px-4 sm:px-0">
        <MobileEntryForm
          mobile={mobile}
          onMobileChange={setMobile}
          onSubmit={handleSubmit}
          error={error}
          submitting={submitting}
          referredBy=""
        />
      </div>
    </div>
  );
}