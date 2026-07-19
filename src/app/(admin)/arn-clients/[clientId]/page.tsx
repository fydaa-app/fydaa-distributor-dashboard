import { Suspense } from "react";
import ArnClientDetailPage from "@/components/clients/ArnClientDetailPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--arn-txt-3)]">Loading client...</div>}>
      <ArnClientDetailPage />
    </Suspense>
  );
}
