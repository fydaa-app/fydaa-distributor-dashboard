"use client";

import { useState, useCallback, useRef } from "react";
import { verifyArnOtp, requestArnOtp } from "@/services/arnOnboardService";
import { setCookie } from "cookies-next";

interface OtpEntryFormProps {
  mobile: string;
  onVerify: (mobile: string, otp: string) => Promise<void>;
  onResend: (mobile: string) => Promise<void>;
  onBack: () => void;
  submitting?: boolean;
  resending?: boolean;
  error?: string | null;
  resendTimer?: number;
  onVerifyComplete?: (token: string) => void;
}

export default function OtpEntryForm({
  mobile,
  onVerify,
  onResend,
  onBack,
  submitting = false,
  resending = false,
  error = null,
  resendTimer = 0,
  onVerifyComplete,
}: OtpEntryFormProps) {
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);

  const handleVerify = useCallback(async () => {
    if (!otpValues.every((v) => v.length === 1)) {
      return;
    }

    setIsVerifying(true);

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
      onVerifyComplete?.(token);
      await onVerify(mobile, digits);
    } catch {
      // Error is handled by parent component via error prop
    } finally {
      setIsVerifying(false);
    }
  }, [mobile, otpValues, onVerify, onVerifyComplete]);

  const handleResend = useCallback(async () => {
    if (isResending) return;

    setIsResending(true);

    try {
      const digits = mobile.replace(/\D/g, "");
      await requestArnOtp({
        callingCode: "+91",
        mobileNumber: digits,
        referredBy: "",
      });
      onResend(mobile);
    } catch {
      // Error is handled by parent component via error prop
    } finally {
      setIsResending(false);
    }
  }, [mobile, onResend, isResending]);

  const isComplete = otpValues.every((v) => v.length === 1);
  const formattedMobile = `🇮🇳 +91 ${mobile.replace(/\D/g, "").replace(/(\d{5})(\d{5})/, "$1 $2")}`;

  return (
    <div className="step-panel">
      <div className="flex justify-center mb-5">
        <button className="back-btn" onClick={onBack} role="button" tabIndex={0} aria-label="Go back">
          <i className="ti ti-arrow-left" aria-hidden="true" />
        </button>
      </div>

      <div className="text-center">
        <p className="step-eyebrow">Account Setup</p>
        <h2 className="step-title">Enter the OTP sent to</h2>
        <p className="step-helper">{formattedMobile}</p>
      </div>

      <div className="otp-row justify-center">
        {otpValues.map((value, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            id={`otp-${index}`}
            className="otp-box"
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={(e) => {
              const digit = e.target.value.replace(/\D/g, "").slice(0, 1);
              const next = [...otpValues];
              next[index] = digit;
              setOtpValues(next);
              if (digit && index < otpValues.length - 1) {
                inputRefs.current[index + 1]?.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !otpValues[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
              }
            }}
          />
        ))}
      </div>

      {error && (
        <div className="field-error justify-center">
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="mb-5 text-center">
        <button
          type="button"
          className={`resend-link ${resendTimer > 0 || isResending ? "disabled" : ""}`}
          onClick={handleResend}
          disabled={resendTimer > 0 || isResending || resending}
        >
          {isResending ? "Resending..." : resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={!isComplete || isVerifying || submitting}
        className="btn-primary btn-wide"
      >
        {isVerifying ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}