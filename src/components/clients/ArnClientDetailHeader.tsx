"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnIncompleteOnboardingModal from "@/components/goalSetup/ArnIncompleteOnboardingModal";
import { getUserStage } from "@/services/arnReviewApi";
import { isKycReadyToProceed } from "@/utils/kycStage";
import type { ArnClient } from "@/types/arnClient";

interface ArnClientDetailHeaderProps {
  client: ArnClient;
  clientSince: string;
  sipActive: boolean;
  kycComplete: boolean;
  clientId: string;
}

export default function ArnClientDetailHeader({
  client,
  clientSince,
  sipActive,
  kycComplete,
  clientId,
}: ArnClientDetailHeaderProps) {
  const router = useRouter();
  const [isCheckingStage, setIsCheckingStage] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [incompleteClientName, setIncompleteClientName] = useState("");
  const [incompleteUserMobile, setIncompleteUserMobile] = useState("");

  useEffect(() => {
    if (showIncompleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showIncompleteModal]);

  const handleNewSipClick = useCallback(async () => {
    setIsCheckingStage(true);
    setShowIncompleteModal(false);

    try {
      const stage = await getUserStage(Number(clientId), 0, "MUTUALFUND");

      if (
        stage.isRiskProfileComplete &&
        stage.isEmail &&
        isKycReadyToProceed(stage) &&
        stage.isBank &&
        stage.isNominee &&
        !!stage.kycExtraData
      ) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "arn_onboard_target_user",
            JSON.stringify({
              userId: clientId,
              name: client.name,
              phone: client.mobileNumber,
              email: "",
              skipClientStep: true,
            })
          );
        }
        router.push("/arn-goal-setup");
        return;
      }

      setIncompleteClientName(client.name);
      setIncompleteUserMobile(client.mobileNumber);
      setShowIncompleteModal(true);
    } catch {
      setIncompleteClientName(client.name);
      setIncompleteUserMobile(client.mobileNumber);
      setShowIncompleteModal(true);
    } finally {
      setIsCheckingStage(false);
    }
  }, [clientId, client.name, client.mobileNumber, router]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <ArnClientAvatar initials={client.initials} size="lg" />
          <div className="min-w-0">
            <div className="text-lg font-black text-[var(--arn-txt)] sm:text-xl">{client.name}</div>
            <div className="text-sm text-[var(--arn-txt-3)]">
              Client since {clientSince} · {sipActive ? "SIP active" : "SIP inactive"} · {kycComplete ? "KYC complete" : "KYC pending"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/arn-share?clientId=${clientId}`}
            className="inline-flex items-center justify-center gap-1 rounded-[8px] border border-[var(--arn-bdr-2)] px-4 py-2.5 text-sm font-bold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)]"
          >
            <i aria-hidden="true" className="ti ti-send" />
            Share report
          </Link>
          <button
            type="button"
            onClick={handleNewSipClick}
            disabled={isCheckingStage}
            className="inline-flex items-center justify-center gap-1 rounded-[8px] bg-[var(--arn-amber)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            <i aria-hidden="true" className="ti ti-plus" />
            {isCheckingStage ? "Checking..." : "New SIP"}
          </button>
        </div>
      </div>

      <ArnIncompleteOnboardingModal
        isOpen={showIncompleteModal}
        clientName={incompleteClientName}
        onCancel={() => setShowIncompleteModal(false)}
        onContinue={() => {
          setShowIncompleteModal(false);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("arn_onboard_mobile", incompleteUserMobile);
          }
          router.push(`/arn-onboard?mobile=${encodeURIComponent(incompleteUserMobile)}`);
        }}
      />
    </div>
  );
}
