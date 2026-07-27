"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: "layout-dashboard" },
      { label: "Clients", href: "/arn-clients", icon: "users" },
      { label: "SIP book", href: "/arn-sipbook", icon: "repeat" },
    ],
  },
  {
    title: "Transactions",
    items: [
      { label: "Orders", href: "/arn-orders", icon: "file-invoice" },
      //{ label: "Commission", href: "/arn-commission", icon: "coin" },
    ],
  },
  {
    title: "Grow",
    items: [
      { label: "Onboard client", href: "/arn-onboard", icon: "user-plus" },
      { label: "Reports", href: "/arn-reports", icon: "chart-bar" },
     // { label: "Share portfolio", href: "/arn-share", icon: "send" },
    ],
  },
  {
    title: "Leads",
    items: [
      { label: "Leads", href: "/arn-leads", icon: "user-plus" },
    ],
  },
];

function SidebarIcon({ icon, active }: { icon: string; active: boolean }) {
  return (
    <i
      aria-hidden="true"
      className={cn(
        "ti",
        `ti-${icon}`,
        "shrink-0 text-[15px]",
        active
          ? "text-[var(--arn-amber)]"
          : "text-[var(--arn-txt-3)] group-hover:text-[var(--arn-amber)]"
      )}
    />
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

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const logoSrc = theme === "dark" ? "/images/logo/logo.png" : "/images/logo/logo2.png";

  const handleSignOut = () => {
    logout();
    router.replace("/signin");
  };

  const employeeName = user?.name || "Fydaa Distributor";
  const initials = getInitials(employeeName);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-[60] flex w-[220px] flex-col border-r border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-[72px] items-center gap-3 border-b border-[var(--arn-bdr)] px-4">
        <Image
          className="h-8 w-auto"
          src={logoSrc}
          alt="Fydaa"
          width={128}
          height={32}
        />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--arn-txt-3)]">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      "group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "border border-[var(--arn-amber)]/30 bg-[linear-gradient(90deg,rgba(186,117,23,0.10),rgba(186,117,23,0.03))] text-[var(--arn-txt)]"
                        : "text-[var(--arn-txt-2)] hover:bg-[var(--arn-bg)] hover:text-[var(--arn-txt)]"
                    )}
                  >
                    <SidebarIcon icon={item.icon} active={active} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--arn-bdr)] p-4">
        <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--arn-amber)] text-xs font-black text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--arn-txt)]">
                {employeeName}
              </p>
              {user?.euin && (
                <p className="text-xs text-[var(--arn-txt-3)]">{user.euin}</p>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-[10px] border border-[var(--arn-bdr)] px-3 py-2.5 text-sm font-bold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg)] hover:text-[var(--arn-red)]"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
