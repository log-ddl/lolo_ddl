"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2, LogIn, LogOut, RefreshCw, ShieldAlert, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  checkAccountAndClaimDevice,
  finishOAuthSignIn,
  getStoredSession,
  signOutAccount,
  startGoogleSignIn,
  updateDisplayName,
} from "@/shared/lib/license-client";
import { supabase } from "@/shared/lib/supabase-client";
import { useLicenseStore } from "@/shared/stores/license-store";
import { useI18n } from "@/shared/i18n";

interface LicenseGateProps {
  children: React.ReactNode;
}

function metadataName(session: Session): string {
  const metadata = session.user.user_metadata as Record<string, unknown>;
  for (const key of ["full_name", "name", "display_name"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function fallbackDeviceInfo() {
  const key = "logdd-browser-device-id";
  let deviceHash = localStorage.getItem(key) || "";
  if (!deviceHash) {
    deviceHash = `browser-${crypto.randomUUID()}`;
    localStorage.setItem(key, deviceHash);
  }
  return { deviceHash, deviceName: navigator.platform || "Browser" };
}

export function LicenseGate({ children }: LicenseGateProps) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const checkingUserRef = useRef("");
  const {
    setDeviceInfo,
    setSessionUser,
    setAccountAccess,
    setUserName,
    clearAccount,
  } = useLicenseStore();

  const updateSessionAccount = useCallback((nextSession: Session | null) => {
    setSession((currentSession) => {
      if (currentSession?.user.id === nextSession?.user.id) return currentSession;
      return nextSession;
    });
  }, []);

  const processCallback = useCallback(async (url: string) => {
    setSigningIn(true);
    try {
      const nextSession = await finishOAuthSignIn(url);
      updateSessionAccount(nextSession);
      toast.success(vi ? "Đăng nhập Google thành công" : "Signed in with Google");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setSigningIn(false);
      await window.authBridge?.consumePendingCallback();
    }
  }, [updateSessionAccount, vi]);

  useEffect(() => {
    let cancelled = false;
    void getStoredSession()
      .then((stored) => {
        if (!cancelled) updateSessionAccount(stored);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Cannot restore session");
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!cancelled) {
        updateSessionAccount(nextSession);
        setSessionReady(true);
      }
    });

    const removeCallbackListener = window.authBridge?.onOAuthCallback((url) => {
      void processCallback(url);
    });
    void window.authBridge?.consumePendingCallback().then((url) => {
      if (url && !cancelled) void processCallback(url);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
      removeCallbackListener?.();
    };
  }, [processCallback, updateSessionAccount]);

  const runAccessCheck = useCallback(async (activeSession: Session) => {
    if (checkingUserRef.current === activeSession.user.id) return;
    checkingUserRef.current = activeSession.user.id;
    setCheckingAccess(true);
    setAccessError("");
    setBlockedReason("");
    const googleName = metadataName(activeSession);
    setSessionUser(activeSession.user.id, activeSession.user.email || "", googleName);

    try {
      const resolvedDevice = window.authBridge
        ? await window.authBridge.getDeviceInfo()
        : fallbackDeviceInfo();
      setDeviceInfo(resolvedDevice.deviceHash, resolvedDevice.deviceName);

      const access = await checkAccountAndClaimDevice(resolvedDevice);
      setAccountAccess(access);
      if (!access.allowed || access.status === "blocked") {
        setBlockedReason(access.reason || access.status);
        return;
      }

      const onboardingKey = `logdd-display-name-confirmed:${activeSession.user.id}`;
      if (!localStorage.getItem(onboardingKey)) {
        setDraftName(access.displayName || googleName);
        setNameDialogOpen(true);
      }
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : String(error));
    } finally {
      setCheckingAccess(false);
      checkingUserRef.current = "";
    }
  }, [setAccountAccess, setDeviceInfo, setSessionUser]);

  useEffect(() => {
    if (session) {
      void runAccessCheck(session);
    } else if (sessionReady) {
      clearAccount();
    }
  }, [clearAccount, runAccessCheck, session, sessionReady]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await startGoogleSignIn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot start Google sign-in");
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutAccount();
    } finally {
      setBlockedReason("");
      setAccessError("");
      clearAccount();
      setSession(null);
    }
  };

  const handleSaveName = async () => {
    const name = draftName.trim();
    if (!name) return;
    setSavingName(true);
    try {
      await updateDisplayName(name);
      setUserName(name);
      if (session) localStorage.setItem(`logdd-display-name-confirmed:${session.user.id}`, "1");
      setNameDialogOpen(false);
      toast.success(vi ? "Đã lưu tên hiển thị" : "Display name saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot save display name");
    } finally {
      setSavingName(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.14),transparent_38%),radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.08),transparent_35%)]" />
        <div className="relative h-full flex items-center justify-center p-6">
          <section className="w-full max-w-md rounded-2xl border border-border/60 bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground text-2xl font-bold">
              L
            </div>
            <h1 className="text-center text-2xl font-semibold">logdd</h1>
            <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
              {vi
                ? "Đăng nhập để đồng bộ tài khoản, gói sử dụng và thiết bị của bạn."
                : "Sign in to sync your account, plan, and registered device."}
            </p>
            <Button className="mt-7 w-full h-11" disabled={signingIn} onClick={() => void handleGoogleSignIn()}>
              {signingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {vi ? "Đăng nhập bằng Google" : "Continue with Google"}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {vi ? "Phiên đăng nhập sẽ được lưu cho lần mở app sau." : "Your session is saved for the next launch."}
            </p>
          </section>
        </div>
      </div>
    );
  }

  const blockedMessage = blockedReason === "device_limit"
    ? (vi ? "Tài khoản đã đạt giới hạn thiết bị. Hãy gỡ thiết bị cũ hoặc tăng số máy được phép trong Supabase." : "This account has reached its device limit.")
    : blockedReason === "blocked"
      ? (vi ? "Tài khoản này đang bị khóa." : "This account is blocked.")
      : (vi ? "Tài khoản không được phép sử dụng trên thiết bị này." : "This account cannot be used on this device.");

  return (
    <>
      {children}

      {checkingAccess && (
        <div className="fixed right-4 top-4 z-[80] flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          {vi ? "Đang kiểm tra tài khoản..." : "Checking account..."}
        </div>
      )}

      <AlertDialog open={Boolean(blockedReason || accessError)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <AlertDialogTitle>
              {accessError
                ? (vi ? "Không thể kiểm tra tài khoản" : "Account check failed")
                : (vi ? "Không thể sử dụng tài khoản" : "Account unavailable")}
            </AlertDialogTitle>
            <AlertDialogDescription>{accessError || blockedMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => void handleSignOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              {vi ? "Đăng xuất" : "Sign out"}
            </Button>
            <Button onClick={() => void runAccessCheck(session)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {vi ? "Kiểm tra lại" : "Retry"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={nameDialogOpen} onOpenChange={() => undefined}>
        <DialogContent className="max-w-sm" onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <DialogTitle>{vi ? "Tên hiển thị của bạn" : "Your display name"}</DialogTitle>
            <DialogDescription>
              {vi ? "Tên này sẽ xuất hiện trên giao diện app. Bạn có thể sửa lại sau." : "This name is shown in the app UI."}
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={draftName}
            placeholder={vi ? "Nhập tên của bạn" : "Enter your name"}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && draftName.trim()) void handleSaveName();
            }}
          />
          <DialogFooter>
            <Button className="w-full" disabled={!draftName.trim() || savingName} onClick={() => void handleSaveName()}>
              {savingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {vi ? "Lưu và tiếp tục" : "Save and continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
