"use client";

import { getCookie, setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ArnOnboardForm from "./ArnOnboardForm";
import type { OnboardPhase } from "./onboardPhases";
import type { RiskProfileQuestion, UserStage } from "@/services/arnOnboardService";
import { isUnauthorizedError } from "@/services/arnKycService";
import {
  checkKycRequiresModify,
  isKycReadyToProceed,
  isModifyKycComplete,
  isNonCompliantInProgress,
  isPanMissingOnProfile,
  needsKycModify,
} from "@/utils/kycStage";

type Phase = OnboardPhase;

function resolveNonCompliantPhase(stage: UserStage): Phase {
  if (stage.isNonCompliantData !== true) return "nonCompliantQuestions";
  if (stage.isDigiLocker !== true) return "digilocker";
  if (stage.isNSDL !== true) return "signature";
  if (stage.isBank && stage.isNominee) return "welcome";
  if (stage.isBank) return "nominee";
  return "bank";
}

/**
 * Resume onboard phase from getUserStage.
 * Priority: modify → expired → risk → email → PAN → compliant questions →
 * compliant bank/nominee → non-compliant resume → fresh non-compliant.
 */
function resolvePhaseFromStage(stage: UserStage): Phase {
  if (stage.ismodify === true) {
    if (
      stage.ismodifydigilocker === true &&
      stage.ismodifyquestions === true &&
      stage.ismodifyesign === true &&
      stage.ismodifynsdl === true &&
      stage.isKycCompliant === true
    ) {
      if (stage.isBank && stage.isNominee) return "welcome";
      if (stage.isBank) return "nominee";
      return "bank";
    }
    return "modifyKyc";
  }

  if (stage.isKycExpired === true) return "kyc";
  if (stage.isRiskProfileComplete !== true) return "risk";
  if (stage.isEmail !== true) return "email";
  if (stage.isPan !== true || stage.isDob !== true) return "kyc";

  // Leftover isKycCompliant / kycExtraData must not skip DigiLocker/NSDL.
  if (isNonCompliantInProgress(stage)) {
    return resolveNonCompliantPhase(stage);
  }

  if (stage.isKycCompliant === true && stage.kycExtraData !== true) {
    return "identity";
  }

  if (stage.isKycCompliant === true || isKycReadyToProceed(stage)) {
    if (stage.isBank && stage.isNominee) return "welcome";
    if (stage.isBank) return "nominee";
    return "bank";
  }

  if (stage.isKycNonCompliant === true) {
    return resolveNonCompliantPhase(stage);
  }

  return resolveNonCompliantPhase(stage);
}

/**
 * When risk+email+PAN are done, block on incomplete modify (stage flags) or
 * check-kyc action=modify. Never call check-kyc before PAN is on the profile.
 */
async function resolvePhaseWithKycGate(
  stage: UserStage,
  token: string
): Promise<{ phase: Phase; kycMessage?: string | null }> {
  if (stage.isRiskProfileComplete !== true || stage.isEmail !== true) {
    return { phase: resolvePhaseFromStage(stage) };
  }

  if (stage.isPan !== true || stage.isDob !== true) {
    return { phase: "kyc" };
  }

  if (needsKycModify(stage)) {
    return { phase: "modifyKyc" };
  }

  if (!isModifyKycComplete(stage)) {
    try {
      const { checkKyc, createModifyKycForm, loadModifyKycDetails, getUserStage } =
        await import("@/services/arnOnboardService");
      const check = await checkKyc(token);
      const refreshed = await getUserStage(token);
      Object.assign(stage, refreshed);

      if (checkKycRequiresModify(check)) {
        if (stage.ismodify !== true) {
          const details = loadModifyKycDetails();
          if (details) {
            await createModifyKycForm(details, token);
            const afterCreate = await getUserStage(token);
            Object.assign(stage, afterCreate);
          }
        }
        return { phase: "modifyKyc" };
      }
    } catch (err) {
      if (isUnauthorizedError(err)) throw err;
      const message = err instanceof Error ? err.message : "";
      if (isPanMissingOnProfile(message)) {
        return { phase: "kyc", kycMessage: message };
      }
      // Other check-kyc failures: continue with stage-only routing
    }
  }

  return { phase: resolvePhaseFromStage(stage) };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload);
    const parsed = JSON.parse(decoded);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function extractOnboardUserId(
  data: Record<string, unknown>,
  token?: string
): string | null {
  const direct = data.userId ?? data.id ?? data.user_id;
  if (direct !== undefined && direct !== null && String(direct).trim() !== "") {
    return String(direct);
  }

  const nestedUser = data.user;
  if (typeof nestedUser === "object" && nestedUser !== null) {
    const nested = (nestedUser as Record<string, unknown>).userId
      ?? (nestedUser as Record<string, unknown>).id
      ?? (nestedUser as Record<string, unknown>).user_id;
    if (nested !== undefined && nested !== null && String(nested).trim() !== "") {
      return String(nested);
    }
  }

  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const fromJwt = payload.userId ?? payload.id ?? payload.user_id ?? payload.sub;
  if (fromJwt !== undefined && fromJwt !== null && String(fromJwt).trim() !== "") {
    return String(fromJwt);
  }

  return null;
}

function extractOnboardUserName(
  data: Record<string, unknown>,
  token?: string
): string {
  const direct = data.name ?? data.fullName ?? data.full_name ?? data.userName;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const firstName = data.firstName ?? data.first_name;
  const lastName = data.lastName ?? data.last_name;
  if (typeof firstName === "string" || typeof lastName === "string") {
    const combined = [firstName, lastName]
      .filter((part) => typeof part === "string" && part.trim())
      .join(" ")
      .trim();
    if (combined) return combined;
  }

  const nestedUser = data.user;
  if (typeof nestedUser === "object" && nestedUser !== null) {
    const nested = extractOnboardUserName(nestedUser as Record<string, unknown>);
    if (nested) return nested;
  }

  if (!token) return "";

  const payload = decodeJwtPayload(token);
  if (!payload) return "";

  const fromJwt = extractOnboardUserName(payload);
  return fromJwt;
}

export default function ArnOnboardPage() {
  const [phase, setPhase] = useState<Phase>("mobile");
  const [mobile, setMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      const sessionMobile = sessionStorage.getItem("arn_onboard_mobile");
      if (sessionMobile) {
        sessionStorage.removeItem("arn_onboard_mobile");
        return sessionMobile.replace(/\D/g, '').slice(0, 10);
      }
      const params = new URLSearchParams(window.location.search);
      return (params.get('mobile') || '').replace(/\D/g, '').slice(0, 10);
    }
    return '';
  });
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
  const [isCheckingModifyKyc, setIsCheckingModifyKyc] = useState(false);
  const [modifyKycStatusMessage, setModifyKycStatusMessage] = useState<string | null>(null);
  const [modifySheetMessage, setModifySheetMessage] = useState<string | null>(null);
  const [stageLoadError, setStageLoadError] = useState<string | null>(null);

  const router = useRouter();
  const [skipStage, setSkipStage] = useState<UserStage | null>(null);

  const rawUserData = getCookie("userData");
  const userData = rawUserData ? JSON.parse(rawUserData as string) : {};
  const rawEmployeeData = getCookie("employeeData");
  const employeeData = rawEmployeeData ? JSON.parse(rawEmployeeData as string) : {};
  const referredBy = employeeData?.referralCode || userData?.code || "";

  const goToOtp = () => setPhase("otp");
  const goToMobile = () => setPhase("mobile");
  const goToDashboard = () => {
    const raw = getCookie("onboardedUserData");
    const token = getCookie("onboardedUserToken");

    try {
      const data = raw ? JSON.parse(raw as string) : {};
      const userId = extractOnboardUserId(
        data,
        typeof token === "string" ? token : undefined
      );
      const phone =
        mobile.replace(/\D/g, "") ||
        String(data.phone ?? data.mobile ?? data.mobileNumber ?? "").replace(/\D/g, "");

      sessionStorage.setItem(
        "arn_onboard_target_user",
        JSON.stringify({
          userId: userId ?? "",
          name: extractOnboardUserName(
            data,
            typeof token === "string" ? token : undefined
          ),
          phone,
          email: String(data.email ?? ""),
          skipClientStep: true,
        })
      );
    } catch {
      sessionStorage.setItem(
        "arn_onboard_target_user",
        JSON.stringify({
          userId: "",
          name: "",
          phone: mobile.replace(/\D/g, ""),
          email: "",
          skipClientStep: true,
        })
      );
    }

    router.push("/arn-goal-setup");
  };

  const goToKyc = () => {
    setKycError(null);
    setPhase("kyc");
  };

  const goToRiskScore = () => setPhase("riskScore");

  const goToIdentity = () => setPhase("identity");
  const goToKycCompliant = () => setPhase("kycCompliant");
  const goToModifyKyc = (message?: string) => {
    setModifyKycStatusMessage(null);
    setModifySheetMessage(
      message || "Your KYC needs to be updated. Tap below to proceed."
    );
    setPhase("modifyKyc");
  };
  const goToNonCompliantQuestions = () => setPhase("nonCompliantQuestions");
  const goToDigilocker = () => setPhase("digilocker");
  const goToSignature = () => setPhase("signature");
  const goToNsdl = () => setPhase("nsdlEsign");
  const goToLogin = () => {
    setOnboardedToken("");
    setPhase("mobile");
  };

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

  const applyStageResume = async (
    stage: UserStage,
    token: string
  ): Promise<boolean> => {
    const { phase: nextPhase, kycMessage } = await resolvePhaseWithKycGate(
      stage,
      token
    );
    if (!nextPhase) return false;
    setSkipStage(stage);
    setKycError(kycMessage ?? null);
    if (nextPhase === "risk") {
      const { getRiskProfileQuestionnaire } = await import(
        "@/services/arnOnboardService"
      );
      const questions = await getRiskProfileQuestionnaire(token);
      setRiskQuestions(questions);
      setRiskIndex(0);
      setRiskAnswers({});
    }
    setPhase(nextPhase);
    return true;
  };

  const handleCheckModifyKycStatus = async () => {
    setIsCheckingModifyKyc(true);
    setModifyKycStatusMessage(null);
    try {
      const { getUserStage, checkKyc, createModifyKycForm, loadModifyKycDetails } =
        await import("@/services/arnOnboardService");
      let stage = await getUserStage(onboardedToken);
      setSkipStage(stage);

      if (stage.isPan !== true || stage.isDob !== true) {
        setPhase("kyc");
        return;
      }

      // If modify was required but form was never created, create it now
      // then enter the in-app wizard.
      if (
        !needsKycModify(stage) &&
        !isModifyKycComplete(stage) &&
        stage.ismodify !== true
      ) {
        const details = loadModifyKycDetails();
        const check = await checkKyc(onboardedToken);
        stage = await getUserStage(onboardedToken);
        setSkipStage(stage);
        if (checkKycRequiresModify(check) && details) {
          await createModifyKycForm(details, onboardedToken);
          stage = await getUserStage(onboardedToken);
          setSkipStage(stage);
        } else if (checkKycRequiresModify(check)) {
          setModifyKycStatusMessage(
            check.message ||
              "Your KYC needs to be updated. Tap below to proceed."
          );
          setPhase("modifyKyc");
          return;
        }
      }

      if (needsKycModify(stage) || stage.ismodify === true) {
        setPhase("modifyKyc");
        return;
      }

      if (!isModifyKycComplete(stage)) {
        const check = await checkKyc(onboardedToken);
        if (checkKycRequiresModify(check)) {
          setPhase("modifyKyc");
          return;
        }
      }

      const nextPhase = resolvePhaseFromStage(stage);
      if (nextPhase === "modifyKyc") {
        setPhase("modifyKyc");
        return;
      }
      setPhase(nextPhase);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        goToLogin();
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : "Failed to check KYC status. Please try again.";
      if (isPanMissingOnProfile(message)) {
        setKycError(message);
        setPhase("kyc");
        return;
      }
      setModifyKycStatusMessage(message);
    } finally {
      setIsCheckingModifyKyc(false);
    }
  };

  const resumeFromStage = (token: string) => {
    setStageLoadError(null);
    setIsLoadingRisk(true);
    setPhase("risk");

    let effectiveToken = token;

    import("@/services/arnOnboardService")
      .then(({ getUserStage, selectInvestmentModel }) => {
        return selectInvestmentModel("ARN", token)
          .then((modelData) => {
            const newAccessToken =
              typeof modelData?.accessToken === "string" ? modelData.accessToken : null;

            if (newAccessToken) {
              setCookie("onboardedUserToken", newAccessToken, { path: "/" });
              setOnboardedToken(newAccessToken);
              effectiveToken = newAccessToken;
            }
            return getUserStage(effectiveToken);
          })
          .catch((err) => {
            if (isUnauthorizedError(err)) throw err;
            return getUserStage(effectiveToken);
          });
      })
      .then(async (stage) => {
        if (await applyStageResume(stage, effectiveToken)) {
          return;
        }
        if (stage.isRiskProfileComplete) {
          return loadRiskScore(effectiveToken);
        }
        return import("@/services/arnOnboardService")
          .then(({ getRiskProfileQuestionnaire }) =>
            getRiskProfileQuestionnaire(effectiveToken)
          )
          .then((questions) => {
            setRiskQuestions(questions);
            setRiskIndex(0);
            setRiskAnswers({});
          });
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          goToLogin();
          return;
        }
        setStageLoadError(
          err instanceof Error
            ? err.message
            : "Failed to load onboarding status. Please try again."
        );
        setPhase("stageRetry");
      })
      .finally(() => setIsLoadingRisk(false));
  };

  const handleOtpVerified = (token: string) => {
    setOnboardedToken(token);
    setRiskError(null);
    setScoreError(null);
    setModifyKycStatusMessage(null);
    resumeFromStage(token);
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
      <div className="w-full max-w-[560px] px-4 sm:px-0">
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
          onKycModify={goToModifyKyc}
          onCheckModifyKycStatus={handleCheckModifyKycStatus}
          isCheckingModifyKyc={isCheckingModifyKyc}
          modifyKycStatusMessage={modifyKycStatusMessage}
          modifySheetMessage={modifySheetMessage}
          onGoToIdentity={goToIdentity}
          onGoToKycCompliant={goToKycCompliant}
          onGoToNonCompliantQuestions={goToNonCompliantQuestions}
          onGoToDigilocker={goToDigilocker}
          onGoToSignature={goToSignature}
          onGoToNsdl={goToNsdl}
          onUnauthorized={goToLogin}
          onRetryStageLoad={() => resumeFromStage(onboardedToken)}
          stageLoadError={stageLoadError}
          onUserStageChange={setSkipStage}
          onTokenChange={setOnboardedToken}
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
