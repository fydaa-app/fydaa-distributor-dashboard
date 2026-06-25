import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import DistributorShell from "@/layout/DistributorShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fydaa Distributor Dashboard",
  description: "MFD Distributor Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var theme=localStorage.getItem("theme");if(theme==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`}
        </Script>
        <ThemeProvider>
          <SidebarProvider>
            <AuthProvider>
              <DistributorShell>{children}</DistributorShell>
            </AuthProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
