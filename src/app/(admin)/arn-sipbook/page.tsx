import { Suspense } from "react";
import ArnSipBookPage from "@/components/sipbook/ArnSipBookPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--arn-txt-3)]">Loading SIP book...</div>}>
      <ArnSipBookPage />
    </Suspense>
  );
}
