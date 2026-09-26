import { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppHome } from "@/app/AppHome";
import { appFeatures } from "@/features/feature-registry";
import { hasPlanAccess } from "@/shared/lib/license-client";
import { useAppShellStore } from "@/shared/stores/app-shell-store";
import { useLicenseStore } from "@/shared/stores/license-store";

export function AppShell() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import('@/features/content-chat/mcp/renderer-tool-host').then(({ registerContentMcpToolHost }) => {
      if (!disposed) cleanup = registerContentMcpToolHost();
    });
    return () => { disposed = true; cleanup?.(); };
  }, []);
  const activeFeatureId = useAppShellStore((state) => state.activeFeatureId);
  const licensePlan = useLicenseStore((state) => state.plan);
  if (!activeFeatureId) return <AppHome />;

  const definition = appFeatures.find((feature) => feature.id === activeFeatureId);
  if (!definition) return <AppHome />;
  if (!hasPlanAccess(licensePlan, definition.requiredPlan)) {
    return <AppHome blockedFeatureId={definition.id} />;
  }
  const Feature = definition.component;

  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <Feature />
    </Suspense>
  );
}
