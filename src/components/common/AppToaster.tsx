"use client";

import { ToastContainer } from "react-toastify";
import { useTheme } from "@/context/ThemeContext";

/**
 * Global toast host.
 *
 * Mounted once in the root layout (NOT inside DistributorShell) so that public
 * routes such as /forgotpassword get toasts as well as the authenticated pages.
 */
export default function AppToaster() {
  const { theme } = useTheme();

  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      theme={theme === "dark" ? "dark" : "light"}
      toastClassName="!rounded-[10px] !font-sans !text-sm"
      style={{ zIndex: 9999 }}
    />
  );
}
