"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ResetPassword from "@/components/auth/ResetPassword";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ComponentCard
        title="Change Password"
        desc="Update the password used to sign in to your Partner Dashboard account."
      >
        <ResetPassword />
      </ComponentCard>
    </div>
  );
}
