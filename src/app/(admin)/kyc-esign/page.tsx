"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ArnLoadingState from "@/components/common/ArnLoadingState";
import ArnSignaturePad, {
  type ArnSignaturePadHandle,
} from "@/components/onboard/ArnSignaturePad";
import {
  ESIGN_REQUEST_COPY,
  KycApiError,
  getEsignRequestByToken,
  uploadEsignRequestSignature,
} from "@/services/arnKycService";

function KycEsignRedirectInner() {
  const searchParams = useSearchParams();
  const signatureRef = useRef<ArnSignaturePadHandle | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [needsSignature, setNeedsSignature] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = searchParams.get("token")?.trim() || "";

  useEffect(() => {
    if (!token) {
      setMessage(ESIGN_REQUEST_COPY.invalid);
      return;
    }

    let cancelled = false;
    const openVendor = async () => {
      try {
        const result = await getEsignRequestByToken(token);
        if (cancelled) return;
        if (result.status !== "pending") {
          setMessage(
            result.status === "expired"
              ? result.message || ESIGN_REQUEST_COPY.expired
              : result.message || ESIGN_REQUEST_COPY.invalid
          );
          return;
        }
        if (result.needsSignature || !result.vendorUrl) {
          setNeedsSignature(true);
          setFullName(result.fullName || null);
          return;
        }
        window.location.assign(result.vendorUrl);
      } catch (err) {
        if (cancelled) return;
        setMessage(
          err instanceof Error ? err.message : ESIGN_REQUEST_COPY.serverError
        );
      }
    };

    void openVendor();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSign = async () => {
    const base64 = signatureRef.current?.toBase64Png();
    if (!base64) {
      setError("Please draw your signature before continuing.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await uploadEsignRequestSignature(token, base64);
      if (!result.vendorUrl) {
        setError(ESIGN_REQUEST_COPY.startFailed);
        return;
      }
      window.location.assign(result.vendorUrl);
    } catch (err) {
      if (err instanceof KycApiError && err.statusCode === 400) {
        setError("Please sign again using a clearer signature.");
        signatureRef.current?.clear();
        return;
      }
      setError(
        err instanceof Error ? err.message : ESIGN_REQUEST_COPY.serverError
      );
    } finally {
      setBusy(false);
    }
  };

  if (message) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--arn-bg-3)] p-6">
        <div className="w-full max-w-md rounded-[18px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-6 py-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--arn-txt)]">
            {message}
          </h1>
        </div>
      </div>
    );
  }

  if (needsSignature) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--arn-bg-3)] p-6">
        <div className="w-full max-w-md rounded-[18px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-6 py-8 shadow-sm">
          <p className="step-eyebrow">Aadhaar e-sign</p>
          <h1 className="step-title">Draw your signature</h1>
          <p className="step-helper">
            {fullName
              ? `${fullName}, sign in the box below, then continue to Aadhaar OTP.`
              : "Sign in the box below, then continue to Aadhaar OTP."}
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
            onClick={handleSign}
          >
            {busy ? "Saving signature..." : "Sign and continue"}
          </button>
        </div>
      </div>
    );
  }

  return <ArnLoadingState label="Opening Aadhaar e-sign..." />;
}

export default function KycEsignPage() {
  return (
    <Suspense fallback={<ArnLoadingState label="Opening Aadhaar e-sign..." />}>
      <KycEsignRedirectInner />
    </Suspense>
  );
}
