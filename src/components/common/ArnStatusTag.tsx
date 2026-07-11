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
  | "call";

const variantClasses: Record<ArnStatusVariant, string> = {
  active: "bg-[var(--arn-green-bg)] text-[var(--arn-green)] dark:text-[#C0DD97]",
  paused: "bg-[var(--arn-bg-2)] text-[var(--arn-txt-3)] border border-[var(--arn-bdr)] dark:bg-[#252522] dark:border-white/10",
  due: "bg-[var(--arn-amber-bg)] text-[var(--arn-amber-txt)]",
  failed: "bg-[var(--arn-red-bg)] text-[var(--arn-red)] dark:text-[#F09595]",
  processing: "bg-[var(--arn-blue-bg)] text-[var(--arn-blue)] dark:text-[#B5D4F4]",
  valuation: "bg-[var(--arn-pur-bg)] text-[var(--arn-pur-txt)]",
  teal: "bg-[var(--arn-tel-bg)] text-[var(--arn-tel-txt)]",
  pending: "bg-[var(--arn-amber-bg)] text-[var(--arn-amber-txt)]",
  review: "bg-[var(--arn-pur-bg)] text-[var(--arn-pur-txt)]",
  kyc: "bg-[var(--arn-blue-bg)] text-[var(--arn-blue)] dark:text-[#B5D4F4]",
  sip: "bg-[var(--arn-amber-bg)] text-[var(--arn-amber-txt)]",
  call: "bg-[var(--arn-tel-bg)] text-[var(--arn-tel-txt)]",
};

export interface ArnStatusTagProps {
  label: string;
  variant?: ArnStatusVariant;
  size?: "default" | "task";
}

const sizeClasses: Record<"default" | "task", string> = {
  default: "inline-flex items-center rounded-[10px] px-[7px] py-[2px] text-[10px] font-semibold whitespace-nowrap",
  task: "inline-flex items-center rounded-[10px] px-[5px] py-[1px] text-[10px] font-semibold whitespace-nowrap",
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
