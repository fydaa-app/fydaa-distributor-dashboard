"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

function HeaderMenuIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" fill="currentColor" />
    </svg>
  );
}

function ThemeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    return (
      <svg className="size-5" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none">
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1.1a1 1 0 1 1 2 0V21a1 1 0 0 1-1 1Zm0-18a1 1 0 0 1-1-1V1.9a1 1 0 1 1 2 0V3a1 1 0 0 1-1 1Zm10 8h-1.1a1 1 0 1 1 0-2H22a1 1 0 1 1 0 2ZM4.1 12H3a1 1 0 1 1 0-2h1.1a1 1 0 1 1 0 2Zm14.95 7.05-.78-.78a1 1 0 1 1 1.41-1.41l.78.78a1 1 0 1 1-1.41 1.41ZM4.63 6.05 3.85 5.27A1 1 0 0 1 5.27 3.86l.78.78A1 1 0 0 1 4.63 6.05Zm14.14 0a1 1 0 0 1-1.41-1.41l.78-.78a1 1 0 1 1 1.41 1.41l-.78.78ZM6.05 19.05a1 1 0 0 1-1.41 0l-.78-.78a1 1 0 1 1 1.41-1.41l.78.78a1 1 0 0 1 0 1.41Z" fill="currentColor" />
    </svg>
  );
}

function CrmInfoIcon() {
  return (
    <svg
      className="size-5 fill-current text-[var(--arn-amber)]"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM11.0991 7.52507C11.0991 8.02213 11.5021 8.42507 11.9991 8.42507H12.0001C12.4972 8.42507 12.9001 8.02213 12.9001 7.52507C12.9001 7.02802 12.4972 6.62507 12.0001 6.62507H11.9991C11.5021 6.62507 11.0991 7.02802 11.0991 7.52507ZM12.0001 17.3714C11.5859 17.3714 11.2501 17.0356 11.2501 16.6214V10.9449C11.2501 10.5307 11.5859 10.1949 12.0001 10.1949C12.4143 10.1949 12.7501 10.5307 12.7501 10.9449V16.6214C12.7501 17.0356 12.4143 17.3714 12.0001 17.3714Z"
        fill=""
      />
    </svg>
  );
}

function CrmSignOutIcon() {
  return (
    <svg
      className="size-5 fill-current text-[var(--arn-red)]"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
        fill=""
      />
    </svg>
  );
}

function getHeaderCopy(pathname: string, userName: string) {
  if (pathname === "/") {
    return {
      title: `Good morning, ${userName}`,
      subtitle: "Track AUM, SIP book, trail income and risk items",
    };
  }

  if (pathname.startsWith("/arn-clients/")) {
    return {
      title: "Client detail",
      subtitle: "Review portfolio, holdings and goals",
    };
  }

  const routeTitles: Record<string, { title: string; subtitle: string }> = {
    "/arn-clients": {
      title: "Clients",
      subtitle: "Manage client profiles, holdings and follow-ups",
    },
    "/arn-sipbook": {
      title: "SIP book",
      subtitle: "Review upcoming mandates and SIP activity",
    },
    "/arn-orders": {
      title: "Orders",
      subtitle: "Track purchase, redeem and switch activity",
    },
    "/arn-commission": {
      title: "Commission tracker",
      subtitle: "Monitor trail and upfront commission movement",
    },
    "/arn-onboard": {
      title: "Onboard client",
      subtitle: "Start new client onboarding and KYC workflow",
    },
    "/arn-reports": {
      title: "Reports",
      subtitle: "Generate distributor and client-level reports",
    },
    "/arn-share": {
      title: "Share portfolio",
      subtitle: "Share portfolio snapshots with clients",
    },
    "/support": {
      title: "Support",
      subtitle: "Contact relationship manager and support channels",
    },
  };

  return (
    routeTitles[pathname] || {
      title: pathname.replace(/^\//, "").replace(/-/g, " "),
      subtitle: "Distributor workspace",
    }
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { openSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const employeeName = user?.name || "Distributor";
  const initials = getInitials(employeeName);
  const { title, subtitle } = getHeaderCopy(pathname, employeeName);
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleSignOut = () => {
    logout();
    router.replace("/signin");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-[72px] border-b border-[var(--arn-bdr)] bg-[var(--arn-bg)] lg:left-[220px]">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Open sidebar"
            className="grid size-10 place-items-center rounded-[10px] text-[var(--arn-txt-2)] hover:bg-[var(--arn-bg-2)] lg:hidden"
            onClick={openSidebar}
          >
            <HeaderMenuIcon />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-[var(--arn-txt)] sm:text-lg">
              {title}
            </h1>
            <p className="hidden truncate text-xs font-medium text-[var(--arn-txt-2)] sm:block">
              {today} · {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Toggle theme"
            className="grid size-10 place-items-center rounded-[10px] bg-[#BA7517] text-white transition-colors hover:bg-[#A46512]"
            onClick={toggleTheme}
          >
            <ThemeIcon dark={theme === "dark"} />
          </button>

          <div className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-3 py-2 transition-colors hover:bg-[var(--arn-bg-3)]"
              onClick={() => setOpen((value) => !value)}
            >
              <div className="grid size-8 place-items-center rounded-full bg-[var(--arn-amber)] text-xs font-black text-white">
                {initials}
              </div>
              <span className="hidden max-w-[120px] truncate text-sm font-bold text-[var(--arn-txt)] sm:block">
                {employeeName}
              </span>
              <svg
                className={cn(
                  "size-4 text-[var(--arn-txt-2)] transition-transform",
                  open && "rotate-180"
                )}
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="m6 9 6 6 6-6H6Z" fill="currentColor" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-3 w-52 rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-2 shadow-xl">
                <Link
                  href="/support"
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold text-[var(--arn-txt)] transition-colors hover:bg-[var(--arn-bg-2)]"
                  onClick={() => setOpen(false)}
                >
                  <CrmInfoIcon />
                  Support
                </Link>
                <Link
                  href="/reset-password"
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold text-[var(--arn-txt)] transition-colors hover:bg-[var(--arn-bg-2)]"
                  onClick={() => setOpen(false)}
                >
                  <CrmInfoIcon />
                  Reset password
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold text-[var(--arn-red)] transition-colors hover:bg-[var(--arn-red-bg)]"
                  onClick={handleSignOut}
                >
                  <CrmSignOutIcon />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
