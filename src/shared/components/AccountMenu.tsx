import { useRef, useState } from "react";
import { Camera, Loader2, LogOut, Pencil, Save, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { useAccountProfileStore } from "@/shared/stores/account-profile-store";
import { useLicenseStore } from "@/shared/stores/license-store";
import { getLocale, useI18n } from "@/shared/i18n";
import { signOutAccount, updateDisplayName } from "@/shared/lib/license-client";
import { Input } from "@/shared/components/ui/input";

const MAX_AVATAR_SIZE = 256;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "L";
  return parts.slice(-2).map((part) => part[0]).join("").toUpperCase();
}

function formatAccountDate(value: string | number | undefined, locale: string, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function createLocalAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("invalid-image");

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("invalid-image"));
      nextImage.src = sourceUrl;
    });

    const scale = Math.min(1, MAX_AVATAR_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("invalid-image");
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/webp", 0.84);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function AvatarPreview({ src, name, size = "small" }: { src: string; name: string; size?: "small" | "large" }) {
  const sizeClass = size === "large" ? "h-20 w-20 text-xl" : "h-7 w-7 text-2xs";
  return src ? (
    <img
      src={src}
      alt=""
      className={`${sizeClass} rounded-full border border-border object-cover bg-muted`}
    />
  ) : (
    <div className={`${sizeClass} rounded-full border border-primary/20 bg-primary/10 text-primary flex items-center justify-center font-semibold`}>
      {name ? getInitials(name) : <UserRound className={size === "large" ? "h-8 w-8" : "h-3.5 w-3.5"} />}
    </div>
  );
}

export function AccountSidebarButton() {
  const { t, language } = useI18n();
  const locale = getLocale(language);
  const inputRef = useRef<HTMLInputElement>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const avatarDataUrl = useAccountProfileStore((state) => state.avatarDataUrl);
  const setAvatarDataUrl = useAccountProfileStore((state) => state.setAvatarDataUrl);
  const clearAvatar = useAccountProfileStore((state) => state.clearAvatar);
  const {
    userName,
    email,
    plan,
    registeredAt,
    lastValidUntil,
    lastCheckedAt,
    machineId,
    maxDevices,
    setUserName,
    clearAccount,
  } = useLicenseStore();
  const [draftName, setDraftName] = useState(userName);
  const fallback = t("account.notAvailable");

  const handleAvatarFile = async (file?: File) => {
    if (!file) return;
    setProcessingImage(true);
    try {
      setAvatarDataUrl(await createLocalAvatar(file));
      toast.success(t("account.avatarUpdated"));
    } catch {
      toast.error(t("account.invalidImage"));
    } finally {
      setProcessingImage(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleSaveName = async () => {
    const name = draftName.trim();
    if (!name) return;
    setSavingName(true);
    try {
      await updateDisplayName(name);
      setUserName(name);
      setEditingName(false);
      toast.success(language === "vi" ? "Đã cập nhật tên hiển thị" : "Display name updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot update display name");
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutAccount();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot sign out");
    } finally {
      clearAccount();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          title={userName || t("account.title")}
          className="flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <AvatarPreview src={avatarDataUrl} name={userName} />
          <span className="block w-full truncate px-0.5 text-center text-2xs font-medium leading-tight">
            {userName || t("account.title")}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("account.title")}</DialogTitle>
          <DialogDescription>{t("account.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <AvatarPreview src={avatarDataUrl} name={userName} size="large" />
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
                <Button size="icon" disabled={!draftName.trim() || savingName} onClick={() => void handleSaveName()}>
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{userName || fallback}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setDraftName(userName);
                    setEditingName(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <p className="mt-1 truncate text-xs text-muted-foreground">{email || fallback}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleAvatarFile(event.target.files?.[0])}
              />
              <Button size="sm" variant="outline" disabled={processingImage} onClick={() => inputRef.current?.click()}>
                {processingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                {t("account.changeAvatar")}
              </Button>
              {avatarDataUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    clearAvatar();
                    toast.success(t("account.avatarRemoved"));
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("account.removeAvatar")}
                </Button>
              )}
            </div>
            <p className="mt-2 text-2xs text-muted-foreground">{t("account.localAvatarHint")}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border/60 p-3">
            <dt className="text-xs text-muted-foreground">{t("account.name")}</dt>
            <dd className="mt-1 truncate font-medium">{userName || fallback}</dd>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <dt className="text-xs text-muted-foreground">{t("account.plan")}</dt>
            {/* ui-ok: plan tier is a short token (PRO/FREE) */}
            <dd className="mt-1 font-medium uppercase text-primary">{plan}</dd>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <dt className="text-xs text-muted-foreground">{language === "vi" ? "Ngày đăng ký" : "Registered"}</dt>
            <dd className="mt-1 font-medium">{formatAccountDate(registeredAt, locale, fallback)}</dd>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <dt className="text-xs text-muted-foreground">{t("account.expiresAt")}</dt>
            <dd className="mt-1 font-medium">
              {lastValidUntil ? formatAccountDate(lastValidUntil, locale, fallback) : t("account.noExpiration")}
            </dd>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <dt className="text-xs text-muted-foreground">{t("account.lastCheckedAt")}</dt>
            <dd className="mt-1 font-medium">{formatAccountDate(lastCheckedAt, locale, fallback)}</dd>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <dt className="text-xs text-muted-foreground">{language === "vi" ? "Số máy được phép" : "Allowed devices"}</dt>
            <dd className="mt-1 font-medium">{maxDevices}</dd>
          </div>
          <div className="col-span-2 rounded-lg border border-border/60 p-3">
            <dt className="text-xs text-muted-foreground">{t("account.machineId")}</dt>
            <dd className="mt-1 break-all font-mono text-xs">{machineId || fallback}</dd>
          </div>
        </dl>

        <Button variant="outline" className="w-full" onClick={() => void handleSignOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          {language === "vi" ? "Đăng xuất" : "Sign out"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
