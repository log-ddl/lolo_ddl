"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import type { AvailableUpdateInfo } from "@/shared/types/update";
import { useI18n } from "@/shared/i18n";

interface UpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateInfo: AvailableUpdateInfo | null;
  onIgnoreVersion?: (version: string) => void;
  mandatory?: boolean;
}

export function UpdateDialog({
  open,
  onOpenChange,
  updateInfo,
  onIgnoreVersion,
  mandatory = false,
}: UpdateDialogProps) {
  const { locale, t } = useI18n();
  const [isInstalling, setIsInstalling] = useState(false);
  const formattedPublishedAt = useMemo(() => {
    if (!updateInfo?.publishedAt) return "";
    const publishedDate = new Date(updateInfo.publishedAt);
    if (Number.isNaN(publishedDate.getTime())) {
      return updateInfo.publishedAt;
    }
    return publishedDate.toLocaleString(locale);
  }, [locale, updateInfo?.publishedAt]);

  const handleDownloadAndInstall = async () => {
    if (!window.appUpdater) {
      toast.error(t("update.desktopOnly"));
      return;
    }
    setIsInstalling(true);
    try {
      const result = await window.appUpdater.downloadAndInstall();
      if (!result.success) {
        toast.error(result.error || t("update.installFailed"));
        setIsInstalling(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("update.installFailed"));
      setIsInstalling(false);
    }
  };

  if (!updateInfo) return null;

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!mandatory || nextOpen) onOpenChange(nextOpen);
    }}>
      <AlertDialogContent
        className="max-w-xl"
        onEscapeKeyDown={mandatory ? (event) => event.preventDefault() : undefined}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t("update.newVersion", { version: updateInfo.latestVersion })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("update.upgradeAvailable", {
              currentVersion: updateInfo.currentVersion,
              latestVersion: updateInfo.latestVersion,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t("update.releaseNotes")}</p>
                {formattedPublishedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("update.publishedAt", { date: formattedPublishedAt })}
                  </p>
                )}
              </div>
              <div className="text-xs text-muted-foreground rounded border border-border px-2 py-1 font-mono">
                v{updateInfo.currentVersion} → v{updateInfo.latestVersion}
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-6">
              {updateInfo.releaseNotes?.trim() || t("update.noReleaseNotes")}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t("update.installUpdate")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("update.installHint")}
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={isInstalling}
              onClick={() => void handleDownloadAndInstall()}
            >
              <Download className="h-4 w-4 mr-2" />
              {isInstalling ? t("update.installing") : t("update.installNow")}
            </Button>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          {!mandatory && onIgnoreVersion && (
            <Button
              variant="ghost"
              onClick={() => {
                onIgnoreVersion(updateInfo.latestVersion);
                onOpenChange(false);
              }}
            >
              {t("update.ignore")}
            </Button>
          )}
          {!mandatory && <AlertDialogCancel>{t("update.later")}</AlertDialogCancel>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
