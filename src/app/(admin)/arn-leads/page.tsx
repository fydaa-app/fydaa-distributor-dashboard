import { Suspense } from "react";
import ArnCrmLeadsPage from "@/components/leads/ArnCrmLeadsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--arn-txt-3)]">Loading CRM...</div>}>
      <ArnCrmLeadsPage />
    </Suspense>
  );
}