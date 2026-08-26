import { cn } from "@/lib/utils";

interface ArnClientAvatarProps {
  initials: string;
  size?: "xs" | "sm" | "md" | "lg" | "detail";
}

const sizeClasses: Record<"xs" | "sm" | "md" | "lg" | "detail", string> = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  detail: "h-10 w-10 text-[14px] sm:h-[42px] sm:w-[42px]",
};

export default function ArnClientAvatar({
  initials,
  size = "md",
}: ArnClientAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        "bg-[var(--arn-avatar-bg)] text-[var(--arn-avatar-txt)]",
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  );
}
