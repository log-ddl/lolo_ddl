import type { ComponentType } from "react";

import { cn } from "@/shared/lib/utils";

export function FeatureHeaderIcon({
  className,
  icon: Icon,
}: {
  className?: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary",
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
