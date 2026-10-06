"use client";

import { useEffect, useRef, useState } from "react";
import {
  getModifyForm,
  getModifyFormCurrent,
  getPincodeDetails,
  isUnauthorizedError,
  retryModifyProofFetch,
  updateModifyForm,
  uploadModifySignature,
  type ModifyKycForm,
  type UpdateModifyFormDto,
} from "@/services/arnKycService";
import {
  createModifyKycForm,
  getUserStage,
  loadModifyKycDetails,
  type UserStage,
} from "@/services/arnOnboardService";
import {
  GENDER_OPTIONS,
  INCOME_SLAB_OPTIONS,
  MARITAL_OPTIONS,
  MODIFY_OCCUPATION_OPTIONS,
  SOURCE_OF_WEALTH_OPTIONS,
} from "@/components/onboard/onboardPhases";
import ArnSignaturePad, {
  type ArnSignaturePadHandle,
} from "@/components/onboard/ArnSignaturePad";
import {
  isModifyEsignCallback,
  isModifyProofCallback,
  openKycPopup,
  wait,
  waitForModifyPopup,
} from "@/utils/kycPopup";
import { toTitleCaseName } from "@/utils/kycStage";

type WizardStep =
  | "loading"
  | "proof"
  | "questions"
  | "signature"
  | "esign"
  | "underReview"
  | "done";

interface ModifyKycWizardProps {
  userStage?: UserStage | null;
  introMessage?: string | null;
  onStageChange?: (stage: UserStage) => void;
  onComplete: (stage: UserStage) => void;
  onCompleteLater?: () => void;
  onUnauthorized: () => void;
}

const MODIFY_GEOLOCATION = { latitude: 9.354, longitude: 77.453 };
const SIGNATURE_MAX_BYTES = 5 * 1024 * 1024;

function formMessage(form: ModifyKycForm | null, fallback: string): string {
  return form?.reason || form?.message || fallback;
}

function isEsignAccepted(form: ModifyKycForm | null): boolean {
  if (!form) return false;
  const esignStatus = form.esign_details?.status?.toLowerCase() ?? "";
  const status = form.status?.toLowerCase() ?? "";
  return (
    esignStatus === "successful" ||
    esignStatus === "success" ||
    status === "submitted" ||
    status === "awaiting_submission"
  );
}

function isProofFetched(form: ModifyKycForm | null): boolean {
  const status = form?.proof_details?.status?.toLowerCase() ?? "";
  return status === "fetched" || status === "successful" || status === "success";
}

function isProofFailed(form: ModifyKycForm | null): boolean {
  return form?.proof_details?.status?.toLowerCase() === "failed";
}

function isEsignFailed(form: ModifyKycForm | null): boolean {
  if (!form) return false;
  const status = form.status?.toLowerCase() ?? "";
  const esign = form.esign_details?.status?.toLowerCase() ?? "";
  return (
    status === "failed" ||
    status === "expired" ||
    esign === "failed" ||
    esign === "expired" ||
    esign === "rejected"
  );
}

function hasEsignUrl(form: ModifyKycForm | null): boolean {
  const url = form?.esign_details?.esign_url;
  return typeof url === "string" && url.length > 0;
}

function isEsignReady(form: ModifyKycForm | null): boolean {
  if (!form) return false;
  if (isEsignAccepted(form)) return true;
  return form.status === "awaiting_esign" && hasEsignUrl(form);
}

export default function ModifyKycWizard({
  userStage,
  introMessage,
  onStageChange,
  onComplete,
  onCompleteLater,
  onUnauthorized,
}: ModifyKycWizardProps) {
  const signatureRef = useRef<ArnSignaturePadHandle | null>(null);
  const [step, setStep] = useState<WizardStep>("loading");
  const [form, setForm] = useState<ModifyKycForm | null>(null);
  const [stage, setStage] = useState<UserStage | null>(userStage ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("Please wait...");
  const [proofRetry, setProofRetry] = useState(false);
  const [esignPending, setEsignPending] = useState(false);

  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [incomeSlab, setIncomeSlab] = useState("");
  const [occupationType, setOccupationType] = useState("");
  const [sourceOfWealth, setSourceOfWealth] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [pepChecked, setPepChecked] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  const handleError = (err: unknown, fallback: string) => {
    if (isUnauthorizedError(err)) {
      onUnauthorized();
      return;
    }
    const message = err instanceof Error ? err.message : fallback;
    const lower = message.toLowerCase();
    if (lower.includes("internal server error") || (err && typeof err === "object" && "statusCode" in err && Number((err as { statusCode?: number }).statusCode) === 500)) {
      setError("Something went wrong on our side. Please try again in a moment.");
      return;
    }
    setError(message || fallback);
  };

  const reloadStage = async (): Promise<UserStage> => {
    const next = await getUserStage();
    setStage(next);
    onStageChange?.(next);
    return next;
  };

  const routeFrom = (nextStage: UserStage, nextForm: ModifyKycForm | null) => {
    if (
      nextStage.ismodifydigilocker === true &&
      nextStage.ismodifyquestions === true &&
      nextStage.ismodifyesign === true &&
      nextStage.ismodifynsdl === true
    ) {
      if (nextStage.isKycCompliant === true) {
        setStep("done");
        onComplete(nextStage);
        return;
      }
      setStep("underReview");
      return;
    }

    if (nextForm?.status === "expired") {
      setError("Session expired. Please start again.");
      setStep("proof");
      return;
    }
    if (nextForm?.status === "failed") {
      setError(formMessage(nextForm, "KYC update failed. Please try again."));
    }

    if (nextStage.ismodifydigilocker !== true) {
      setStep("proof");
      return;
    }
    if (nextStage.ismodifyquestions !== true) {
      setStep("questions");
      return;
    }
    if (nextForm?.status === "awaiting_esign" || nextStage.ismodifyesign === true) {
      setStep(nextForm?.signature_provided ? "esign" : "signature");
      return;
    }
    setStep("signature");
  };

  const ensureForm = async (): Promise<ModifyKycForm | null> => {
    let current = await getModifyFormCurrent();
    if (current?.id) {
      setForm(current);
      return current;
    }

    const details = loadModifyKycDetails();
    if (!details) {
      setError("No active KYC form found. Please restart Modify KYC from PAN verification.");
      return null;
    }

    const created = await createModifyKycForm(details);
    if (created.id) {
      current = await pollUntilCreated(created.id, created.status);
      setForm(current);
      return current;
    }

    current = await getModifyFormCurrent();
    setForm(current);
    return current;
  };

  const pollUntilCreated = async (
    id: string,
    initialStatus: string | null
  ): Promise<ModifyKycForm | null> => {
    let current =
      initialStatus && initialStatus !== "under_review"
        ? await getModifyForm(id)
        : { id, status: initialStatus } as ModifyKycForm;

    if (current.status && current.status !== "under_review") {
      return getModifyForm(id);
    }

    for (let i = 0; i < 30; i += 1) {
      await wait(2000);
      current = await getModifyForm(id);
      if (current.status === "created" || current.status === "failed") {
        return current;
      }
    }
    setError("KYC update is taking longer than expected. Please try again.");
    return current;
  };

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      setBusy(true);
      setBusyLabel("Loading KYC update...");
      try {
        const nextStage = await reloadStage();
        const nextForm = await ensureForm();
        if (cancelled) return;
        if (nextForm?.status === "under_review" && nextForm.id) {
          const polled = await pollUntilCreated(nextForm.id, nextForm.status);
          if (cancelled) return;
          setForm(polled);
          routeFrom(await reloadStage(), polled);
          return;
        }
        routeFrom(nextStage, nextForm);
      } catch (err) {
        if (!cancelled) {
          handleError(err, "Failed to load Modify KYC. Please try again.");
          setStep("proof");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeError(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const details = await getPincodeDetails(pincode);
        if (cancelled) return;
        setCity(details.city);
        setStateName(details.state);
        setPincodeError(null);
      } catch (err) {
        if (!cancelled) {
          setPincodeError(
            err instanceof Error
              ? err.message
              : "Could not find city and state for this pincode."
          );
        }
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pincode]);

  const finishProof = async (current: ModifyKycForm | null) => {
    setForm(current);
    if (isProofFailed(current)) {
      setError("Proof fetch failed. You can retry DigiLocker.");
      setProofRetry(true);
      return;
    }
    if (!isProofFetched(current)) {
      setError(
        "Aadhaar verification is still pending. Continue to complete DigiLocker."
      );
      setProofRetry(true);
      return;
    }

    setBusyLabel("Fetching DigiLocker status...");
    let nextStage = await reloadStage();
    for (let i = 0; i < 10 && nextStage.ismodifydigilocker !== true; i += 1) {
      await wait(2000);
      nextStage = await reloadStage();
    }
    if (nextStage.ismodifydigilocker === true) {
      routeFrom(nextStage, current);
      return;
    }
    setProofRetry(true);
  };

  const openProof = async (url?: string | null, retryFailed = false) => {
    setBusy(true);
    setBusyLabel("Opening DigiLocker...");
    setError(null);
    setProofRetry(false);

    try {
      let current = form ?? (await ensureForm());
      if (!current?.id) {
        setError("No active KYC form found.");
        setProofRetry(true);
        return;
      }

      if (current.status === "under_review") {
        current = await pollUntilCreated(current.id, current.status);
        setForm(current);
      }

      if (current?.status === "failed") {
        setError(formMessage(current, "KYC update failed. Please try again."));
        setProofRetry(true);
        return;
      }
      if (current?.status === "expired") {
        setError("Session expired. Please start again.");
        setProofRetry(true);
        return;
      }

      if (!current?.id) {
        setError("No active KYC form found.");
        setProofRetry(true);
        return;
      }

      if (!retryFailed && isProofFetched(current)) {
        setBusyLabel("Fetching DigiLocker status...");
        await finishProof(current);
        return;
      }

      if (retryFailed || isProofFailed(current)) {
        current = await retryModifyProofFetch(current.id);
        setForm(current);
      }

      const fetchUrl = url || current?.proof_details?.fetch_url;
      if (!fetchUrl) {
        if (isProofFetched(current)) {
          await finishProof(current);
          return;
        }
        setError("Proof fetch failed. You can retry DigiLocker.");
        setProofRetry(true);
        return;
      }

      const popup = openKycPopup(fetchUrl);
      if (!popup) {
        setError("Could not open DigiLocker. Please allow pop-ups and retry.");
        setProofRetry(true);
        return;
      }

      const fetched: { form: ModifyKycForm | null } = { form: current };
      const waitReason = await waitForModifyPopup(popup, {
        isComplete: isModifyProofCallback,
        pollEveryMs: 5000,
        pollComplete: async () => {
          const latest = await getModifyFormCurrent();
          fetched.form = latest ?? fetched.form;
          if (latest) setForm(latest);
          return isProofFetched(latest) || isProofFailed(latest);
        },
      });

      setBusyLabel("Fetching DigiLocker status...");
      let refreshed = fetched.form;
      const alreadyTerminal =
        waitReason === "server" &&
        (isProofFetched(refreshed) || isProofFailed(refreshed));
      if (!alreadyTerminal) {
        refreshed = (await getModifyFormCurrent()) ?? refreshed;
      }

      await finishProof(refreshed);
    } catch (err) {
      handleError(err, "Failed to start DigiLocker. Please try again.");
      setProofRetry(true);
    } finally {
      setBusy(false);
    }
  };

  const handleQuestionsSubmit = async () => {
    if (!form?.id) {
      setError("No active KYC form found.");
      return;
    }
    if (stage?.ismodifydigilocker !== true) {
      setError("Aadhaar verification is still pending. Continue to complete DigiLocker.");
      setStep("proof");
      setProofRetry(true);
      return;
    }

    setBusy(true);
    setBusyLabel("Saving details...");
    setError(null);

    try {
      const dto: UpdateModifyFormDto = {
        father_name: toTitleCaseName(fatherName),
        gender: gender as UpdateModifyFormDto["gender"],
        marital_status: maritalStatus as UpdateModifyFormDto["marital_status"],
        income_slab: incomeSlab,
        occupation_type: occupationType,
        source_of_wealth: sourceOfWealth,
        geolocation: MODIFY_GEOLOCATION,
        pep_details: "no_exposure",
        address: {
          line_1: line1.trim(),
          line_2: line2.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
        },
        residential_status: "resident",
        country_of_birth: "in",
        place_of_birth: "in",
        citizenship_countries: ["in"],
        nationality_country: "in",
        tax_residency_other_than_india: false,
      };
      if (maritalStatus === "married" && spouseName.trim()) {
        dto.spouse_name = toTitleCaseName(spouseName);
      }
      const updated = await updateModifyForm(form.id, dto);
      setForm(updated);
      const nextStage = await reloadStage();
      routeFrom(nextStage, updated);
    } catch (err) {
      handleError(err, "Failed to save KYC details. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const pollUntilEsignReady = async (
    start: ModifyKycForm | null
  ): Promise<ModifyKycForm | null> => {
    let latest = start;
    for (let i = 0; i < 30; i += 1) {
      if (latest && (isEsignReady(latest) || isEsignFailed(latest))) {
        return latest;
      }
      if (latest?.status === "expired") return latest;
      await wait(2000);
      latest = (await getModifyFormCurrent()) ?? latest;
      setForm(latest);
    }
    return latest;
  };

  const startEsign = async (existing?: ModifyKycForm | null) => {
    setBusy(true);
    setBusyLabel("Preparing e-sign...");
    setError(null);
    setEsignPending(false);

    try {
      let current = existing ?? (await getModifyFormCurrent());
      setForm(current);

      if (!current) {
        setError("KYC form not ready. Please restart modify KYC from the beginning.");
        setEsignPending(true);
        return;
      }
      if (current.status === "expired") {
        setError("Session expired. Please start again.");
        return;
      }
      if (isEsignFailed(current)) {
        setError(formMessage(current, "E-sign could not be completed."));
        setEsignPending(true);
        return;
      }

      if (!isEsignReady(current)) {
        current = await pollUntilEsignReady(current);
        setForm(current);
      }

      if (!current) {
        setError("KYC form not ready. Please restart modify KYC from the beginning.");
        setEsignPending(true);
        return;
      }
      if (current.status === "expired") {
        setError("Session expired. Please start again.");
        return;
      }
      if (isEsignFailed(current)) {
        setError(formMessage(current, "E-sign could not be completed."));
        setEsignPending(true);
        return;
      }

      if (isEsignAccepted(current)) {
        if (
          current.status === "awaiting_submission" ||
          current.status === "submitted"
        ) {
          const submitted = await pollUntilSubmitted(current);
          if (!submitted) return;
          current = submitted;
        }
        const nextStage = await pollStageUntilNsdl();
        if (nextStage.ismodifynsdl === true) {
          routeFrom(nextStage, current);
          return;
        }
        setEsignPending(true);
        setStep("esign");
        return;
      }

      const esignUrl = current.esign_details?.esign_url;
      if (!esignUrl) {
        setError("E-sign link not ready. Please try again later.");
        setEsignPending(true);
        setStep("esign");
        return;
      }

      setBusyLabel("Opening e-sign...");
      setStep("esign");
      const popup = openKycPopup(esignUrl);
      if (!popup) {
        setError("Could not open e-sign. Please allow pop-ups and retry.");
        setEsignPending(true);
        return;
      }

      const fetched: { form: ModifyKycForm | null } = { form: current };
      const waitReason = await waitForModifyPopup(popup, {
        isComplete: isModifyEsignCallback,
        pollEveryMs: 5000,
        pollComplete: async () => {
          const latest = await getModifyFormCurrent();
          fetched.form = latest ?? fetched.form;
          if (latest) setForm(latest);
          return isEsignAccepted(latest) || isEsignFailed(latest);
        },
      });

      setBusyLabel("Fetching e-sign status...");
      let refreshed = fetched.form;
      const alreadyTerminal =
        waitReason === "server" &&
        (isEsignAccepted(refreshed) || isEsignFailed(refreshed));
      if (!alreadyTerminal) {
        await wait(2000);
        refreshed = (await getModifyFormCurrent()) ?? refreshed;
        setForm(refreshed);
      }

      if (isEsignFailed(refreshed)) {
        setError(formMessage(refreshed, "E-sign could not be completed."));
        setEsignPending(true);
        setStep("esign");
        return;
      }

      if (!isEsignAccepted(refreshed)) {
        setError("E-Sign is still pending. Continue to complete Aadhaar eSign.");
        setEsignPending(true);
        setStep("esign");
        return;
      }

      current = refreshed;
      if (
        current?.status === "awaiting_submission" ||
        current?.status === "submitted"
      ) {
        const submitted = await pollUntilSubmitted(current);
        if (!submitted) return;
        current = submitted;
      }

      const nextStage = await pollStageUntilNsdl();
      if (nextStage.ismodifynsdl === true) {
        routeFrom(nextStage, current);
        return;
      }
      setEsignPending(true);
      setStep("esign");
    } catch (err) {
      handleError(err, "Failed to complete e-sign. Please try again.");
      setEsignPending(true);
    } finally {
      setBusy(false);
    }
  };

  const pollUntilSubmitted = async (
    current: ModifyKycForm
  ): Promise<ModifyKycForm | null> => {
    let latest = current;
    for (let i = 0; i < 45; i += 1) {
      if (
        latest.status === "submitted" ||
        latest.status === "failed" ||
        latest.status === "expired"
      ) {
        break;
      }
      await wait(2000);
      latest = (await getModifyFormCurrent()) ?? latest;
      setForm(latest);
      const nextStage = await reloadStage();
      if (nextStage.ismodifynsdl === true) return latest;
    }

    if (latest.status === "failed") {
      setError(formMessage(latest, "E-sign could not be completed."));
      return null;
    }
    if (latest.status === "expired") {
      setError("Session expired. Please start again.");
      return null;
    }
    if (latest.status !== "submitted" && latest.status === "awaiting_submission") {
      setError("Submission is taking longer than expected. Please try again.");
      setEsignPending(true);
      return null;
    }
    return latest;
  };

  const pollStageUntilNsdl = async (): Promise<UserStage> => {
    let next = await reloadStage();
    for (let i = 0; i < 10 && next.ismodifynsdl !== true; i += 1) {
      await wait(2000);
      next = await reloadStage();
    }
    return next;
  };

  const handleSignatureSubmit = async () => {
    if (!form?.id) {
      setError("KYC form not ready. Please restart modify KYC from the beginning.");
      return;
    }

    setBusy(true);
    setBusyLabel("Uploading signature...");
    setError(null);

    try {
      let current = form;
      if (current.signature_provided) {
        setStep("esign");
        await startEsign(current);
        return;
      }

      const file = await signatureRef.current?.toPngFile();
      if (!file) {
        setError("Please draw the signature before continuing.");
        setBusy(false);
        return;
      }
      if (file.size > SIGNATURE_MAX_BYTES) {
        setError("Signature image must be under 5 MB.");
        setBusy(false);
        return;
      }

      try {
        current = await uploadModifySignature(form.id, file);
        setForm(current);
      } catch (err) {
        const message = err instanceof Error ? err.message.toLowerCase() : "";
        if (message.includes("limit") || message.includes("not allowed")) {
          const refreshed = await getModifyFormCurrent();
          setForm(refreshed);
          setStep("esign");
          await startEsign(refreshed);
          return;
        }
        throw err;
      }

      setStep("esign");
      await startEsign(current);
    } catch (err) {
      handleError(err, "Failed to upload signature. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const questionsValid =
    fatherName.trim().length > 0 &&
    gender !== "" &&
    maritalStatus !== "" &&
    incomeSlab !== "" &&
    occupationType !== "" &&
    sourceOfWealth !== "" &&
    line1.trim().length > 0 &&
    line2.trim().length > 0 &&
    city.trim().length > 0 &&
    stateName.trim().length > 0 &&
    /^\d{6}$/.test(pincode) &&
    pepChecked &&
    (maritalStatus !== "married" || spouseName.trim().length > 0);

  const checklist = [
    { label: "PAN", done: stage?.isPan === true && stage?.isDob === true },
    { label: "Personal details", done: stage?.ismodifyquestions === true },
    { label: "DigiLocker", done: stage?.ismodifydigilocker === true },
    { label: "NSDL / Aadhaar e-sign", done: stage?.ismodifynsdl === true },
  ];

  return (
    <div className="step-panel">
      <p className="step-eyebrow" style={{ textAlign: "center" }}>
        Identity Verification
      </p>
      <h2 className="step-title" style={{ textAlign: "center" }}>
        Update KYC
      </h2>
      {introMessage && step === "proof" && (
        <p className="step-helper" style={{ textAlign: "center" }}>
          {introMessage}
        </p>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2">
        {checklist.map((item) => (
          <div
            key={item.label}
            className="rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-3 py-2 text-xs"
          >
            <span className={item.done ? "text-[var(--arn-amber-txt)]" : "text-[var(--arn-txt-3)]"}>
              {item.done ? "●" : "○"} {item.label}
            </span>
          </div>
        ))}
      </div>

      {step === "loading" && (
        <p className="step-helper" style={{ textAlign: "center" }}>
          {busyLabel}
        </p>
      )}

      {step === "underReview" && (
        <div className="glass-card rounded-[10px] border border-[var(--arn-amber)] bg-[var(--arn-amber-sel-bg)]" style={{ textAlign: "center", padding: "34px 26px" }}>
          <div className="card-title" style={{ textAlign: "center" }}>
            KYC update submitted
          </div>
          <div className="card-sub" style={{ textAlign: "center" }}>
            Your KYC update has been submitted and is under review.
          </div>
        </div>
      )}

      {step === "proof" && (
        <>
          <p className="step-helper">
            Complete DigiLocker to fetch proof details. If you close the window
            early, tap Continue DigiLocker.
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
            onClick={() =>
              openProof(undefined, Boolean(form?.proof_details?.status === "failed"))
            }
          >
            {busy ? busyLabel : proofRetry ? "Continue DigiLocker" : "Open DigiLocker"}
          </button>
        </>
      )}

      {step === "questions" && (
        <>
          <p className="step-helper">
            Provide personal, financial, and address details to continue the KYC update.
          </p>
          <div className="field-group">
            <label className="field-label">
              Father&apos;s Name <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value.replace(/\d/g, ""))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field-group">
              <label className="field-label">Gender</label>
              <select className="field-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Marital Status</label>
              <select className="field-select" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
                <option value="">Select marital status</option>
                {MARITAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {maritalStatus === "married" && (
              <div className="field-group">
                <label className="field-label">Spouse Name</label>
                <input
                  className="field-input"
                  value={spouseName}
                  onChange={(e) => setSpouseName(e.target.value.replace(/\d/g, ""))}
                />
              </div>
            )}
            <div className="field-group">
              <label className="field-label">Income Slab</label>
              <select className="field-select" value={incomeSlab} onChange={(e) => setIncomeSlab(e.target.value)}>
                <option value="">Select income slab</option>
                {INCOME_SLAB_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Occupation</label>
              <select className="field-select" value={occupationType} onChange={(e) => setOccupationType(e.target.value)}>
                <option value="">Select occupation</option>
                {MODIFY_OCCUPATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Source of Wealth</label>
              <select className="field-select" value={sourceOfWealth} onChange={(e) => setSourceOfWealth(e.target.value)}>
                <option value="">Select source of wealth</option>
                {SOURCE_OF_WEALTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="onboard-section-label">Address</div>
          <div className="field-group">
            <label className="field-label">Address line 1</label>
            <input className="field-input" value={line1} onChange={(e) => setLine1(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Address line 2</label>
            <input className="field-input" value={line2} onChange={(e) => setLine2(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field-group">
              <label className="field-label">Pincode</label>
              <input
                className="field-input"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              {pincodeError && <p className="text-xs text-[var(--arn-red)] mt-1">{pincodeError}</p>}
            </div>
            <div className="field-group">
              <label className="field-label">City</label>
              <input className="field-input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">State</label>
              <input className="field-input" value={stateName} onChange={(e) => setStateName(e.target.value)} />
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
            className="btn-primary btn-wide"
            style={{ marginTop: 8 }}
            disabled={!questionsValid || busy}
            onClick={handleQuestionsSubmit}
          >
            {busy ? busyLabel : "Save and Continue"}
          </button>
        </>
      )}

      {step === "signature" && (
        <>
          <p className="step-helper">
            Draw the signature that will be uploaded to the KYC form. Maximum size 5 MB.
          </p>
          <ArnSignaturePad ref={signatureRef} />
          {error && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {error}
            </div>
          )}
          <button
            type="button"
            className="btn-primary btn-wide"
            style={{ marginTop: 16 }}
            disabled={busy}
            onClick={handleSignatureSubmit}
          >
            {busy ? busyLabel : "Continue to e-sign"}
          </button>
        </>
      )}

      {step === "esign" && (
        <>
          <p className="step-helper">
            Complete Aadhaar e-sign in the window that opens. Stay on intermediate
            OTP pages until you return here.
          </p>
          {error && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {error}
            </div>
          )}
          {esignPending && (
            <div className="glass-card rounded-[10px] border border-[var(--arn-bdr)] p-4 mb-4">
              <div className="card-title">E-Sign Pending</div>
              <div className="card-sub">
                E-sign is not confirmed yet. Complete it now, or come back later.
              </div>
            </div>
          )}
          <button
            type="button"
            className="btn-primary btn-wide"
            disabled={busy}
            onClick={() => startEsign()}
          >
            {busy ? busyLabel : esignPending ? "Complete Now" : "Continue eSign"}
          </button>
          {esignPending && onCompleteLater && (
            <button
              type="button"
              className="btn-primary btn-wide"
              style={{ marginTop: 10, opacity: 0.85 }}
              onClick={onCompleteLater}
            >
              Complete Later
            </button>
          )}
        </>
      )}
    </div>
  );
}
