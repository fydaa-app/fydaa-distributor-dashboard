"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCookie, setCookie } from "cookies-next";
import FinancialPlanForm from "./FinancialPlanForm";
import { MobileEntryForm } from "@/components/onboard/shared";
import { OtpEntryForm } from "@/components/onboard/shared";
import { submitFinancialPlan, requestArnOtp, verifyArnOtp } from "@/services/arnOnboardService";
import { FINANCIAL_PLAN_SECTIONS } from "@/types/financialPlan";

type Phase = "mobile" | "otp" | "plan";
type PlanSection = 1 | 2 | 3 | 4 | 5;

export default function FinancialPlanPage() {
  const [phase, setPhase] = useState<Phase>("mobile");
  const [mobile, setMobile] = useState("");
  const [token, setToken] = useState("");
  const [formData, setFormData] = useState<Record<number, string>>({});
  const [currentSection, setCurrentSection] = useState<PlanSection>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sectionParam = searchParams.get("section");
    if (sectionParam) {
      const section = parseInt(sectionParam, 10);
      if (section >= 1 && section <= 5) {
        setCurrentSection(section as PlanSection);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (phase === "plan") {
      const savedToken = getCookie("onboardedUserToken");
      if (savedToken) {
        setToken(savedToken as string);
      } else {
        setPhase("mobile");
      }
    }
  }, [phase]);

  const handleMobileSubmit = useCallback(async (mobileNum: string) => {
    const digits = mobileNum.replace(/\D/g, "");
    if (digits.length !== 10) return;

    try {
      await requestArnOtp({
        callingCode: "+91",
        mobileNumber: digits,
        referredBy: "",
      });
    } catch (err) {
      throw err;
    }
  }, []);

  const handleOtpVerify = useCallback(async (mobileNum: string, otp: string) => {
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

      const newToken =
        userData.accessToken && typeof userData.accessToken === "string"
          ? (userData.accessToken as string)
          : "";
      if (newToken) {
        setToken(newToken);
        setPhase("plan");
      }
    } catch (err) {
      throw err;
    }
  }, []);

  const handleOtpVerified = useCallback((newToken: string) => {
    setToken(newToken);
    setPhase("plan");
  }, []);

  const handleSectionChange = useCallback((section: PlanSection) => {
    setCurrentSection(section);
  }, []);

  const handleFormDataChange = useCallback((questionId: number, value: string) => {
    setFormData((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSubmitPlan = useCallback(async () => {
    if (!token) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const personalDetails = Object.entries(formData).map(([questionId, value]) => ({
        questionId: Number(questionId),
        value: value.trim(),
      }));

      await submitFinancialPlan(personalDetails, token);
      router.push("/financial-plan?success=true");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit financial plan");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, token, router]);

  if (phase === "mobile") {
    return (
      <MobileEntryForm
        mobile={mobile}
        onMobileChange={setMobile}
        onSubmit={handleMobileSubmit}
        referredBy=""
      />
    );
  }

  if (phase === "otp") {
    return (
      <OtpEntryForm
        mobile={mobile}
        onVerify={handleOtpVerify}
        onResend={handleMobileSubmit}
        onBack={() => setPhase("mobile")}
        onVerifyComplete={handleOtpVerified}
      />
    );
  }

  if (phase === "plan") {
    if (!token) {
      return <div className="text-center py-10">Loading...</div>;
    }

    return (
      <FinancialPlanForm
        sections={FINANCIAL_PLAN_SECTIONS}
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSubmit={handleSubmitPlan}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    );
  }

  return null;
}