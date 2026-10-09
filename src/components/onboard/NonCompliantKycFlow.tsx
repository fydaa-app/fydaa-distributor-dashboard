"use client";

import { useEffect, useRef, useState } from "react";
import {
  createIdentityDocument,
  getIdentityDocument,
  isIdentityFailureStatus,
  isIdentitySuccessStatus,
  isUnauthorizedError,
  updateKycRequest,
  type IdentityDocumentResult,
  type UpdateKycRequestPayload,
} from "@/services/arnKycService";
import {
  createInvestorProfileAndMfAccount,
  getClientIp,
} from "@/services/arnInvestmentSetupService";
import { getUserStage, type UserStage } from "@/services/arnOnboardService";
import {
  GENDER_OPTIONS,
  INCOME_SLAB_OPTIONS,
  MARITAL_OPTIONS,
  NON_COMPLIANT_OCCUPATION_OPTIONS,
  SOURCE_OF_WEALTH_OPTIONS,
  type OnboardPhase,
} from "@/components/onboard/onboardPhases";
import InvestorEsignWait from "@/components/onboard/InvestorEsignWait";
import {
  openKycPopup,
  wait,
  waitForDigilockerPopup,
} from "@/utils/kycPopup";
import { toTitleCaseName } from "@/utils/kycStage";

interface NonCompliantKycFlowProps {
  phase: OnboardPhase;
  userStage?: UserStage | null;
  onGoToQuestions: () => void;
  onGoToDigilocker: () => void;
  onGoToSignature?: () => void;
  onGoToNsdl: () => void;
  onComplete: () => void;
  onStageChange?: (stage: UserStage) => void;
  onUnauthorized: () => void;
}

function roundCoord(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

async function readDeviceGeolocation(): Promise<{
  latitude: number;
  longitude: number;
}> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error(
      "Location services are unavailable. Please enable location and try again."
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: roundCoord(position.coords.latitude),
          longitude: roundCoord(position.coords.longitude),
        });
      },
      () => {
        reject(
          new Error(
            "Location permission is required. Please enable location services and try again."
          )
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  });
}

export default function NonCompliantKycFlow({
  phase,
  onGoToQuestions,
  onGoToDigilocker,
  onGoToNsdl,
  onComplete,
  onStageChange,
  onUnauthorized,
}: NonCompliantKycFlowProps) {
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [incomeSlab, setIncomeSlab] = useState("");
  const [occupationType, setOccupationType] = useState("");
  const [sourceOfWealth, setSourceOfWealth] = useState("");
  const [pepChecked, setPepChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("Please wait...");
  const [digiRetry, setDigiRetry] = useState(false);
  const [esignDone, setEsignDone] = useState(false);
  const autoStartedDigiRef = useRef(false);

  const handleError = (err: unknown, fallback: string) => {
    if (isUnauthorizedError(err)) {
      onUnauthorized();
      return;
    }
    setError(err instanceof Error ? err.message : fallback);
  };

  const reloadStage = async (): Promise<UserStage> => {
    const stage = await getUserStage();
    onStageChange?.(stage);
    return stage;
  };

  const handleQuestionsSubmit = async () => {
    if (
      !fatherName.trim() ||
      !gender ||
      !maritalStatus ||
      !incomeSlab ||
      !occupationType ||
      !sourceOfWealth ||
      !pepChecked
    ) {
      return;
    }

    setBusy(true);
    setBusyLabel("Saving details...");
    setError(null);

    try {
      const geolocation = await readDeviceGeolocation();
      const payload: UpdateKycRequestPayload = {
        father_name: toTitleCaseName(fatherName),
        gender: gender as UpdateKycRequestPayload["gender"],
        marital_status: maritalStatus as UpdateKycRequestPayload["marital_status"],
        income_slab: incomeSlab,
        occupation_type: occupationType,
        source_of_wealth: sourceOfWealth,
        geolocation,
        pep_details: "not_applicable",
      };
      await updateKycRequest(payload);
      setBusyLabel("Preparing documents");
      await wait(600);
      await reloadStage();
      onGoToDigilocker();
    } catch (err) {
      handleError(err, "Failed to save KYC details. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const fetchIdentityUntilTerminal = async (): Promise<IdentityDocumentResult> => {
    const maxAttempts = 48;
    let last: IdentityDocumentResult | null = null;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (attempt > 0) await wait(5000);
      last = await getIdentityDocument();
      if (isIdentitySuccessStatus(last.fetch.status)) return last;
      if (isIdentityFailureStatus(last.fetch.status)) return last;
    }
    return last as IdentityDocumentResult;
  };

  const startDigilocker = async () => {
    setBusy(true);
    setBusyLabel("Opening DigiLocker...");
    setError(null);
    setDigiRetry(false);

    try {
      const created = await createIdentityDocument();

      const redirectUrl = created.fetch.redirect_url;
      if (!redirectUrl) {
        setError("Session expired. Please retry DigiLocker.");
        setDigiRetry(true);
        return;
      }

      const popup = openKycPopup(redirectUrl);
      if (!popup) {
        setError("Could not open DigiLocker. Please allow pop-ups and retry.");
        setDigiRetry(true);
        return;
      }

      setBusyLabel("Waiting for DigiLocker...");
      const fetched: { result: IdentityDocumentResult | null } = { result: null };
      const waitReason = await waitForDigilockerPopup(popup, {
        pollEveryMs: 5000,
        pollComplete: async () => {
          fetched.result = await getIdentityDocument();
          const status = fetched.result.fetch.status;
          return (
            isIdentitySuccessStatus(status) || isIdentityFailureStatus(status)
          );
        },
      });

      const current = fetched.result;
      const alreadyTerminal =
        waitReason === "server" &&
        !!current &&
        (isIdentitySuccessStatus(current.fetch.status) ||
          isIdentityFailureStatus(current.fetch.status));

      let result: IdentityDocumentResult | null = current;
      if (!alreadyTerminal) {
        setBusyLabel("Fetching DigiLocker status...");
        result = await fetchIdentityUntilTerminal();
      }

      if (!result) {
        setError("Failed to check DigiLocker status. Please try again.");
        setDigiRetry(true);
        return;
      }

      if (isIdentitySuccessStatus(result.fetch.status)) {
        await reloadStage();
        onGoToNsdl();
        return;
      }

      if (isIdentityFailureStatus(result.fetch.status)) {
        setError(
          result.fetch.reason ||
            "DigiLocker verification failed. Please try again."
        );
        setDigiRetry(true);
        return;
      }

      setError("Aadhaar verification is still pending. Continue to complete DigiLocker.");
      setDigiRetry(true);
    } catch (err) {
      handleError(err, "Failed to start DigiLocker. Please try again.");
      setDigiRetry(true);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (phase !== "digilocker" || autoStartedDigiRef.current) return;
    autoStartedDigiRef.current = true;
    void startDigilocker();
    // Auto-open DigiLocker once after the questions step advances here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const pollStageUntilNsdl = async (): Promise<UserStage> => {
    let stage = await reloadStage();
    for (let i = 0; i < 4 && stage.isNSDL !== true; i += 1) {
      await wait(2000);
      stage = await reloadStage();
    }
    return stage;
  };

  const finishAfterEsign = async () => {
    setEsignDone(true);
    setBusy(true);
    setBusyLabel("Creating investor profile...");
    setError(null);

    try {
      const ipAddress = await getClientIp();
      await createInvestorProfileAndMfAccount({ ipAddress });
      const stage = await pollStageUntilNsdl();
      if (stage.isNSDL === true) {
        onComplete();
        return;
      }
      setError("E-sign is confirmed. Continue to finish account setup.");
    } catch (err) {
      handleError(err, "Failed to create investor profile. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (phase === "nonCompliantQuestions") {
    const valid =
      fatherName.trim().length > 0 &&
      gender !== "" &&
      maritalStatus !== "" &&
      incomeSlab !== "" &&
      occupationType !== "" &&
      sourceOfWealth !== "" &&
      pepChecked;

    return (
      <div className="step-panel">
        <p className="step-eyebrow">Identity Verification</p>
        <h2 className="step-title">Answer the following questions</h2>
        <p className="step-helper">
          These details are required to start a fresh KYC. Location access must
          stay enabled to continue.
        </p>

        <div className="field-group">
          <label className="field-label">
            Father&apos;s Name <span className="req">Required</span>
          </label>
          <input
            className="field-input"
            placeholder="Enter father's name"
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value.replace(/\d/g, ""))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="field-group">
            <label className="field-label">Gender</label>
            <select
              className="field-select"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((opt) => (
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
              <option value="">Select marital status</option>
              {MARITAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Income Slab</label>
            <select
              className="field-select"
              value={incomeSlab}
              onChange={(e) => setIncomeSlab(e.target.value)}
            >
              <option value="">Select income slab</option>
              {INCOME_SLAB_OPTIONS.map((opt) => (
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
              <option value="">Select occupation</option>
              {NON_COMPLIANT_OCCUPATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Source of Wealth</label>
            <select
              className="field-select"
              value={sourceOfWealth}
              onChange={(e) => setSourceOfWealth(e.target.value)}
            >
              <option value="">Select source of wealth</option>
              {SOURCE_OF_WEALTH_OPTIONS.map((opt) => (
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
          <span>I am not a politically exposed person</span>
        </label>

        {error && (
          <div className="field-error justify-center">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleQuestionsSubmit}
          disabled={!valid || busy}
          className="btn-primary btn-wide"
          style={{ marginTop: 8 }}
        >
          {busy ? busyLabel : "Save and Continue"}
        </button>
      </div>
    );
  }

  if (phase === "digilocker") {
    return (
      <div className="step-panel">
        <div className="flex justify-center mb-5">
          <div className="back-btn" onClick={onGoToQuestions} role="button" tabIndex={0}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </div>
        </div>
        <p className="step-eyebrow">Identity Verification</p>
        <h2 className="step-title">Verify with DigiLocker</h2>
        <p className="step-helper">
          Aadhaar will be fetched from DigiLocker. Keep the window open until
          verification finishes.
        </p>
        {error && (
          <div className="field-error justify-center">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            {error}
          </div>
        )}
        <button
          type="button"
          className="btn-primary btn-wide"
          disabled={busy}
          onClick={() => startDigilocker()}
        >
          {busy
            ? busyLabel
            : digiRetry
              ? "Retry DigiLocker"
              : "Continue DigiLocker"}
        </button>
      </div>
    );
  }

  return (
    <div className="step-panel">
      <div className="flex justify-center mb-5">
        <div className="back-btn" onClick={onGoToDigilocker} role="button" tabIndex={0}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
        </div>
      </div>
      <p className="step-eyebrow">Identity Verification</p>
      <h2 className="step-title">Aadhaar e-sign</h2>
      {esignDone ? (
        <>
          <p className="step-helper">
            Investor e-sign is complete. Continue to create the investment
            account.
          </p>
          {error && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {error}
            </div>
          )}
          <button
            type="button"
            className="btn-primary btn-wide"
            disabled={busy}
            onClick={finishAfterEsign}
          >
            {busy ? busyLabel : "Continue"}
          </button>
        </>
      ) : (
        <>
          {error && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {error}
            </div>
          )}
          <InvestorEsignWait
            onCompleted={finishAfterEsign}
            onUnauthorized={onUnauthorized}
            completing={busy}
            completingLabel={busyLabel}
            flow="non_compliant"
          />
        </>
      )}
    </div>
  );
}
