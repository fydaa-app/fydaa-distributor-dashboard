"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { loginWithArnApi } from "@/services/arnService";
import Link from "next/link";
import React, { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formRef = useRef<HTMLFormElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const emailValue = emailInputRef.current?.value || email;
      const passwordValue = passwordInputRef.current?.value || password;

      if (!emailValue || !passwordValue) {
        setError("Please enter both email and password");
        setIsLoading(false);
        return;
      }

      await loginWithArnApi(
        emailValue,
        passwordValue,
        isChecked
      );
      /*
      await loginTemporarily(
        emailValue,
        passwordValue,
        isChecked
      );
      */

      setIsLoading(false);
      window.dispatchEvent(new Event("auth-changed"));
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const submitForm = () => {
    if (!isLoading && formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-[var(--arn-txt)] text-title-sm dark:text-[var(--arn-txt)] sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-[var(--arn-txt-2)] dark:text-[var(--arn-txt-2)]">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form ref={formRef} onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 rounded border border-[var(--arn-bdr)] bg-[var(--arn-red-bg)]/60 p-3 text-sm text-[var(--arn-red)]">
                  {error}
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-[var(--arn-red)]">*</span>{" "}
                  </Label>
                  <div className="relative flex">
                    <div className="flex-1 z-10">
                      <Input
                        ref={emailInputRef}
                        placeholder="info@gmail.com"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>
                    Password <span className="text-[var(--arn-red)]">*</span>{" "}
                  </Label>
                  <div className="relative flex">
                    <div className="flex-1 z-10">
                      <Input
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-[var(--arn-txt-2)] dark:fill-[var(--arn-txt-2)]" />
                      ) : (
                        <EyeCloseIcon className="fill-[var(--arn-txt-2)] dark:fill-[var(--arn-txt-2)]" />
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--arn-txt-2)] dark:text-[var(--arn-txt-2)]">
                    Use your ARN login credentials.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onChange={setIsChecked}
                    />
                    <span className="block font-normal text-[var(--arn-txt)] text-theme-sm dark:text-[var(--arn-txt-2)]">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/forgotpassword"
                    className="text-sm text-[var(--arn-amber)] hover:text-[var(--arn-amber-hover)] dark:text-[var(--arn-amber)]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <button
                    onClick={submitForm}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center bg-[var(--arn-amber)] text-[var(--arn-white)] hover:bg-[var(--arn-amber-hover)] 
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--arn-amber)] px-4 py-2 
                              rounded-lg text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {isLoading ? "Signing In..." : "Sign in"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
