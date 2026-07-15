import { Suspense } from "react";
import ArnClientsPage from "@/components/clients/ArnClientsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--arn-txt-3)]">Loading clients...</div>}>
      <ArnClientsPage />
    </Suspense>
  );
}
