"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpEntryForm } from "@/components/onboard/shared";
import { verifyArnOtp, requestArnOtp } from "@/services/arnOnboardService";
import { setCookie } from "cookies-next";

export default function FinancialPlanOtpPage() {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMobile = sessionStorage.getItem("financial_plan_mobile");
      if (savedMobile) {
        setMobile(savedMobile);
        setResendTimer(30);
      } else {
        router.push("/financial-plan/mobile");
      }
    }
  }, [router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((t) => (t <= 1 ? (clearInterval(timer), 0) : t - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const handleVerify = async (mobileNum: string, otp: string) => {
    setError(null);

    try {
      const result = await verifyArnOtp({
        mobileNumber: mobileNum.replace(/\D/g, ""),
        otp,
      });

      const userData = (result.data || {}) as Record<string, unknown>;
      if (userData.accessToken && typeof userData.accessToken === "string") {
        setCookie("onboardedUserToken", userData.accessToken, { path: "/" });
      }
      if (userData.refreshToken && typeof userData.refreshToken === "string") {
        setCookie("onboardedUserRefreshToken", userData.refreshToken, { path: "/" });
      }
      setCookie("onboardedUserData", JSON.stringify(userData), { path: "/" });

      sessionStorage.removeItem("financial_plan_mobile");
      router.push("/financial-plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed. Please try again.");
    }
  };

  const handleResend = async (mobileNum: string) => {
    if (resending) return;

    setResending(true);
    setResendTimer(30);

    try {
      const digits = mobileNum.replace(/\D/g, "");
      await requestArnOtp({
        callingCode: "+91",
        mobileNumber: digits,
        referredBy: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    router.push("/financial-plan/mobile");
  };

  return (
    <div className="min-h-screen bg-[var(--arn-bg-3)] flex items-center justify-center pt-10 pb-10">
      <div className="w-full max-w-[560px] px-4 sm:px-0">
        <OtpEntryForm
          mobile={mobile}
          onVerify={handleVerify}
          onResend={handleResend}
          onBack={handleBack}
          resending={resending}
          error={error}
          resendTimer={resendTimer}
        />
      </div>
    </div>
  );
}