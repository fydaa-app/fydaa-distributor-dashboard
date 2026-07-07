"use client";

import { useEffect, useState, useRef } from "react";
import { setCookie } from "cookies-next";
import { requestArnOtp, verifyArnOtp } from "@/services/arnOnboardService";

interface ArnOnboardFormProps {
  phase: "mobile" | "otp" | "welcome";
  mobile: string;
  onMobileChange: (value: string) => void;
  otpValues: string[];
  onOtpChange: (values: string[]) => void;
  onGoToOtp: () => void;
  onGoToWelcome: () => void;
  onGoToMobile: () => void;
  onReset: () => void;
  referredBy: string;
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
  onGoToWelcome,
  onGoToMobile,
  onReset,
  referredBy,
}: ArnOnboardFormProps) {
  const [resendTimer, setResendTimer] = useState(30);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+91");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

      onGoToWelcome();
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
