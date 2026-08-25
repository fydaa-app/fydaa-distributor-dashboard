import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preparing Payment | Fydaa",
  description: "Preparing your payment",
};

export default function PaymentLoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--arn-bg)]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--arn-amber)] border-t-transparent" />
        <p className="text-sm font-medium text-[var(--arn-txt-2)]">
          Preparing your payment...
        </p>
      </div>
    </div>
  );
}
