"use client";

import { useEffect } from "react";
import ArnLoadingState from "@/components/common/ArnLoadingState";
import { notifyDigilockerCallback } from "@/utils/kycPopup";

export default function KycDigilockerCallbackPage() {
  useEffect(() => {
    notifyDigilockerCallback();
    const timer = window.setTimeout(() => {
      try {
        window.close();
      } catch {
        /* ignore */
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  return <ArnLoadingState label="Completing DigiLocker..." />;
}
