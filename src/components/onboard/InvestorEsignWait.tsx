"use client";

import { useEffect, useRef, useState } from "react";
import {
  createEsignRequest,
  ESIGN_REQUEST_COPY,
  getEsignRequest,
  isUnauthorizedError,
  type EsignRequestStatus,
} from "@/services/arnKycService";

const POLL_MS = 5000;

interface InvestorEsignWaitProps {
  onCompleted: () => void | Promise<void>;
  onUnauthorized: () => void;
  completing?: boolean;
  completingLabel?: string;
  flow?: "non_compliant" | "modify";
}

function formatExpiry(expiresAt?: string | null): string | null {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function InvestorEsignWait({
  onCompleted,
  onUnauthorized,
  completing = false,
  completingLabel = "Continuing...",
  flow,
}: InvestorEsignWaitProps) {
  const [request, setRequest] = useState<EsignRequestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const completedRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  const status = request?.status ?? "none";
  const pending = status === "pending";
  const canSend = !busy && !completing && !pending;

  const handleError = (err: unknown, fallback: string) => {
    if (isUnauthorizedError(err)) {
      onUnauthorized();
      return;
    }
    setError(err instanceof Error ? err.message : fallback);
  };

  const applyStatus = (next: EsignRequestStatus) => {
    setRequest(next);
    if (next.status === "none") {
      setError(null);
      return;
    }
    if (next.status === "completed" && !completedRef.current) {
      completedRef.current = true;
      void onCompletedRef.current();
    }
    if (next.status === "expired") {
      setError(next.message || ESIGN_REQUEST_COPY.expired);
    }
    if (next.status === "failed") {
      setError(next.message || ESIGN_REQUEST_COPY.vendorFailed);
    }
    if (next.status === "pending") {
      setError(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const resume = async () => {
      setBusy(true);
      try {
        const current = await getEsignRequest();
        if (cancelled) return;
        if (current.status === "none") {
          setRequest(current);
          setError(null);
        } else {
          applyStatus(current);
        }
      } catch (err) {
        if (!cancelled) {
          handleError(err, ESIGN_REQUEST_COPY.serverError);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    void resume();
    return () => {
      cancelled = true;
    };
    // Resume once when the partner lands on the wait screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pending || completing) return;
    const timer = window.setInterval(async () => {
      try {
        const current = await getEsignRequest();
        setError((prev) =>
          current.status === "pending" || current.status === "none"
            ? null
            : current.status === "expired"
              ? current.message || ESIGN_REQUEST_COPY.expired
              : current.status === "failed"
                ? current.message || ESIGN_REQUEST_COPY.vendorFailed
                : prev
        );
        applyStatus(current);
      } catch (err) {
        if (isUnauthorizedError(err)) {
          onUnauthorized();
        }
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [pending, completing, onUnauthorized]);

  const send = async () => {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      const next = await createEsignRequest(flow);
      applyStatus(next);
    } catch (err) {
      handleError(err, ESIGN_REQUEST_COPY.sendEmailFailed);
    } finally {
      setBusy(false);
    }
  };

  const expiryDisplay = formatExpiry(request?.expiresAt);
  const sent = pending && Boolean(request?.emailSentTo || request?.expiresAt);
  const buttonLabel = completing
    ? completingLabel
    : busy
      ? pending
        ? "Checking status..."
        : "Sending email..."
      : pending
        ? "Waiting for investor"
        : status === "expired" || status === "failed"
          ? "Resend email"
          : "Send e-sign email";

  return (
    <>
      <p className="step-helper">
        Send a 5-minute link to the investor. They must open it on their phone,
        draw their signature, then complete Aadhaar OTP. Stay on this screen
        until it is done.
      </p>
      {sent && (
        <div className="glass-card rounded-[10px] border border-[var(--arn-bdr)] p-4 mb-4">
          <div className="card-title">Waiting for investor e-sign</div>
          <div className="card-sub">
            {request?.emailSentTo
              ? `Email sent to ${request.emailSentTo}. Ask the investor to open the mail on their phone.`
              : "Ask the investor to open the mail on their phone."}
            {expiryDisplay ? ` Link expires at ${expiryDisplay}.` : ""}
            {request?.message === ESIGN_REQUEST_COPY.alreadySent
              ? ` ${ESIGN_REQUEST_COPY.alreadySent}`
              : ""}
          </div>
        </div>
      )}
      {error && (
        <div className="field-error justify-center">
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {error}
        </div>
      )}
      <button
        type="button"
        className="btn-primary btn-wide"
        disabled={busy || completing || pending}
        onClick={send}
      >
        {buttonLabel}
      </button>
    </>
  );
}
