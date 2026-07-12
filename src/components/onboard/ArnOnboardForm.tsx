"use client";

import { useEffect, useState, useRef } from "react";
import { setCookie } from "cookies-next";
import {
  requestArnOtp,
  verifyArnOtp,
  fetchKycData,
  submitKycExtra,
  type RiskProfileQuestion,
} from "@/services/arnOnboardService";

interface ArnOnboardFormProps {
  phase: "mobile" | "otp" | "risk" | "riskScore" | "kyc" | "kycCompliant" | "identity" | "welcome";
  mobile: string;
  onMobileChange: (value: string) => void;
  otpValues: string[];
  onOtpChange: (values: string[]) => void;
  onGoToOtp: () => void;
  onGoToMobile: () => void;
  onReset: () => void;
  onGoToKyc: () => void;
  onKycVerified: () => void;
  onGoToIdentity: () => void;
  onGoToKycCompliant: () => void;
  onIdentityVerified: () => void;
  onGoToRiskScore: () => void;
  kycError: string | null;
  referredBy: string;
  onOtpVerified: (token: string) => void;
  riskQuestions: RiskProfileQuestion[];
  riskAnswers: Record<number, number>;
  onRiskAnswerChange: (questionId: number, optionIndex: number) => void;
  riskIndex: number;
  onRiskIndexChange: (index: number) => void;
  onSubmitRisk: () => void;
  riskError: string | null;
  isLoadingRisk: boolean;
  isSubmittingRisk: boolean;
  riskScoreData: Record<string, unknown> | null;
  isLoadingScore: boolean;
  scoreError: string | null;
}

function RiskScoreArc({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference / 2;
  const progressOffset = halfCircumference * (1 - clamped / 100);

  return (
    <svg
      className="risk-gauge-svg"
      width="190"
      height="110"
      viewBox="0 0 190 110"
      aria-hidden="true"
    >
      <g transform="rotate(180 95 95)">
        <circle
          cx="95"
          cy="95"
          r={radius}
          fill="none"
          stroke="rgba(186,117,23,0.18)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${halfCircumference} ${circumference}`}
        />
        <circle
          cx="95"
          cy="95"
          r={radius}
          fill="none"
          stroke="var(--arn-amber)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${halfCircumference} ${circumference}`}
          strokeDashoffset={progressOffset}
          style={{
            transition: "stroke-dashoffset 700ms ease",
          }}
        />
      </g>
    </svg>
  );
}

const COUNTRY_CODES = [
  { code: "+1", country: "US", flag: "🇺🇸", label: "United States" },
  { code: "+91", country: "IN", flag: "🇮🇳", label: "India" },
  { code: "+44", country: "GB", flag: "🇬🇧", label: "United Kingdom" },
  { code: "+971", country: "AE", flag: "🇦🇪", label: "United Arab Emirates" },
  { code: "+966", country: "SA", flag: "🇸🇦", label: "Saudi Arabia" },
  { code: "+65", country: "SG", flag: "🇸🇬", label: "Singapore" },
  { code: "+61", country: "AU", flag: "🇦🇺", label: "Australia" },
  { code: "+880", country: "BD", flag: "🇧🇩", label: "Bangladesh" },
  { code: "+92", country: "PK", flag: "🇵🇰", label: "Pakistan" },
  { code: "+94", country: "LK", flag: "🇱🇰", label: "Sri Lanka" },
  { code: "+977", country: "NP", flag: "🇳🇵", label: "Nepal" },
  { code: "+95", country: "MM", flag: "🇲🇲", label: "Myanmar" },
  { code: "+63", country: "PH", flag: "🇵🇭", label: "Philippines" },
  { code: "+60", country: "MY", flag: "🇲🇾", label: "Malaysia" },
  { code: "+62", country: "ID", flag: "🇮🇩", label: "Indonesia" },
  { code: "+84", country: "VN", flag: "🇻🇳", label: "Vietnam" },
  { code: "+66", country: "TH", flag: "🇹🇭", label: "Thailand" },
  { code: "+82", country: "KR", flag: "🇰🇷", label: "South Korea" },
  { code: "+81", country: "JP", flag: "🇯🇵", label: "Japan" },
  { code: "+86", country: "CN", flag: "🇨🇳", label: "China" },
  { code: "+49", country: "DE", flag: "🇩🇪", label: "Germany" },
  { code: "+33", country: "FR", flag: "🇫🇷", label: "France" },
  { code: "+39", country: "IT", flag: "🇮🇹", label: "Italy" },
  { code: "+34", country: "ES", flag: "🇪🇸", label: "Spain" },
  { code: "+31", country: "NL", flag: "🇳🇱", label: "Netherlands" },
  { code: "+41", country: "CH", flag: "🇨🇭", label: "Switzerland" },
  { code: "+46", country: "SE", flag: "🇸🇪", label: "Sweden" },
  { code: "+47", country: "NO", flag: "🇳🇴", label: "Norway" },
  { code: "+45", country: "DK", flag: "🇩🇰", label: "Denmark" },
  { code: "+358", country: "FI", flag: "🇫🇮", label: "Finland" },
  { code: "+48", country: "PL", flag: "🇵🇱", label: "Poland" },
  { code: "+43", country: "AT", flag: "🇦🇹", label: "Austria" },
  { code: "+32", country: "BE", flag: "🇧🇪", label: "Belgium" },
  { code: "+30", country: "GR", flag: "🇬🇷", label: "Greece" },
  { code: "+7", country: "RU", flag: "🇷🇺", label: "Russia" },
  { code: "+55", country: "BR", flag: "🇧🇷", label: "Brazil" },
  { code: "+52", country: "MX", flag: "🇲🇽", label: "Mexico" },
  { code: "+1", country: "CA", flag: "🇨🇦", label: "Canada" },
  { code: "+20", country: "EG", flag: "🇪🇬", label: "Egypt" },
  { code: "+234", country: "NG", flag: "🇳🇬", label: "Nigeria" },
  { code: "+27", country: "ZA", flag: "🇿🇦", label: "South Africa" },
  { code: "+254", country: "KE", flag: "🇰🇪", label: "Kenya" },
  { code: "+972", country: "IL", flag: "🇮🇱", label: "Israel" },
  { code: "+90", country: "TR", flag: "🇹🇷", label: "Turkey" },
  { code: "+98", country: "IR", flag: "🇮🇷", label: "Iran" },
  { code: "+964", country: "IQ", flag: "🇮🇶", label: "Iraq" },
];

export default function ArnOnboardForm({
  phase,
  mobile,
  onMobileChange,
  otpValues,
  onOtpChange,
  onGoToOtp,
  onGoToMobile,
  onReset,
  onGoToKyc,
  onKycVerified,
  onGoToIdentity,
  onGoToKycCompliant,
  onIdentityVerified,
  onGoToRiskScore,
  kycError,
  referredBy,
  onOtpVerified,
  riskQuestions,
  riskAnswers,
  onRiskAnswerChange,
  riskIndex,
  onRiskIndexChange,
  onSubmitRisk,
  riskError,
  isLoadingRisk,
  isSubmittingRisk,
  riskScoreData,
  isLoadingScore,
  scoreError,
}: ArnOnboardFormProps) {
  const [resendTimer, setResendTimer] = useState(30);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+91");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [fullName, setFullName] = useState("");
  const [pan, setPan] = useState("");
  const [dob, setDob] = useState("");
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [kycLocalError, setKycLocalError] = useState<string | null>(null);

  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [incomeSlab, setIncomeSlab] = useState("");
  const [occupationType, setOccupationType] = useState("");
  const [pepChecked, setPepChecked] = useState(false);
  const [isSubmittingIdentity, setIsSubmittingIdentity] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "others", label: "Others" },
  ];
  const maritalOptions = [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
  ];
  const incomeSlabOptions = [
    { value: "upto_1lakh", label: "Up to ₹1 Lakh" },
    { value: "above_1lakh_upto_5lakh", label: "Above ₹1 Lakh – ₹5 Lakh" },
    { value: "above_5lakh_upto_10lakh", label: "Above ₹5 Lakh – ₹10 Lakh" },
    { value: "above_10lakh_upto_25lakh", label: "Above ₹10 Lakh – ₹25 Lakh" },
    { value: "above_25lakh_upto_1cr", label: "Above ₹25 Lakh – ₹1 Cr" },
    { value: "above_1cr", label: "Above ₹1 Cr" },
  ];
  const occupationOptions = [
    { value: "private_sector", label: "Private Sector" },
    { value: "public_sector", label: "Public Sector" },
    { value: "government_sector", label: "Government Sector" },
    { value: "business", label: "Business" },
    { value: "professional", label: "Professional" },
    { value: "retired", label: "Retired" },
    { value: "housewife", label: "Housewife" },
    { value: "student", label: "Student" },
    { value: "others", label: "Others" },
  ];

  const isIdentityValid =
    fatherName.trim().length > 0 &&
    gender !== "" &&
    maritalStatus !== "" &&
    incomeSlab !== "" &&
    occupationType !== "" &&
    pepChecked;

  const titleCase = (value: string): string =>
    value
      .trim()
      .split(/\s+/)
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
      .join(" ");

  const handleIdentitySubmit = async () => {
    if (!isIdentityValid) return;

    setIsSubmittingIdentity(true);
    setIdentityError(null);

    try {
      await submitKycExtra({
        father_name: titleCase(fatherName),
        gender: gender as "male" | "female" | "others",
        marital_status: maritalStatus as "single" | "married",
        income_slab: incomeSlab as
          | "upto_1lakh"
          | "above_1lakh_upto_5lakh"
          | "above_5lakh_upto_10lakh"
          | "above_10lakh_upto_25lakh"
          | "above_25lakh_upto_1cr"
          | "above_1cr",
        occupation_type: occupationType as
          | "private_sector"
          | "public_sector"
          | "government_sector"
          | "business"
          | "professional"
          | "retired"
          | "housewife"
          | "student"
          | "others",
        pep_details: "not_applicable",
      });
      onIdentityVerified();
    } catch (err) {
      setIdentityError(
        err instanceof Error ? err.message : "Failed to save profile details. Please try again."
      );
    } finally {
      setIsSubmittingIdentity(false);
    }
  };

  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim());
  const isKycValid =
    fullName.trim().length > 0 && panValid && dob.trim().length > 0;

  const handleKycSubmit = async () => {
    if (!isKycValid) return;

    setIsSubmittingKyc(true);
    setKycLocalError(null);

    try {
      const result = await fetchKycData({
        pan: pan.trim().toUpperCase(),
        date_of_birth: dob,
        name: fullName.trim(),
      });

      if (result.isKycCompliant) {
        onKycVerified();
      } else {
        const reason = result.reason ? ` — ${result.reason}` : "";
        setKycLocalError(`${result.message}${reason}`.trim());
      }
    } catch (err) {
      setKycLocalError(
        err instanceof Error ? err.message : "KYC verification failed. Please try again."
      );
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  useEffect(() => {
    setResendTimer(30);
    setOtpError(null);
  }, [phase]);

  useEffect(() => {
    if (phase !== "otp" || resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((t) => (t <= 1 ? (clearInterval(timer), 0) : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, resendTimer]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMobileSubmit = async () => {
    if (mobile.replace(/\D/g, "").length !== 10) return;

    setIsRequesting(true);
    setOtpError(null);

    try {
      const digits = mobile.replace(/\D/g, "");
      await requestArnOtp({
        callingCode: countryCode,
        mobileNumber: digits,
        referredBy,
      });
      onGoToOtp();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOtpDigitChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(0, 1);
    const next = [...otpValues];
    next[index] = digit;
    onOtpChange(next);
    if (digit && index < otpValues.length - 1) {
      const el = document.getElementById(`otp-${index + 1}`);
      el?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const el = document.getElementById(`otp-${index - 1}`);
      el?.focus();
    }
  };

  const handleVerify = async () => {
    if (!otpValues.every((v) => v.length === 1)) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      const digits = otpValues.join("");
      const result = await verifyArnOtp({
        mobileNumber: mobile.replace(/\D/g, ""),
        otp: digits,
      });

      const userData = (result.data || {}) as Record<string, unknown>;
      if (userData.accessToken && typeof userData.accessToken === "string") {
        setCookie("onboardedUserToken", userData.accessToken, { path: "/" });
      }
      if (userData.refreshToken && typeof userData.refreshToken === "string") {
        setCookie("onboardedUserRefreshToken", userData.refreshToken, { path: "/" });
      }
      setCookie("onboardedUserData", JSON.stringify(userData), { path: "/" });

      const token =
        userData.accessToken && typeof userData.accessToken === "string"
          ? (userData.accessToken as string)
          : "";
      onOtpVerified(token);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "OTP verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;

    setResendTimer(30);
    setOtpError(null);
    setIsResending(true);

    try {
      const digits = mobile.replace(/\D/g, "");
      await requestArnOtp({
        callingCode: countryCode,
        mobileNumber: digits,
        referredBy,
      });
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[1];

  const riskProfileBlock =
    riskScoreData &&
    typeof riskScoreData.riskProfile === "object" &&
    riskScoreData.riskProfile !== null
      ? (riskScoreData.riskProfile as Record<string, unknown>)
      : null;

  const assetAllocationBlock =
    riskScoreData &&
    typeof riskScoreData.assetAllocation === "object" &&
    riskScoreData.assetAllocation !== null
      ? (riskScoreData.assetAllocation as Record<string, unknown>)
      : null;

  const totalPoints = Number(riskProfileBlock?.totalPoints ?? 0);
  const riskScore = totalPoints * (100 / 70);
  const displayScore = Math.round(
    Math.max(0, Math.min(100, riskScore))
  );
  const fallbackAppetite =
    riskScore <= 30
      ? "Conservative"
      : riskScore <= 60
        ? "Moderate"
        : "Aggressive";
  const riskAppetite =
    typeof assetAllocationBlock?.smallCasePortfolioName === "string" &&
    assetAllocationBlock.smallCasePortfolioName
      ? (assetAllocationBlock.smallCasePortfolioName as string)
      : fallbackAppetite;

  const handleRiskSelect = (questionId: number, optionIndex: number) => {
    onRiskAnswerChange(questionId, optionIndex);

    const isLast = riskIndex >= riskQuestions.length - 1;
    if (isLast) {
      window.setTimeout(() => onSubmitRisk(), 260);
    } else {
      window.setTimeout(() => onRiskIndexChange(riskIndex + 1), 260);
    }
  };

  const handleRiskBack = () => {
    if (riskIndex > 0) {
      onRiskIndexChange(riskIndex - 1);
    } else {
      onGoToMobile();
    }
  };

  const masked = (() => {
    const digits = mobile.replace(/\D/g, "");
    if (!digits) return "";
    const prefix = selectedCountry.flag + " " + selectedCountry.code;
    return `${prefix} ${digits.slice(0, 5)} ${"*".repeat(Math.max(0, digits.length - 5))}`;
  })();

  const isMobileValid = mobile.replace(/\D/g, "").length === 10;
  const isOtpComplete = otpValues.every((v) => v.length === 1);

  return (
    <div>
      {phase === "mobile" && (
        <div className="step-panel">
          <div className="text-center">
            <p className="step-eyebrow">Account Setup</p>
            <h2 className="step-title">Tell us your mobile number</h2>
            <p className="step-helper">We will send a one-time code to verify your number.</p>
          </div>

          <div className="field-group">
            <label className="field-label">
              Mobile Number <span className="req">Required</span>
            </label>
            <div className="flex gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="field-prefix flex items-center justify-between gap-1 min-w-[88px]"
                >
                  <span>{selectedCountry.flag} {selectedCountry.code}</span>
                  <i className="ti ti-chevron-down text-[10px] text-[var(--arn-txt-3)]" aria-hidden="true" />
                </button>
                {isDropdownOpen && (
                  <div className="country-dropdown">
                    {COUNTRY_CODES.map((item) => (
                      <button
                        key={item.country}
                        type="button"
                        onClick={() => {
                          setCountryCode(item.code);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--arn-bg-2)] ${
                          item.code === countryCode ? "text-[var(--arn-amber)]" : "text-[var(--arn-txt)]"
                        }`}
                      >
                        <span className="text-base">{item.flag}</span>
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[var(--arn-txt-2)]">{item.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                className="field-input flex-1"
                placeholder="98765 43210"
                inputMode="numeric"
                maxLength={15}
                value={mobile}
                onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, "").slice(0, 15))}
              />
            </div>
          </div>

          {otpError && phase === "mobile" && (
            <div className="field-error">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {otpError}
            </div>
          )}

          <button
            type="button"
            onClick={handleMobileSubmit}
            disabled={!isMobileValid || isRequesting}
            className="btn-primary btn-wide"
          >
            {isRequesting ? "Sending..." : "Proceed"} {!isRequesting && <i className="ti ti-arrow-right" aria-hidden="true" />}
          </button>
        </div>
      )}

      {phase === "otp" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToMobile} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <div className="text-center">
            <p className="step-eyebrow">Account Setup</p>
            <h2 className="step-title">Enter the OTP sent to</h2>
            <p className="step-helper">{masked}</p>
          </div>

          <div className="otp-row justify-center">
            {otpValues.map((value, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                className="otp-box"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
              />
            ))}
          </div>

          {otpError && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {otpError}
            </div>
          )}

          <div className="mb-5 text-center">
            <span
              className={`resend-link ${resendTimer > 0 || isResending ? "disabled" : ""}`}
              role="button"
              onClick={handleResend}
            >
              {isResending ? "Resending..." : resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!isOtpComplete || isVerifying}
            className="btn-primary btn-wide"
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {phase === "risk" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={handleRiskBack} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          {isLoadingRisk ? (
            <div className="text-center py-10">
              <p className="step-eyebrow">Risk Assessment</p>
              <h2 className="step-title">Loading your risk profile</h2>
              <p className="step-helper">Please wait a moment…</p>
            </div>
          ) : riskQuestions.length === 0 ? (
            <div className="text-center py-10">
              <p className="step-eyebrow">Risk Assessment</p>
              <h2 className="step-title">Couldn&apos;t load questions</h2>
              <p className="step-helper">
                {riskError || "Something went wrong. Please try again."}
              </p>
              <button
                type="button"
                onClick={onGoToMobile}
                className="btn-primary btn-wide"
              >
                Back to Mobile
              </button>
            </div>
          ) : (
            (() => {
              const question = riskQuestions[riskIndex];
              const selected = riskAnswers[question.id];
              const pct = ((riskIndex + 1) / riskQuestions.length) * 100;

              return (
                <div>
                  <div className="q-header-row">
                    <p className="step-eyebrow">Risk Assessment</p>
                    <span className="q-counter">
                      {riskIndex + 1} / {riskQuestions.length}
                    </span>
                  </div>

                  <h2 className="step-title" style={{ marginBottom: 6 }}>
                    {question.question}
                  </h2>

                  <div className="q-progress-track">
                    <div className="q-progress-fill" style={{ width: `${pct}%` }} />
                  </div>

                  <p className="step-helper" style={{ marginBottom: 30 }}>
                    Select the option that best describes you.
                  </p>

                  <div className="answer-grid">
                    {question.option.map((opt, index) => {
                      const isSelected = selected === index;
                      return (
                        <div
                          key={index}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleRiskSelect(question.id, index)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRiskSelect(question.id, index);
                            }
                          }}
                          className={`answer-card ${isSelected ? "selected" : ""}`}
                        >
                          {opt.answer}
                        </div>
                      );
                    })}
                  </div>

                  {riskError && (
                    <div className="field-error justify-center mt-4">
                      <i className="ti ti-alert-circle" aria-hidden="true" />
                      {riskError}
                    </div>
                  )}

                  {riskIndex === riskQuestions.length - 1 && (
                    <button
                      type="button"
                      onClick={onSubmitRisk}
                      disabled={
                        selected === undefined || isSubmittingRisk
                      }
                      className="btn-primary btn-wide"
                      style={{ marginTop: 24 }}
                    >
                      {isSubmittingRisk ? "Submitting..." : "Submit"}
                    </button>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {phase === "riskScore" && (
        <div className="step-panel">
          {isLoadingScore ? (
            <div className="text-center py-10">
              <p className="step-eyebrow">Risk Assessment</p>
              <h2 className="step-title">Generating your risk score</h2>
              <p className="step-helper">Please wait a moment…</p>
            </div>
          ) : (
            <div>
              <p className="step-eyebrow" style={{ textAlign: "center" }}>
                Risk Assessment
              </p>
              <h2 className="step-title" style={{ textAlign: "center" }}>
                Your Risk Profile
              </h2>

              <div className="risk-gauge-wrap">
                <RiskScoreArc score={riskScore} />
                <div className="risk-score">{displayScore}</div>
                <div className="risk-appetite">{riskAppetite}</div>
                <div className="risk-score-sub">Your risk score is</div>
              </div>

              {scoreError && (
                <div className="field-error justify-center">
                  <i className="ti ti-alert-circle" aria-hidden="true" />
                  {scoreError}
                </div>
              )}

              <button
                type="button"
                onClick={onGoToKyc}
                className="btn-primary btn-wide"
                style={{ marginTop: 24 }}
              >
                Continue <i className="ti ti-arrow-right" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
      {phase === "kyc" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToRiskScore} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <div className="text-center">
            <p className="step-eyebrow">Identity Verification</p>
            <h2 className="step-title">Complete your PAN details</h2>
            <p className="step-helper">
              Please provide your PAN number, date of birth and full name to complete your profile.
            </p>
          </div>

          <div className="field-group">
            <label className="field-label">
              Full Name <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">
              PAN Number <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              placeholder="ABCDE1234F"
              value={pan}
              maxLength={10}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
            />
          </div>

          <div className="field-group">
            <label className="field-label">
              Date of Birth <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          {(kycError || kycLocalError) && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {kycLocalError || kycError}
            </div>
          )}

          <button
            type="button"
            onClick={handleKycSubmit}
            disabled={!isKycValid || isSubmittingKyc}
            className="btn-primary btn-wide"
            style={{ marginTop: 8 }}
          >
            {isSubmittingKyc ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {phase === "kycCompliant" && (
        <div className="step-panel">
          <p className="step-eyebrow" style={{ textAlign: "center" }}>
            Identity Verification
          </p>
          <h2 className="step-title" style={{ textAlign: "center" }}>
            KYC compliance status
          </h2>
          <p className="step-helper" style={{ textAlign: "center" }}>
            We&apos;ve checked your KYC status with the CKYC Registry (CERSAI) and SEBI databases.
          </p>

          <div className="glass-card gold" style={{ textAlign: "center", padding: "34px 26px" }}>
            <div className="success-ring">
              <i className="ti ti-shield-check" aria-hidden="true" />
            </div>
            <div className="card-title" style={{ textAlign: "center" }}>
              You&apos;re KYC Compliant!
            </div>
            <div className="card-sub" style={{ textAlign: "center" }}>
              Your KYC is complete and up to date. You can proceed without any additional verification.
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToIdentity}
            className="btn-primary btn-wide"
            style={{ marginTop: 20 }}
          >
            Continue <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        </div>
      )}

      {phase === "identity" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToKycCompliant} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <p className="step-eyebrow">Identity Verification</p>
          <h2 className="step-title">Answer the following questions</h2>
          <p className="step-helper">
            Please provide the information below to complete your profile.
          </p>

          <div className="onboard-section-label">Family Details</div>
          <div className="field-group">
            <label className="field-label">
              Father&apos;s Name <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              placeholder="Enter father's name"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
            />
          </div>

          <div className="onboard-section-label">Personal Details</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field-group">
              <label className="field-label">Gender</label>
              <select
                className="field-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select your gender</option>
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Marital Status</label>
              <select
                className="field-select"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
              >
                <option value="">Select your marital status</option>
                {maritalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="onboard-section-label">Financial Details</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field-group">
              <label className="field-label">Income Slab</label>
              <select
                className="field-select"
                value={incomeSlab}
                onChange={(e) => setIncomeSlab(e.target.value)}
              >
                <option value="">Select your income slab range</option>
                {incomeSlabOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Occupation</label>
              <select
                className="field-select"
                value={occupationType}
                onChange={(e) => setOccupationType(e.target.value)}
              >
                <option value="">Select your occupation</option>
                {occupationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="onboard-check">
            <input
              type="checkbox"
              checked={pepChecked}
              onChange={(e) => setPepChecked(e.target.checked)}
            />
            <span>
              I confirm I am not a politically exposed person (PEP). By continuing, you agree to our{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>
                Terms &amp; Conditions
              </a>
              .
            </span>
          </label>

          {identityError && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {identityError}
            </div>
          )}

          <button
            type="button"
            onClick={handleIdentitySubmit}
            disabled={!isIdentityValid || isSubmittingIdentity}
            className="btn-primary btn-wide"
            style={{ marginTop: 8 }}
          >
            {isSubmittingIdentity ? "Saving..." : "Save and Continue"}
          </button>
        </div>
      )}

      {phase === "welcome" && (
        <div className="step-panel welcome-panel">
          <div className="success-ring">
            <i className="ti ti-check" aria-hidden="true" />
          </div>

          <p className="step-eyebrow" style={{ textAlign: "center" }}>Welcome to Fydaa</p>
          <h2 className="step-title" style={{ textAlign: "center" }}>You&apos;re all set</h2>
          <p className="step-helper" style={{ textAlign: "center", margin: "0 auto 28px", maxWidth: "440px" }}>
            Your advisor will reach out within 24 hours to begin your wealth journey.
          </p>

          <div className="summary-list">
            <div className="summary-row">
              <span className="summary-label">Mobile</span>
              <span className="summary-val">
                <i className="ti ti-circle-check" aria-hidden="true" />
                {masked ? mobile.replace(/\D/g, "") : "—"}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Account</span>
              <span className="summary-val">
                <i className="ti ti-circle-check" aria-hidden="true" />
                Ready
              </span>
            </div>
            {riskScoreData && (
              <div className="summary-row">
                <span className="summary-label">Risk Profile</span>
                <span className="summary-val">
                  <i className="ti ti-circle-check" aria-hidden="true" />
                  {displayScore} · {riskAppetite}
                </span>
              </div>
            )}
            {phase === "welcome" && (
              <div className="summary-row">
                <span className="summary-label">KYC Status</span>
                <span className="summary-val">
                  <i className="ti ti-circle-check" aria-hidden="true" />
                  Verified
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onReset}
            className="btn-primary btn-wide"
          >
            Go to Dashboard <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
