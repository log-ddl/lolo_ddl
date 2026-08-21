import { useEffect, useState } from "react";
import { UpdateDialog } from "@/shared/components/UpdateDialog";
import type { AvailableUpdateInfo } from "@/shared/types/update";

export function StartupUpdateGuard({ children }: { children: React.ReactNode }) {
  const [updateInfo, setUpdateInfo] = useState<AvailableUpdateInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void window.appUpdater?.checkForUpdates().then((result) => {
        if (!cancelled && result.success && result.hasUpdate && result.update) {
          setUpdateInfo(result.update);
        }
      }).catch(() => {
        // A failed update check must not delay normal sign-in or app startup.
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {children}
      <UpdateDialog
        mandatory
        open={Boolean(updateInfo)}
        onOpenChange={() => undefined}
        updateInfo={updateInfo}
      />
    </>
  );
}
