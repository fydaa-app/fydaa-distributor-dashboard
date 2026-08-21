import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { getCookie } from "cookies-next";
import { COLORS } from "@/theme/colors";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (getCookie("authToken")) {
    redirect("/");
  }

  return (
    <div className={`relative p-6 bg-[var(--arn-bg)] z-1 dark:bg-[var(--arn-bg)] sm:p-0 tone-${COLORS.currentBrand} w-full max-w-full overflow-x-hidden`}>
      <div className="relative flex lg:flex-row w-full max-w-full h-screen justify-center flex-col dark:bg-[var(--arn-bg)] sm:p-0 overflow-x-hidden">
        {children}
        <div className="lg:w-1/2 w-full h-full bg-[var(--arn-brand-bg)] lg:grid items-center hidden">
          <div className="relative items-center justify-center  flex z-1">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link href="/" className="block mb-4">
                <Image
                  width={231}
                  height={48}
                  src="/images/logo/logo.png"
                  alt="Logo"
                />
              </Link>
            </div>
          </div>
        </div>
        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
