import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { AudioLines, Film, MessageSquareText, Scissors, Telescope } from "lucide-react";
import type { AppFeatureId } from "@/shared/stores/app-shell-store";
import type { LicensePlan } from "@/shared/lib/license-client";

export interface AppFeatureDefinition {
  id: AppFeatureId;
  titleKey: string;
  descriptionKey: string;
  icon: ComponentType<{ className?: string }>;
  component: LazyExoticComponent<ComponentType>;
  preload: () => Promise<unknown>;
  preloadOnIdle?: boolean;
  requiredPlan: LicensePlan;
}

const loadVideoStudio = () => import("@/features/video-studio/entry");
const loadContentChat = () => import("@/features/content-chat/entry");
const loadResearchMonitor = () => import("@/features/research-monitor/entry");
const loadTtsVoice = () => import("@/features/tts-voice/entry");
const loadAutoEdit = () => import("@/features/auto-edit/entry");

export const appFeatures: AppFeatureDefinition[] = [
  {
    id: "video-studio",
    titleKey: "appHome.videoStudio.title",
    descriptionKey: "appHome.videoStudio.description",
    icon: Film,
    component: lazy(loadVideoStudio),
    preload: loadVideoStudio,
    preloadOnIdle: true,
    requiredPlan: "pro",
  },
  {
    id: "content-chat",
    titleKey: "appHome.contentChat.title",
    descriptionKey: "appHome.contentChat.description",
    icon: MessageSquareText,
    component: lazy(loadContentChat),
    preload: loadContentChat,
    requiredPlan: "dev",
  },
  {
    id: "research-monitor",
    titleKey: "appHome.researchMonitor.title",
    descriptionKey: "appHome.researchMonitor.description",
    icon: Telescope,
    component: lazy(loadResearchMonitor),
    preload: loadResearchMonitor,
    requiredPlan: "unlimited",
  },
  {
    id: "tts-voice",
    titleKey: "appHome.ttsVoice.title",
    descriptionKey: "appHome.ttsVoice.description",
    icon: AudioLines,
    component: lazy(loadTtsVoice),
    preload: loadTtsVoice,
    requiredPlan: "free",
  },
  {
    id: "auto-edit",
    titleKey: "appHome.autoEdit.title",
    descriptionKey: "appHome.autoEdit.description",
    icon: Scissors,
    component: lazy(loadAutoEdit),
    preload: loadAutoEdit,
    requiredPlan: "unlimited",
  },
];
