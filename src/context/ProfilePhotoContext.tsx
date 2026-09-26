"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchPartnerProfilePhoto } from "@/services/arnProfileService";
import type { PartnerProfilePhoto } from "@/services/arnProfileService";

const STORAGE_KEY = "arnProfilePhotoReminderDismissed";

type ProfilePhotoContextType = {
  hasActiveRm: boolean;
  photoUrl: string | null;
  isLoading: boolean;
  reminderDismissed: boolean;
  refreshProfilePhoto: () => void;
  dismissReminder: () => void;
};

const ProfilePhotoContext = createContext<ProfilePhotoContextType | undefined>(
  undefined,
);

export function ProfilePhotoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPartner } = useAuth();
  const [profilePhoto, setProfilePhoto] =
    useState<PartnerProfilePhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setReminderDismissed(localStorage.getItem(STORAGE_KEY) === "true");
    }
  }, []);

  const refreshProfilePhoto = useCallback(async () => {
    if (!isPartner) {
      setProfilePhoto(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchPartnerProfilePhoto();
      setProfilePhoto(data);
    } catch {
      setProfilePhoto({ hasActiveRm: false, photoUrl: null });
    } finally {
      setIsLoading(false);
    }
  }, [isPartner]);

  useEffect(() => {
    refreshProfilePhoto();
  }, [refreshProfilePhoto]);

  const dismissReminder = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setReminderDismissed(true);
  }, []);

  const value = useMemo(
    () => ({
      hasActiveRm: profilePhoto?.hasActiveRm ?? false,
      photoUrl: profilePhoto?.photoUrl ?? null,
      isLoading,
      reminderDismissed,
      refreshProfilePhoto,
      dismissReminder,
    }),
    [profilePhoto, isLoading, reminderDismissed, refreshProfilePhoto, dismissReminder],
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
