import { type GoalSetupClient } from "@/services/arnGoalSetupService";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnStatusTag from "@/components/common/ArnStatusTag";

interface ArnClientPreviewProps {
  client: GoalSetupClient | null;
}

function getMandateVariant(status: string): "active" | "cancelled" | "pending" {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "active";
  if (normalized === "CANCELLED") return "cancelled";
  return "pending";
}

function formatPanStatus(panStatus?: string): string {
  if (!panStatus) return "unknown";
  const map: Record<string, string> = {
    KYC_SUCCESS: "KYC Success",
    KYC_FAILED: "KYC Failed",
    KYC_UPLOAD_REQ: "KYC Upload Req",
    KYC_VERIFICATION_PENDING: "KYC Verification Pending",
  };
  return map[panStatus] || panStatus;
}

export default function ArnClientPreview({ client }: ArnClientPreviewProps) {
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-6 text-center min-h-[220px]">
        <div className="mb-3 text-[var(--arn-amber)] opacity-35">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--arn-txt-3)]">
          Select a client to preview their details
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <ArnClientAvatar initials={client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()} tone="amber" size="lg" />
        <div className="min-w-0">
          <div className="text-base font-bold text-[var(--arn-txt)] truncate">{client.name}</div>
          <div className="text-xs text-[var(--arn-txt-3)] mt-0.5">{client.email}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between py-2 border-t border-[var(--arn-bdr)]">
          <span className="text-xs font-medium text-[var(--arn-txt-2)]">Mobile</span>
          <span className="text-xs font-semibold text-[var(--arn-txt)]">{client.mobileNumber}</span>
        </div>
        <div className="flex justify-between py-2 border-t border-[var(--arn-bdr)]">
          <span className="text-xs font-medium text-[var(--arn-txt-2)]">Email</span>
          <span className="text-xs font-semibold text-[var(--arn-txt)] truncate ml-2 text-right">{client.email}</span>
        </div>
        <div className="flex justify-between py-2 border-t border-[var(--arn-bdr)]">
          <span className="text-xs font-medium text-[var(--arn-txt-2)]">PAN Status</span>
          <span className="text-xs font-semibold text-[var(--arn-txt)]">{formatPanStatus(client.panStatus)}</span>
        </div>
        <div className="flex justify-between py-2 border-t border-[var(--arn-bdr)]">
          <span className="text-xs font-medium text-[var(--arn-txt-2)]">Mandate Status</span>
          <ArnStatusTag label={client.mandateStatus} variant={getMandateVariant(client.mandateStatus)} />
        </div>
      </div>
    </div>
  );
}
