"use client";

/** Small completion-status chips shown in the Script property panel. */

import { useI18n } from "@/shared/i18n";
import type { CompletionStatus } from "@/features/video-studio/types/script";
import type { PromptTargetStatus } from "@/features/video-studio/lib/script/shot-utils";

export function StatusBadge({ status }: { status?: CompletionStatus }) {
  const { t } = useI18n();
  const config = {
    pending: { label: t("property.status.pending"), className: "bg-muted text-muted-foreground" },
    in_progress: { label: t("property.status.inProgress"), className: "bg-yellow-500/10 text-yellow-600" },
    completed: { label: t("property.status.completed"), className: "bg-green-500/10 text-green-600" },
  };
  const { label, className } = config[status || "pending"];
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${className}`}>
      {label}
    </span>
  );
}

export function PromptStatusBadge({ label, status }: { label: string; status: PromptTargetStatus }) {
  const { t } = useI18n();
  const className = status === 'ready'
    ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300'
    : status === 'missing'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      : 'border-muted bg-muted/50 text-muted-foreground';
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${className}`}>{label}: {t(`promptStatus.${status === 'not-required' ? 'notRequired' : status}`)}</span>;
}

// Episode details
