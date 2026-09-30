"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import {
  sendPasswordResetOtp,
  verifyOtpAndResetPassword,
} from "@/services/arnPasswordService";

type Step = "send-otp" | "reset-password";

function AlertBanner({
  tone,
  children,
}: {
  tone: "error" | "info" | "success";
  children: React.ReactNode;
}) {
  const toneClasses = {
    error: "border-[var(--arn-red)] bg-[var(--arn-red-bg)]/60 text-[var(--arn-red)]",
    info: "border-[var(--arn-blue)] bg-[var(--arn-blue-bg)]/60 text-[var(--arn-blue)]",
    success:
      "border-[var(--arn-green)] bg-[var(--arn-green-bg)]/60 text-[var(--arn-green)]",
  } as const;

  return (
    <div
      className={`mb-4 rounded border p-3 text-sm ${toneClasses[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  isVisible,
  onToggle,
  autoComplete,
  minLength,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  isVisible: boolean;
  onToggle: () => void;
  autoComplete: string;
  minLength: number;
  hint?: string;
}) {
  return (
    <div>
      <Label>
        {label} <span className="text-[var(--arn-red)]">*</span>{" "}
      </Label>
      <div className="relative flex">
        <div className="flex-1 z-10">
          <Input
            id={id}
            name={id}
            type={isVisible ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete={autoComplete}
            required
            minLength={minLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
        >
          {isVisible ? (
            <EyeIcon className="fill-[var(--arn-txt-2)]" />
          ) : (
            <EyeCloseIcon className="fill-[var(--arn-txt-2)]" />
          )}
        </button>
      </div>
      {hint ? (
        <p className="mt-2 text-xs text-[var(--arn-txt-2)]">{hint}</p>
      ) : null}
    </div>
  );
}

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("send-otp");

  // Step 1 state
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Step 2 state
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsSending(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await sendPasswordResetOtp(normalizedEmail);
      setEmail(normalizedEmail);
      toast.success(response?.message || "OTP sent.");
      setStep("reset-password");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send OTP. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleResendOtp = async () => {
    setFormError(null);
    setIsResending(true);

    try {
      const response = await sendPasswordResetOtp(email);
      toast.success(response?.message || "OTP resent successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend OTP.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      const message = "Passwords do not match";
      setFormError(message);
      toast.error(message);
      return;
    }

    setIsResetting(true);

    try {
      const response = await verifyOtpAndResetPassword({
        email,
        otp,
        newPassword,
        confirmPassword,
      });

      toast.success(response?.message || "Password has been reset successfully.");
      setTimeout(() => router.push("/signin"), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleChangeEmail = () => {
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setFormError(null);
    setStep("send-otp");
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-[var(--arn-txt)] text-title-sm dark:text-[var(--arn-txt)] sm:text-title-md">
              {step === "send-otp" ? "Forgot Password" : "Reset Your Password"}
            </h1>
            <p className="text-sm text-[var(--arn-txt-2)] dark:text-[var(--arn-txt-2)]">
              {step === "send-otp"
                ? "Enter your email and we'll send you an OTP"
                : "Enter the OTP and your new password"}
            </p>
          </div>

          {formError ? <AlertBanner tone="error">{formError}</AlertBanner> : null}

          {step === "send-otp" ? (
            <form onSubmit={handleSendOtp}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-[var(--arn-red)]">*</span>{" "}
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="info@gmail.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Button
                    type="submit"
                    isLoading={isSending}
                    loadingLabel="Sending..."
                  >
                    Send OTP
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-4">
                <AlertBanner tone="info">
                  OTP has been sent to <strong>{email}</strong>. Please check
                  your inbox.
                </AlertBanner>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Enter OTP <span className="text-[var(--arn-red)]">*</span>{" "}
                    </Label>
                    <Input
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      required
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="text-center text-lg font-semibold tracking-[0.35em]"
                    />
                    <p className="mt-2 text-xs text-[var(--arn-txt-2)]">
                      OTP is valid for 10 minutes
                    </p>
                  </div>

                  <PasswordField
                    id="newPassword"
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    isVisible={showNewPassword}
                    onToggle={() => setShowNewPassword((v) => !v)}
                    autoComplete="new-password"
                    minLength={8}
                    hint="Min 8 characters with uppercase, lowercase, and number"
                  />

                  <PasswordField
                    id="confirmPassword"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    isVisible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((v) => !v)}
                    autoComplete="new-password"
                    minLength={8}
                  />

                  <div>
                    <Button
                      type="submit"
                      isLoading={isResetting}
                      loadingLabel="Resetting..."
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              </form>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  fullWidth={false}
                  className="px-0 py-1 text-xs"
                  isLoading={isResending}
                  loadingLabel="Sending..."
                  onClick={handleResendOtp}
                  disabled={isResetting}
                >
                  Resend OTP
                </Button>
                <Button
                  variant="ghost"
                  fullWidth={false}
                  className="px-0 py-1 text-xs"
                  onClick={handleChangeEmail}
                  disabled={isResetting || isResending}
                >
                  Change Email
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/signin"
              className="text-sm text-[var(--arn-amber)] hover:text-[var(--arn-amber-hover)] dark:text-[var(--arn-amber)]"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
