import Link from "next/link";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import type { ArnClient } from "@/types/arnClient";

interface ArnClientDetailHeaderProps {
  client: ArnClient;
  clientSince: string;
  sipActive: boolean;
  kycComplete: boolean;
  clientId: string;
}

export default function ArnClientDetailHeader({
  client,
  clientSince,
  sipActive,
  kycComplete,
  clientId,
}: ArnClientDetailHeaderProps) {
  return (
    <div>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <ArnClientAvatar initials={client.initials} size="lg" />
          <div className="min-w-0">
            <div className="text-lg font-black text-[var(--arn-txt)] sm:text-xl">{client.name}</div>
            <div className="text-sm text-[var(--arn-txt-3)]">
              Client since {clientSince} · {sipActive ? "SIP active" : "SIP inactive"} · {kycComplete ? "KYC complete" : "KYC pending"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/arn-share?clientId=${clientId}`}
            className="inline-flex items-center justify-center gap-1 rounded-[8px] border border-[var(--arn-bdr-2)] px-4 py-2.5 text-sm font-bold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)]"
          >
            <i aria-hidden="true" className="ti ti-send" />
            Share report
          </Link>
          <Link
            href={`/arn-onboard?clientId=${clientId}&intent=new-sip`}
            className="inline-flex items-center justify-center gap-1 rounded-[8px] bg-[var(--arn-amber)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <i aria-hidden="true" className="ti ti-plus" />
            New SIP
          </Link>
        </div>
      </div>
    </div>
  );
}
