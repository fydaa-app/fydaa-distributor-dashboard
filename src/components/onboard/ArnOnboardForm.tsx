"use client";

import React, { useState } from "react";
import { CheckIcon, InfoCircleIcon,  RocketIcon, ScaleIcon,   LeafIcon } from "@/icons";

interface ArnOnboardFormProps {
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onDone: () => void;
  onReset: () => void;
}

export default function ArnOnboardForm({
  currentStep,
  onNext,
  onBack,
  onDone,
  onReset,
}: ArnOnboardFormProps) {
  // Step 1: Basic Info states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("Salaried professional");

  // Step 2: KYC & ID states
  const [pan, setPan] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");

  // Step 3: Risk Profile states
  const [investmentApproach, setInvestmentApproach] = useState("Conservative");
  const [investmentHorizon, setInvestmentHorizon] = useState("3–5 yrs");

  // Step 4: First SIP states
  const [fund, setFund] = useState("Mirae Asset Large Cap – Direct Growth");
  const [monthlySip, setMonthlySip] = useState("5,000");
  const [sipDate, setSipDate] = useState("5th every month");
  const [eMandate, setEMandate] = useState("NetBanking — instant activation");

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="card">
            <div className="grid grid-cols-1 gap-2.5 mb-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">First name</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="Mohit"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Last name</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="Verma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mb-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Mobile</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="+91 98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Email</label>
                <input
                  type="email"
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="mohit@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mb-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Date of birth</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="DD / MM / YYYY"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">City</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Occupation</label>
                <select
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] font-sans"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                >
                  <option>Salaried professional</option>
                  <option>Self-employed / business owner</option>
                  <option>Homemaker</option>
                  <option>Retired</option>
                  <option>Student</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="card">
            <div className="grid grid-cols-1 gap-2.5 mb-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">PAN number</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Aadhaar (last 4)</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="XXXX"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5 mb-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Bank account number</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="Enter account number"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5 mb-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">IFSC code</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="HDFC0001234"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Bank name</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="HDFC Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 rounded-md bg-[var(--arn-amb-bg)] px-3 py-2 text-[11px] text-[var(--arn-amb-txt)]">
              <InfoCircleIcon className="w-4 h-4 flex-shrink-0" />
              eKYC via Aadhaar OTP takes under 2 minutes.
            </div>
          </div>
        );
      case 3:
        return (
          <div className="card">
            <div className="text-[11px] text-[var(--arn-txt-2)] mb-2">Investment approach</div>
            <div className="grid grid-cols-3 gap-2">
              <div
                className={`flex flex-col items-center justify-center p-2 rounded-md border cursor-pointer transition-all duration-100 ${
                  investmentApproach === "Conservative"
                    ? 'border-[var(--arn-amber)] bg-[var(--arn-amb-bg)] text-[var(--arn-amb-txt)] font-bold'
                    : 'border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] text-[var(--arn-txt-2)]'
                }`}
                onClick={() => setInvestmentApproach("Conservative")}
              >
                <LeafIcon className="w-5 h-5" />
                <div className="mt-1 text-[11px]">Conservative</div>
                <div className="text-[10px] mt-0.5 opacity-80">Capital protection</div>
              </div>
              <div
                className={`flex flex-col items-center justify-center p-2 rounded-md border cursor-pointer transition-all duration-100 ${
                  investmentApproach === "Moderate"
                    ? 'border-[var(--arn-amber)] bg-[var(--arn-amb-bg)] text-[var(--arn-amb-txt)] font-bold'
                    : 'border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] text-[var(--arn-txt-2)]'
                }`}
                onClick={() => setInvestmentApproach("Moderate")}
              >
                <ScaleIcon className="w-5 h-5" />
                <div className="mt-1 text-[11px]">Moderate</div>
                <div className="text-[10px] mt-0.5 opacity-80">Balanced growth</div>
              </div>
              <div
                className={`flex flex-col items-center justify-center p-2 rounded-md border cursor-pointer transition-all duration-100 ${
                  investmentApproach === "Aggressive"
                    ? 'border-[var(--arn-amber)] bg-[var(--arn-amb-bg)] text-[var(--arn-amb-txt)] font-bold'
                    : 'border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] text-[var(--arn-txt-2)]'
                }`}
                onClick={() => setInvestmentApproach("Aggressive")}
              >
                <RocketIcon className="w-5 h-5" />
                <div className="mt-1 text-[11px]">Aggressive</div>
                <div className="text-[10px] mt-0.5 opacity-80">Maximum growth</div>
              </div>
            </div>

            <div className="text-[11px] text-[var(--arn-txt-2)] mt-3.5 mb-1.5">Investment horizon</div>
            <div className="flex flex-wrap gap-1.5">
              <div
                className={`px-3 py-1.5 rounded-full border cursor-pointer text-[11px] transition-all duration-100 ${
                  investmentHorizon === "1–3 yrs"
                    ? 'border-[var(--arn-amber)] bg-[var(--arn-amb-bg)] text-[var(--arn-amb-txt)] font-bold'
                    : 'border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] text-[var(--arn-txt-2)]'
                }`}
                onClick={() => setInvestmentHorizon("1–3 yrs")}
              >
                1–3 yrs
              </div>
              <div
                className={`px-3 py-1.5 rounded-full border cursor-pointer text-[11px] transition-all duration-100 ${
                  investmentHorizon === "3–5 yrs"
                    ? 'border-[var(--arn-amber)] bg-[var(--arn-amb-bg)] text-[var(--arn-amb-txt)] font-bold'
                    : 'border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] text-[var(--arn-txt-2)]'
                }`}
                onClick={() => setInvestmentHorizon("3–5 yrs")}
              >
                3–5 yrs
              </div>
              <div
                className={`px-3 py-1.5 rounded-full border cursor-pointer text-[11px] transition-all duration-100 ${
                  investmentHorizon === "5–10 yrs"
                    ? 'border-[var(--arn-amber)] bg-[var(--arn-amb-bg)] text-[var(--arn-amb-txt)] font-bold'
                    : 'border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] text-[var(--arn-txt-2)]'
                }`}
                onClick={() => setInvestmentHorizon("5–10 yrs")}
              >
                5–10 yrs
              </div>
              <div
                className={`px-3 py-1.5 rounded-full border cursor-pointer text-[11px] transition-all duration-100 ${
                  investmentHorizon === "10+ yrs"
                    ? 'border-[var(--arn-amber)] bg-[var(--arn-amb-bg)] text-[var(--arn-amb-txt)] font-bold'
                    : 'border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] text-[var(--arn-txt-2)]'
                }`}
                onClick={() => setInvestmentHorizon("10+ yrs")}
              >
                10+ yrs
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="card">
            <div className="grid grid-cols-1 gap-2.5 mb-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Fund</label>
                <select
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] font-sans"
                  value={fund}
                  onChange={(e) => setFund(e.target.value)}
                >
                  <option>Mirae Asset Large Cap – Direct Growth</option>
                  <option>Parag Parikh Flexi Cap – Direct Growth</option>
                  <option>ICICI Pru Bluechip – Direct Growth</option>
                  <option>Axis Small Cap – Direct Growth</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mb-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">Monthly SIP (₹)</label>
                <input
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="5,000"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">SIP date</label>
                <select
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] font-sans"
                  value={sipDate}
                  onChange={(e) => setSipDate(e.target.value)}
                >
                  <option>5th every month</option>
                  <option>10th every month</option>
                  <option>15th every month</option>
                  <option>25th every month</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mb-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--arn-txt-2)]">eMandate / NACH</label>
                <select
                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--arn-bdr-2)] text-[12px] bg-[var(--arn-bg-2)] text-[var(--arn-txt)] font-sans"
                  value={eMandate}
                  onChange={(e) => setEMandate(e.target.value)}
                >
                  <option>NetBanking — instant activation</option>
                  <option>Debit card mandate</option>
                  <option>Physical NACH (3–5 days)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2 rounded-md bg-[var(--arn-grn-bg)] px-3 py-2 text-[11px] text-[var(--arn-grn-txt)]">
              <CheckIcon className="w-4 h-4 flex-shrink-0" />
              Client gets SMS + WhatsApp confirmation once SIP activates.
            </div>
          </div>
        );
      case 5:
        return (
          <div className="card text-center p-8">
            <div className="w-12 h-12 rounded-full bg-[var(--arn-grn-bg)] flex items-center justify-center mx-auto mb-3">
              <CheckIcon className="w-6 h-6 text-[var(--arn-grn-txt)]" />
            </div>
            <div className="text-sm font-bold text-[var(--arn-txt)] mb-1.5">Client onboarded successfully</div>
            <div className="text-xs text-[var(--arn-txt-2)] mb-4.5">Mohit Verma is now live. SIP starts 5 Jul 2026.</div>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={onBack} // This will be used to navigate to clients page, will be adjusted in ArnOnboardPage
                className="bg-[var(--arn-bg-2)] text-[var(--arn-txt-2)] font-bold py-1.5 px-3 rounded-md border border-[var(--arn-bdr)] transition-colors hover:bg-[var(--arn-bg-3)]"
              >
                View in clients
              </button>
              <button
                type="button"
                onClick={onReset}
                className="bg-[var(--arn-amber)] text-white font-bold py-1.5 px-3 rounded-md border border-transparent transition-colors hover:opacity-90"
              >
                Onboard another
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderStepContent()}
      {currentStep < 5 && (
        <div className="flex gap-2 mt-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={onBack}
              className="bg-[var(--arn-bg-2)] text-[var(--arn-txt-2)] font-bold py-1.5 px-3 rounded-md border border-[var(--arn-bdr)] transition-colors hover:bg-[var(--arn-bg-3)]"
            >
              ← Back
            </button>
          )}
          {currentStep < 4 && (
            <button
              type="button"
              onClick={onNext}
              className="bg-[var(--arn-amber)] text-white font-bold py-1.5 px-3 rounded-md border border-transparent transition-colors hover:opacity-90"
            >
              Continue →
            </button>
          )}
          {currentStep === 4 && (
            <button
              type="button"
              onClick={onDone}
              className="bg-[var(--arn-amber)] text-white font-bold py-1.5 px-3 rounded-md border border-transparent transition-colors hover:opacity-90"
            >
              Activate SIP & finish
            </button>
          )}
        </div>
      )}
    </>
  );
}