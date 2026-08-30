import { cn } from "@/lib/utils";

type ArnStatusVariant =
  | "active"
  | "paused"
  | "due"
  | "failed"
  | "processing"
  | "valuation"
  | "teal"
  | "pending"
  | "review"
  | "kyc"
  | "sip"
  | "call"
  | "inactive"
  | "cancelled";

const variantClasses: Record<ArnStatusVariant, string> = {
  active: "bg-[var(--arn-done-bg)] text-[var(--arn-done-txt)]",
  paused: "bg-[var(--arn-bg-2)] text-[var(--arn-txt-3)] border border-[var(--arn-bdr)] dark:bg-[#252522] dark:border-white/10",
  due: "bg-[var(--arn-pending-bg)] text-[var(--arn-pending-txt)]",
  failed: "bg-[var(--arn-failed-bg)] text-[var(--arn-failed-txt)]",
  processing: "bg-[var(--arn-processing-bg)] text-[var(--arn-processing-txt)]",
  valuation: "bg-[var(--arn-lumpsum-bg)] text-[var(--arn-lumpsum-txt)]",
  teal: "bg-[var(--arn-redemption-bg)] text-[var(--arn-redemption-txt)]",
  pending: "bg-[var(--arn-pending-bg)] text-[var(--arn-pending-txt)]",
  review: "bg-[var(--arn-switch-bg)] text-[var(--arn-switch-txt)]",
  kyc: "bg-[var(--arn-processing-bg)] text-[var(--arn-processing-txt)]",
  sip: "bg-[var(--arn-sip-bg)] text-[var(--arn-sip-txt)]",
  call: "bg-[var(--arn-redemption-bg)] text-[var(--arn-redemption-txt)]",
  inactive: "bg-[var(--arn-bg-2)] text-[var(--arn-txt-3)] border border-[var(--arn-bdr)] dark:bg-[#252522] dark:border-white/10",
  cancelled: "bg-[var(--arn-failed-bg)] text-[var(--arn-failed-txt)]",
};

export interface ArnStatusTagProps {
  label: string;
  variant?: ArnStatusVariant;
  size?: "default" | "task";
}

const sizeClasses: Record<"default" | "task", string> = {
  default: "inline-flex items-center rounded px-2 py-[3px] text-[10px] font-semibold whitespace-nowrap",
  task: "inline-flex items-center rounded px-2 py-[3px] text-[10px] font-semibold whitespace-nowrap",
};

export default function ArnStatusTag({
  label,
  variant = "active",
  size = "default",
}: ArnStatusTagProps) {
  return (
    <span
      className={cn(sizeClasses[size], variantClasses[variant])}
    >
      {label}
    </span>
  );
}
