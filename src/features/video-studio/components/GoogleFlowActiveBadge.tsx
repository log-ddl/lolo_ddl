"use client";

import { useEffect } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { useGoogleFlowRuntimeStore } from '@/features/video-studio/stores/google-flow-runtime-store';

export function GoogleFlowActiveBadge() {
  const { status, tasks, initialize } = useGoogleFlowRuntimeStore();
  useEffect(() => initialize(), [initialize]);
  if (!status?.readyCredentialCount) return null;
  const active = Object.values(tasks).filter((task) => !['completed', 'failed', 'cancelled'].includes(task.status)).length;
  return <Badge variant="secondary" className="text-[10px] font-medium">Google Flow {active ? `đang chạy ${active}` : `sẵn sàng ${status.readyCredentialCount}`}</Badge>;
}
