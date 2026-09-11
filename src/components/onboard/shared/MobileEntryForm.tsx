"use client";

import { useState, useCallback } from "react";
import { getCookie } from "cookies-next";

interface MobileEntryFormProps {
  mobile: string;
  onMobileChange: (value: string) => void;
  onSubmit: (mobile: string, referredBy: string) => Promise<void>;
  disabled?: boolean;
  submitting?: boolean;
  error?: string | null;
  referredBy?: string;
}

export default function MobileEntryForm({
  mobile,
  onMobileChange,
  onSubmit,
  disabled = false,
  submitting = false,
  error = null,
  referredBy = "",
}: MobileEntryFormProps) {
  const [localMobile, setLocalMobile] = useState(mobile);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setLocalMobile(value);
    onMobileChange(value);
  }, [onMobileChange]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (localMobile.replace(/\D/g, "").length !== 10 || disabled) return;
      await onSubmit(localMobile, referredBy || getCookie("employeeData") ? JSON.parse(getCookie("employeeData") as string)?.referralCode || "" : "");
    },
    [localMobile, disabled, onSubmit, referredBy]
  );

  const isValid = localMobile.replace(/\D/g, "").length === 10;

  return (
    <form onSubmit={handleSubmit} className="step-panel">
      <div className="text-center">
        <p className="step-eyebrow">Account Setup</p>
        <h2 className="step-title">Enter mobile number</h2>
        <p className="step-helper">We will send a one-time code to this number for verification.</p>
      </div>

      <div className="field-group">
        <label className="field-label">
          Mobile Number <span className="req">Required</span>
        </label>
        <div className="flex gap-2">
          <div className="field-prefix field-prefix-fixed flex items-center justify-center gap-1 min-w-[88px]">
            <span>🇮🇳 +91</span>
          </div>
          <input
            className="field-input flex-1"
            placeholder="98765 43210"
            inputMode="numeric"
            maxLength={10}
            value={localMobile}
            onChange={handleChange}
            disabled={disabled}
          />
        </div>
      </div>

      {error && (
        <div className="field-error">
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || submitting || disabled}
        className="btn-primary btn-wide"
      >
        {submitting ? "Sending..." : "Proceed"}
      </button>
    </form>
  );
}