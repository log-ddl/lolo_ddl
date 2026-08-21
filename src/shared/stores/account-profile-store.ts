import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AccountProfileState {
  avatarDataUrl: string;
  setAvatarDataUrl: (avatarDataUrl: string) => void;
  clearAvatar: () => void;
}

export const useAccountProfileStore = create<AccountProfileState>()(
  persist(
    (set) => ({
      avatarDataUrl: "",
      setAvatarDataUrl: (avatarDataUrl) => set({ avatarDataUrl }),
      clearAvatar: () => set({ avatarDataUrl: "" }),
    }),
    {
      name: "longdd-local-account-profile",
      version: 1,
    },
  ),
);
