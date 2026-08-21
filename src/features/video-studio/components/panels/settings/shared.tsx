import { Link2, Play, Settings } from "lucide-react";
import {
  GOOGLE_FLOW_IMAGE_MODELS,
  GOOGLE_FLOW_VIDEO_MODELS,
  GROK_VIDEO_MODELS,
} from "@/features/video-studio/lib/api-key-manager";
import type { IProvider } from "@/features/video-studio/stores/api-config-store";

// Platform icon mapping
export const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  openrouter: <Link2 className="h-5 w-5" />,
  googleflow: <Play className="h-5 w-5" />,
  grok: <Play className="h-5 w-5" />,
  custom: <Settings className="h-5 w-5" />,
};

export type MediaModelKind = 'image' | 'video';

/** Platforms driven by a real Chrome session instead of an API key. */
export function isBrowserRuntimePlatform(platform: string): boolean {
  return platform === 'googleflow' || platform === 'grok';
}

export function getProviderMediaModels(provider: IProvider, kind: MediaModelKind): string[] {
  if (provider.platform === 'googleflow') {
    return kind === 'image' ? GOOGLE_FLOW_IMAGE_MODELS : GOOGLE_FLOW_VIDEO_MODELS;
  }
  if (provider.platform === 'grok') {
    return kind === 'video' ? GROK_VIDEO_MODELS : [];
  }
  return [];
}

export function getProviderDisplayName(provider: { platform: string; name: string }) {
  return provider.platform === 'googleflow' ? 'Google Flow' : provider.platform === 'grok' ? 'Grok' : provider.name;
}
