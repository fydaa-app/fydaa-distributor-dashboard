"use client";

import { useState } from "react";
//import { useRouter } from "next/navigation";
import ArnOnboardStepper from "./ArnOnboardStepper";
import ArnOnboardForm from "./ArnOnboardForm";

export default function ArnOnboardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const stepperLabels = ["Basic info", "KYC & ID", "Risk profile", "First SIP"];
  //const router = useRouter();

  const handleNextStep = () => {
    if (currentStep < stepperLabels.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDone = () => {
    setCurrentStep(5); // Navigate to success step
  };

  const handleReset = () => {
    setCurrentStep(1); // Reset to first step for onboarding another client
  };

  // const handleViewClients = () => {
  //   router.push("/arn-clients"); // Navigate to the clients page
  // };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <div className="max-w-[560px]">
        <ArnOnboardStepper currentStep={currentStep} labels={stepperLabels} />
        <ArnOnboardForm
          currentStep={currentStep}
          onNext={handleNextStep}
          onBack={handlePrevStep}
          onDone={handleDone}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}