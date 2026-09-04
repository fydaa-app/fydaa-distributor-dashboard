"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ArnLoadingState from "@/components/common/ArnLoadingState";
import { consumeImpersonationToken } from "@/services/arnService";

export default function ImpersonatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const startedForToken = useRef<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token")?.trim();

    if (!token) {
      setError("This dashboard link is missing a token.");
      return;
    }

    if (startedForToken.current === token) {
      return;
    }
    startedForToken.current = token;

    consumeImpersonationToken(token)
      .then(() => {
        window.dispatchEvent(new Event("auth-changed"));
        router.replace("/");
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "Could not open this partner dashboard."
        );
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--arn-bg-3)] p-6">
        <div className="w-full max-w-md rounded-[18px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-6 py-7 text-center shadow-sm">
          <h1 className="mb-2 text-lg font-bold text-[var(--arn-txt)]">
            Could not open dashboard
          </h1>
          <p className="mb-5 text-sm text-[var(--arn-red)]">{error}</p>
          <Link
            href="/signin"
            className="inline-flex rounded-[10px] bg-[var(--arn-amber)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--arn-amber-hover)]"
          >
            Go to partner login
          </Link>
        </div>
      </div>
    );
  }

  return <ArnLoadingState label="Opening partner dashboard..." />;
}
