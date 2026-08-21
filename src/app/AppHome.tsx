import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { appFeatures } from "@/features/feature-registry";
import type { AppFeatureId } from "@/shared/stores/app-shell-store";
import { useAppShellStore } from "@/shared/stores/app-shell-store";
import { hasPlanAccess } from "@/shared/lib/license-client";
import { useLicenseStore } from "@/shared/stores/license-store";
import { FeatureRail } from "@/shared/components/FeatureRail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useI18n } from "@/shared/i18n";

interface AppHomeProps {
  blockedFeatureId?: AppFeatureId;
}

export function AppHome({ blockedFeatureId }: AppHomeProps) {
  const { t } = useI18n();
  const openFeature = useAppShellStore((state) => state.openFeature);
  const goHome = useAppShellStore((state) => state.goHome);
  const licensePlan = useLicenseStore((state) => state.plan);
  const [lockedFeatureId, setLockedFeatureId] = useState<AppFeatureId | null>(null);
  const effectiveLockedFeatureId = blockedFeatureId ?? lockedFeatureId;
  const lockedFeature = appFeatures.find((feature) => feature.id === effectiveLockedFeatureId);

  useEffect(() => {
    const preloadFeatures = () => {
      for (const feature of appFeatures) {
        if (feature.preloadOnIdle && hasPlanAccess(licensePlan, feature.requiredPlan)) {
          void feature.preload();
        }
      }
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadFeatures, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(preloadFeatures, 250);
    return () => globalThis.clearTimeout(timeoutId);
  }, [licensePlan]);

  const closePlanDialog = () => {
    setLockedFeatureId(null);
    if (blockedFeatureId) goHome();
  };

  return (
    <div className="h-full flex bg-background text-foreground">
      <FeatureRail />

      <main className="relative flex-1 overflow-y-auto content-edge">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 right-[-8rem] h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-12rem] left-[15%] h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-8 py-14">
          <div className="max-w-2xl mb-10">
            <h1 className="text-3xl font-semibold tracking-tight mb-3">{t("appHome.title")}</h1>
            <p className="text-sm leading-6 text-muted-foreground">{t("appHome.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {appFeatures.map((feature) => {
              const Icon = feature.icon;
              const canUseFeature = hasPlanAccess(licensePlan, feature.requiredPlan);
              return (
                <button
                  key={feature.id}
                  type="button"
                  aria-disabled={!canUseFeature}
                  onClick={() => canUseFeature ? openFeature(feature.id) : setLockedFeatureId(feature.id)}
                  onPointerEnter={() => {
                    if (canUseFeature) void feature.preload();
                  }}
                  onFocus={() => {
                    if (canUseFeature) void feature.preload();
                  }}
                  className={`group flex min-h-56 flex-col items-stretch justify-start text-left rounded-xl border bg-card/80 p-6 shadow-xs transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    canUseFeature
                      ? "border-border/70 hover:border-primary/40"
                      : "border-border/50 opacity-70 hover:border-amber-500/35"
                  }`}
                >
                  <div className="flex items-start justify-between mb-10">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.18em] text-primary">
                        {feature.requiredPlan}
                      </span>
                      {canUseFeature
                        ? <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                        : <LockKeyhole className="h-5 w-5 text-amber-500" />}
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{t(feature.descriptionKey)}</p>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <AlertDialog open={Boolean(lockedFeature)} onOpenChange={(open) => {
        if (!open) closePlanDialog();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("appHome.planRequiredTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("appHome.planRequiredDescription", {
                feature: lockedFeature ? t(lockedFeature.titleKey) : "",
                plan: lockedFeature?.requiredPlan.toUpperCase() ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closePlanDialog}>{t("appHome.planRequiredClose")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
