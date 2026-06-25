import { cn } from "@/lib/utils";

type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

const toneClasses: Record<ArnTone, string> = {
  amber: "bg-[#FAEEDA] text-[#854F0B]",
  green: "bg-[#EAF3DE] text-[#3B6D11]",
  blue: "bg-[#E6F1FB] text-[#185FA5]",
  red: "bg-[#FCEBEB] text-[#A32D2D]",
  purple: "bg-[#EEEDFE] text-[#534AB7]",
  teal: "bg-[#E1F5EE] text-[#0F6E56]",
};

interface ArnClientAvatarProps {
  initials: string;
  tone?: ArnTone;
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
  tone = "amber",
  size = "md",
}: ArnClientAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        toneClasses[tone],
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  );
}
