import type { ElementType } from "react";
import { LockKeyhole, Sparkles } from "lucide-react";
import { FeatureRail } from "@/shared/components/FeatureRail";
import { hasPlanAccess, type LicensePlan } from "@/shared/lib/license-client";
import { useLicenseStore } from "@/shared/stores/license-store";
import { useI18n } from "@/shared/i18n";

interface FeaturePlaceholderProps {
  icon: ElementType;
  titleKey: string;
  descriptionKey: string;
  requiredPlan?: LicensePlan;
}

export function FeaturePlaceholder({ icon: Icon, titleKey, descriptionKey, requiredPlan }: FeaturePlaceholderProps) {
  const { t } = useI18n();
  const licensePlan = useLicenseStore((state) => state.plan);
  const canUseFeature = !requiredPlan || hasPlanAccess(licensePlan, requiredPlan);

  return (
    <div className="h-full flex bg-background text-foreground">
      <FeatureRail />

      <main className="relative flex-1 overflow-hidden content-edge">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 right-[-8rem] h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-12rem] left-[15%] h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative h-full flex items-center justify-center p-8">
          <section className="w-full max-w-2xl rounded-3xl border border-border/60 bg-card/80 p-10 text-center shadow-sm backdrop-blur-xl">
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="h-8 w-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              {requiredPlan ? requiredPlan.toUpperCase() : t("featurePlaceholder.badge")}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-3">{t(titleKey)}</h1>
            <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">{t(descriptionKey)}</p>
            <div className={canUseFeature
              ? "mt-8 rounded-2xl border border-border/60 bg-muted/30 px-5 py-4"
              : "mt-8 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-4"
            }>
              <p className="flex items-center justify-center gap-2 text-sm font-medium">
                {!canUseFeature && <LockKeyhole className="h-4 w-4 text-amber-500" />}
                {t(canUseFeature ? "featurePlaceholder.ready" : "featurePlaceholder.previewOnly")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(canUseFeature ? "featurePlaceholder.note" : "featurePlaceholder.unlimitedRequired")}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
