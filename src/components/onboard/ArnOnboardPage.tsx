"use client";

import { getCookie } from "cookies-next";
import { useState } from "react";
import ArnOnboardForm from "./ArnOnboardForm";

type Phase = "mobile" | "otp" | "welcome";

export default function ArnOnboardPage() {
  const [phase, setPhase] = useState<Phase>("mobile");
  const [mobile, setMobile] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);

  const rawUserData = getCookie("userData");
  const userData = rawUserData ? JSON.parse(rawUserData as string) : {};
  const referredBy = userData?.code || "";

  const goToOtp = () => setPhase("otp");
  const goToWelcome = () => setPhase("welcome");
  const goToMobile = () => setPhase("mobile");
  const resetOnboard = () => {
    setMobile("");
    setOtpValues(["", "", "", ""]);
    setPhase("mobile");
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
          onGoToWelcome={goToWelcome}
          onGoToMobile={goToMobile}
          onReset={resetOnboard}
          referredBy={referredBy}
        />
      </div>
    </div>
  );
}
