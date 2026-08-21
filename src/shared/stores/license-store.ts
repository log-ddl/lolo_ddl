import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccountAccessResult, AccountStatus, LicensePlan } from "@/shared/lib/license-client";

interface LicenseState {
  machineId: string;
  deviceName: string;
  userId: string;
  email: string;
  userName: string;
  registeredAt?: string;
  lastValidUntil?: string;
  lastCheckedAt?: number;
  plan: LicensePlan;
  status: AccountStatus;
  maxDevices: number;
  deviceAllowed: boolean;
  deviceAccessReason?: string;
}

interface LicenseActions {
  setDeviceInfo: (deviceHash: string, deviceName: string) => void;
  setSessionUser: (userId: string, email: string, userName: string) => void;
  setAccountAccess: (access: AccountAccessResult) => void;
  setUserName: (userName: string) => void;
  clearAccount: () => void;
}

const emptyAccount: Omit<LicenseState, "machineId" | "deviceName"> = {
  userId: "",
  email: "",
  userName: "",
  plan: "free",
  status: "active",
  maxDevices: 1,
  deviceAllowed: true,
};

export const useLicenseStore = create<LicenseState & LicenseActions>()(
  persist(
    (set) => ({
      machineId: "",
      deviceName: "",
      ...emptyAccount,

      setDeviceInfo: (machineId, deviceName) => set({ machineId, deviceName }),
      setSessionUser: (userId, email, userName) => set({
        ...emptyAccount,
        userId,
        email,
        userName: userName.trim(),
      }),
      setAccountAccess: (access) => set({
        userId: access.userId,
        email: access.email,
        userName: access.displayName,
        registeredAt: access.registeredAt,
        plan: access.plan,
        status: access.status,
        lastValidUntil: access.expiresAt,
        lastCheckedAt: Date.now(),
        maxDevices: access.maxDevices,
        deviceAllowed: access.allowed,
        deviceAccessReason: access.reason,
      }),
      setUserName: (userName) => set({ userName: userName.trim() }),
      clearAccount: () => set(emptyAccount),
    }),
    {
      name: "opencut-license",
      version: 3,
      migrate: (persisted) => {
        const previous = persisted as Partial<LicenseState>;
        return {
          machineId: "",
          deviceName: "",
          ...emptyAccount,
          userName: typeof previous.userName === "string" ? previous.userName : "",
        };
      },
    },
  ),
);
