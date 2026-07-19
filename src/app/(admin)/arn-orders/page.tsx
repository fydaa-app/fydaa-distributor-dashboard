import { Suspense } from "react";
import ArnOrdersPage from "@/components/orders/ArnOrdersPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--arn-txt-3)]">Loading orders...</div>}>
      <ArnOrdersPage />
    </Suspense>
  );
}
