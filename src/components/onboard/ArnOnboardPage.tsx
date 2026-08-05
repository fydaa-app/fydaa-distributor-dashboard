"use client";

import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ArnOnboardForm from "./ArnOnboardForm";
import type { RiskProfileQuestion, UserStage } from "@/services/arnOnboardService";

type Phase = "mobile" | "otp" | "risk" | "riskScore" | "email" | "emailOtp" | "kyc" | "kycCompliant" | "identity" | "bank" | "nominee" | "welcome";

export default function ArnOnboardPage() {
  const [phase, setPhase] = useState<Phase>("mobile");
  const [mobile, setMobile] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [onboardedToken, setOnboardedToken] = useState("");
  const [riskQuestions, setRiskQuestions] = useState<RiskProfileQuestion[]>([]);
  const [riskAnswers, setRiskAnswers] = useState<Record<number, number>>({});
  const [riskIndex, setRiskIndex] = useState(0);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [isSubmittingRisk, setIsSubmittingRisk] = useState(false);
  const [riskScoreData, setRiskScoreData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);

  const router = useRouter();
  const [skipStage, setSkipStage] = useState<UserStage | null>(null);

  const rawUserData = getCookie("userData");
  const userData = rawUserData ? JSON.parse(rawUserData as string) : {};
  const rawEmployeeData = getCookie("employeeData");
  const employeeData = rawEmployeeData ? JSON.parse(rawEmployeeData as string) : {};
  const referredBy = employeeData?.referralCode || userData?.code || "";

  const goToOtp = () => setPhase("otp");
  const goToMobile = () => setPhase("mobile");
  const goToDashboard = () => router.push("/");

  const goToKyc = () => {
    setKycError(null);
    setPhase("kyc");
  };

  const goToRiskScore = () => setPhase("riskScore");

  const goToIdentity = () => setPhase("identity");
  const goToKycCompliant = () => setPhase("kycCompliant");

  const goToEmail = () => setPhase("email");
  const goToEmailOtp = () => setPhase("emailOtp");
  const goToBank = () => setPhase("bank");
  const goToNominee = () => setPhase("nominee");
  const goToWelcome = () => setPhase("welcome");

  const loadRiskScore = async (token: string) => {
    setIsLoadingScore(true);
    setScoreError(null);
    try {
      const indicators = await import("@/services/arnOnboardService").then((m) =>
        m.getRiskIndicators(token)
      );
      setRiskScoreData(indicators);
      setPhase("riskScore");
    } catch (err) {
      setScoreError(
        err instanceof Error ? err.message : "Failed to load risk indicators."
      );
      setPhase("riskScore");
    } finally {
      setIsLoadingScore(false);
    }
  };

  const handleOtpVerified = (token: string) => {
    setOnboardedToken(token);
    setRiskError(null);
    setScoreError(null);
    setIsLoadingRisk(true);
    setPhase("risk");

    import("@/services/arnOnboardService")
      .then(({ getUserStage }) => getUserStage(token))
      .then((stage) => {
        if (
          stage.isRiskProfileComplete &&
          stage.isEmail &&
          stage.isKycCompliant &&
          stage.isBank &&
          stage.isNominee
        ) {
          setSkipStage(stage);
          setPhase("welcome");
          return;
        }
        if (
          stage.isRiskProfileComplete &&
          stage.isEmail &&
          stage.isKycCompliant &&
          stage.isBank
        ) {
          setPhase("nominee");
          return;
        }
        if (stage.isRiskProfileComplete && stage.isEmail && stage.isKycCompliant) {
          setPhase("kycCompliant");
          return;
        }
        if (stage.isRiskProfileComplete && stage.isEmail) {
          setPhase("kyc");
          return;
        }
        if (stage.isRiskProfileComplete) {
          return loadRiskScore(token);
        }
        return import("@/services/arnOnboardService")
          .then(({ getRiskProfileQuestionnaire }) =>
            getRiskProfileQuestionnaire(token)
          )
          .then((questions) => {
            setRiskQuestions(questions);
            setRiskIndex(0);
            setRiskAnswers({});
          });
      })
      .catch((err) => {
        setRiskError(
          err instanceof Error
            ? err.message
            : "Failed to load risk profile. Please try again."
        );
      })
      .finally(() => setIsLoadingRisk(false));
  };

  const handleRiskAnswerChange = (questionId: number, optionIndex: number) => {
    setRiskAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleRiskIndexChange = (index: number) => {
    setRiskIndex(index);
    setRiskError(null);
  };

  const handleSubmitRisk = async () => {
    const options = riskQuestions.map((q) => ({
      answerId: (riskAnswers[q.id] ?? 0) + 1,
      questionId: q.id,
      secondaryQuestionId: q.secondaryQuestionId,
    }));

    setIsSubmittingRisk(true);
    setRiskError(null);

    try {
      await import("@/services/arnOnboardService").then((m) =>
        m.createUserRiskProfile(options, onboardedToken)
      );
      await loadRiskScore(onboardedToken);
    } catch (err) {
      setRiskError(
        err instanceof Error ? err.message : "Failed to submit risk profile."
      );
    } finally {
      setIsSubmittingRisk(false);
    }
  };

  return (
    <div className="flex items-center justify-center pt-10 pb-10">
      <div className="w-full max-w-[560px]">
        <ArnOnboardForm
          phase={phase}
          mobile={mobile}
          onMobileChange={setMobile}
          otpValues={otpValues}
          onOtpChange={setOtpValues}
          onGoToOtp={goToOtp}
          onGoToMobile={goToMobile}
          onReset={goToDashboard}
          onKycVerified={() => setPhase("kycCompliant")}
          onGoToIdentity={goToIdentity}
          onGoToKycCompliant={goToKycCompliant}
          onGoToEmail={goToEmail}
          onGoToEmailOtp={goToEmailOtp}
          onEmailVerified={goToKyc}
          onIdentityVerified={() => setPhase("bank")}
          onBankVerified={goToNominee}
          onGoToWelcome={goToWelcome}
          onGoToBank={goToBank}
          onGoToRiskScore={goToRiskScore}
          userStage={skipStage}
          kycError={kycError}
          referredBy={referredBy}
          onOtpVerified={handleOtpVerified}
          riskQuestions={riskQuestions}
          riskAnswers={riskAnswers}
          onRiskAnswerChange={handleRiskAnswerChange}
          riskIndex={riskIndex}
          onRiskIndexChange={handleRiskIndexChange}
          onSubmitRisk={handleSubmitRisk}
          riskError={riskError}
          isLoadingRisk={isLoadingRisk}
          isSubmittingRisk={isSubmittingRisk}
          riskScoreData={riskScoreData}
          isLoadingScore={isLoadingScore}
          scoreError={scoreError}
        />
      </div>
    </div>
  );
}
