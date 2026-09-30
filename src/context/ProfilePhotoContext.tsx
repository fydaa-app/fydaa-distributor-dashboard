"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchPartnerProfilePhoto } from "@/services/arnProfileService";
import type { PartnerProfilePhoto } from "@/services/arnProfileService";

const LEGACY_DISMISS_KEY = "arnProfilePhotoReminderDismissed";

type ProfilePhotoContextType = {
  hasActiveRm: boolean;
  photoUrl: string | null;
  isLoading: boolean;
  refreshProfilePhoto: () => void;
};

const ProfilePhotoContext = createContext<ProfilePhotoContextType | undefined>(
  undefined,
);

export function ProfilePhotoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPartner, isLoading: authLoading } = useAuth();
  const [profilePhoto, setProfilePhoto] =
    useState<PartnerProfilePhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_DISMISS_KEY);
    }
  }, []);

  const refreshProfilePhoto = useCallback(async () => {
    if (!isPartner) {
      setProfilePhoto(null);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      const data = await fetchPartnerProfilePhoto();
      if (requestId !== requestIdRef.current) return;
      setProfilePhoto(data);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setProfilePhoto({ hasActiveRm: false, photoUrl: null });
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [isPartner]);

  useEffect(() => {
    if (authLoading) return;

    refreshProfilePhoto();
  }, [authLoading, refreshProfilePhoto]);

  const value = useMemo(
    () => ({
      hasActiveRm: profilePhoto?.hasActiveRm ?? false,
      photoUrl: profilePhoto?.photoUrl ?? null,
      isLoading,
      refreshProfilePhoto,
    }),
    [profilePhoto, isLoading, refreshProfilePhoto],
  );

  return (
    <ProfilePhotoContext.Provider value={value}>
      {children}
    </ProfilePhotoContext.Provider>
  );
}

export function useProfilePhoto() {
  const context = useContext(ProfilePhotoContext);

  if (!context) {
    throw new Error(
      "useProfilePhoto must be used within a ProfilePhotoProvider",
    );
  }

  return context;
}
