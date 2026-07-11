"use client";

import { useSidebar } from "@/context/SidebarContext";

export default function Backdrop() {
  const { closeSidebar, isSidebarOpen } = useSidebar();

  if (!isSidebarOpen) return null;

  return (
    <button
      type="button"
      aria-label="Close sidebar"
      className="fixed inset-0 z-[55] bg-black/30 lg:hidden"
      onClick={closeSidebar}
    />
  );
}
