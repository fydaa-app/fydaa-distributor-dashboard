import { Suspense } from "react";
import ArnSharePage from "@/components/share/ArnSharePage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--arn-txt-3)]">Loading share portfolio...</div>}>
      <ArnSharePage />
    </Suspense>
  );
}
