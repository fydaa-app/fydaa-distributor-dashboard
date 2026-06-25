"use client";

import Image from "next/image";

interface ArnLoadingStateProps {
  label?: string;
}

export default function ArnLoadingState({ label = "Loading..." }: ArnLoadingStateProps) {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--arn-bg-3)] p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[18px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-6 py-7 shadow-sm">
        <div className="relative grid size-14 place-items-center">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--arn-bdr)] border-t-[var(--arn-amber)] animate-spin" />
          <Image
            className="relative z-10 h-8 w-auto"
            src="/images/logo/icon.png"
            alt="Fydaa"
            width={128}
            height={32}
          />
        </div>
        <p className="text-sm font-semibold text-[var(--arn-txt-2)]">{label}</p>
      </div>
    </div>
  );
}
