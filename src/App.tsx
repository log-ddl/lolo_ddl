import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/app/AppShell";
import { Toaster } from "@/shared/components/ui/sonner";
import { LicenseGate } from "@/shared/components/LicenseGate";
import { StartupUpdateGuard } from "@/shared/components/StartupUpdateGuard";
import { GlobalSettingsDialog } from "@/shared/components/GlobalSettingsDialog";
import { useThemeStore } from "@/shared/stores/theme-store";
import { useI18n } from "@/shared/i18n";
import { migrateUIPreferencesFromLegacy } from "@/shared/stores/ui-preferences-store";

function App() {
  const { theme } = useThemeStore();
  const { language } = useI18n();
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void migrateUIPreferencesFromLegacy().finally(() => {
      if (!cancelled) setPreferencesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync the active theme and locale onto the root HTML element.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.lang = language;
  }, [language, theme]);

  if (!preferencesReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <StartupUpdateGuard>
        <LicenseGate>
          <AppShell />
        </LicenseGate>
        <GlobalSettingsDialog />
      </StartupUpdateGuard>
      <Toaster richColors position="top-center" />
    </div>
  );
}

export default App;
