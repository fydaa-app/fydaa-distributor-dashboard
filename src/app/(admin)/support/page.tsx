"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Support from "@/components/common/Support";

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ComponentCard title="Support">
        <Support />
      </ComponentCard>
    </div>
  );
}
