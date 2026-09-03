import { Suspense } from "react";
import ImpersonatePage from "@/components/auth/ImpersonatePage";
import ArnLoadingState from "@/components/common/ArnLoadingState";

export default function Page() {
  return (
    <Suspense fallback={<ArnLoadingState label="Opening partner dashboard..." />}>
      <ImpersonatePage />
    </Suspense>
  );
}
