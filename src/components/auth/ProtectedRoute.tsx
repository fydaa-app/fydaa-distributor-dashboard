"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ArnLoadingState from "@/components/common/ArnLoadingState";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <ArnLoadingState label="Loading dashboard..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
