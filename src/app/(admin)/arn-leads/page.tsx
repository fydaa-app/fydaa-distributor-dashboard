import { Suspense } from "react";
import ArnLeadsPage from "@/components/leads/ArnLeadsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--arn-txt-3)]">Loading leads...</div>}>
      <ArnLeadsPage />
    </Suspense>
  );
}
