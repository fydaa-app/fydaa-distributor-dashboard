"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { changePassword } from "@/services/arnPasswordService";

export default function ResetPassword() {
  const router = useRouter();
  const { user, isImpersonating, logout } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Partner Admin preview sessions must never mutate the real partner's
  // password. The API enforces this with a 403 as well.
  if (isImpersonating) {
    return (
      <div className="rounded border border-[var(--arn-amber)] bg-[var(--arn-amber-bg)]/60 p-4">
        <p className="text-sm font-semibold text-[var(--arn-amber-txt)]">
          Password changes are disabled in preview mode
        </p>
        <p className="mt-1 text-sm text-[var(--arn-amber-txt)]">
          You are viewing this account as a Partner Admin. Ask the partner to
          use &ldquo;Forgot password&rdquo; on the sign-in page to reset it
          themselves.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/")}
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      const message = "New password and confirm password don't match";
      setFormError(message);
      toast.error(message);
      return;
    }

    if (oldPassword === newPassword) {
      const message = "New password must be different from the current password";
      setFormError(message);
      toast.error(message);
      return;
    }

    if (!user?.email) {
      const message = "Could not determine your account. Please sign in again.";
      setFormError(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await changePassword({
        email: user.email,
        oldPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(response?.message || "Password updated successfully");

      // The existing session is no longer guaranteed to be the one that owns
      // the new password, so force a clean re-authentication.
      logout();
      setTimeout(() => router.replace("/signin"), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update password.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordField = ({
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
  }) => (
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

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      {formError ? (
        <div
          role="alert"
          className="mb-4 rounded border border-[var(--arn-red)] bg-[var(--arn-red-bg)]/60 p-3 text-sm text-[var(--arn-red)]"
        >
          {formError}
        </div>
      ) : null}

      {user?.email ? (
        <div className="mb-4">
          <Label>Email</Label>
          <Input
            type="email"
            value={user.email}
            readOnly
            disabled
            className="cursor-not-allowed"
          />
        </div>
      ) : null}

      <div className="space-y-6">
        {passwordField({
          id: "oldPassword",
          label: "Current Password",
          value: oldPassword,
          onChange: setOldPassword,
          isVisible: showOldPassword,
          onToggle: () => setShowOldPassword((v) => !v),
          autoComplete: "current-password",
          minLength: 6,
        })}

        {passwordField({
          id: "newPassword",
          label: "New Password",
          value: newPassword,
          onChange: setNewPassword,
          isVisible: showNewPassword,
          onToggle: () => setShowNewPassword((v) => !v),
          autoComplete: "new-password",
          minLength: 8,
          hint: "Min 8 characters with uppercase, lowercase, and number",
        })}

        {passwordField({
          id: "confirmPassword",
          label: "Confirm New Password",
          value: confirmPassword,
          onChange: setConfirmPassword,
          isVisible: showConfirmPassword,
          onToggle: () => setShowConfirmPassword((v) => !v),
          autoComplete: "new-password",
          minLength: 8,
        })}

        <div>
          <Button type="submit" isLoading={isSubmitting} loadingLabel="Updating...">
            Update Password
          </Button>
        </div>
      </div>
    </form>
  );
}
