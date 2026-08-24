"use client";

/**
 * Feature Binding Panel (multi-select mode).
 * Provides a searchable multi-select model picker for each feature.
 */

import { useCallback, useMemo, useState } from "react";
import { useAPIConfigStore, type AIFeature } from "@/features/video-studio/stores/api-config-store";
import {
  getModelDisplayName,
  isProviderCredentialConfigured,
  classifyModelByName,
  type ModelCapability,
} from "@/features/video-studio/lib/api-key-manager";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  FileText,
  Image,
  Video,
  ScanEye,
  Link2,
  Check,
  X,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Search,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ReactNode } from "react";
import { useI18n } from "@/shared/i18n";

/** Provider/model option for a feature binding. */
interface ProviderOption {
  providerId: string;
  platform: string;
  name: string;
  model: string;
}

interface FeatureMeta {
  key: AIFeature;
  nameKey: string;
  descriptionKey: string;
  icon: ReactNode;
  requiredCapability?: ModelCapability;
  /** Recommended model hint shown in a highlighted banner. */
  recommendationKey?: string;
}

const FEATURE_CONFIGS: FeatureMeta[] = [
  {
    key: "script_analysis",
    nameKey: "featureBindings.scriptAnalysis",
    descriptionKey: "featureBindings.scriptAnalysisDesc",
    icon: <FileText className="h-4 w-4" />,
    requiredCapability: "text",
  },
  {
    key: "character_generation",
    nameKey: "featureBindings.imageGeneration",
    descriptionKey: "featureBindings.imageGenerationDesc",
    icon: <Image className="h-4 w-4" />,
    requiredCapability: "image_generation",
    recommendationKey: "featureBindings.imageRec",
  },
  {
    key: "video_generation",
    nameKey: "featureBindings.videoGeneration",
    descriptionKey: "featureBindings.videoGenerationDesc",
    icon: <Video className="h-4 w-4" />,
    requiredCapability: "video_generation",
    recommendationKey: "featureBindings.videoRec",
  },
  {
    key: "image_understanding",
    nameKey: "featureBindings.imageUnderstanding",
    descriptionKey: "featureBindings.imageUnderstandingDesc",
    icon: <ScanEye className="h-4 w-4" />,
    requiredCapability: "vision",
  },
];

function getOptionKey(option: ProviderOption): string {
  return `${option.providerId}:${option.model}`;
}

function parseOptionKey(key: string): { providerIdOrPlatform: string; model: string } | null {
  const idx = key.indexOf(":");
  if (idx <= 0) return null;
  const providerIdOrPlatform = key.slice(0, idx);
  const model = key.slice(idx + 1);
  if (!providerIdOrPlatform || !model) return null;
  return { providerIdOrPlatform, model };
}

const DEFAULT_PLATFORM_CAPABILITIES: Record<string, ModelCapability[]> = {
  openrouter: ["text", "vision"],
};

/**
 * Per-model capability mapping.
 * Gives precise control over which service-mapping buckets a model can appear in.
 * Unlisted models fall back to platform-level capability inference.
 */
const MODEL_CAPABILITIES: Record<string, ModelCapability[]> = {

  // ---- Chat / text models ----
  'glm-4.7': ['text', 'function_calling'],
  'glm-4.6v': ['text', 'vision'],
  'deepseek-v3': ['text'],
  'deepseek-v3.2': ['text'],
  'deepseek-r1': ['text', 'reasoning'],
  'kimi-k2': ['text'],
  'MiniMax-M2.1': ['text'],
  'qwen3-max': ['text'],
  'qwen3-max-preview': ['text'],
  'gemini-2.0-flash': ['text'],
  'gemini-3-flash-preview': ['text'],
  'gemini-3-pro-preview': ['text'],
  'claude-haiku-4-5-20251001': ['text', 'vision'],

  // ---- Image-generation models ----
  'cogview-3-plus': ['image_generation'],
  'gemini-imagen': ['image_generation'],
  'gemini-3-pro-image-preview': ['image_generation'],
  'gpt-image-1.5': ['image_generation'],

  // ---- Video-generation models ----
  'cogvideox': ['video_generation'],
  'gemini-veo': ['video_generation'],
  'doubao-seedance-1-5-pro': ['video_generation'],
  'doubao-seedance-1-5-pro-251215': ['video_generation'],
  'doubao-seedream-4-5-251128': ['image_generation'],
  'veo3.1': ['video_generation'],
  'sora-2-all': ['video_generation'],
  'wan2.6-i2v': ['video_generation'],
  'grok-video-3': ['video_generation'],
  'grok-video-3-10s': ['video_generation'],
  'grok-video-3-15s': ['video_generation'],

  // ---- Vision / image-understanding models ----
  'doubao-vision': ['vision'],
};

function providerSupportsCapability(
  provider: { platform: string; capabilities?: ModelCapability[] },
  required?: ModelCapability
): boolean {
  if (!required) return true;

  const explicitCaps = provider.capabilities && provider.capabilities.length > 0
    ? provider.capabilities
    : undefined;

  const caps = explicitCaps || DEFAULT_PLATFORM_CAPABILITIES[provider.platform];

  // If we still don't know, treat as "unknown" and allow selection.
  if (!caps || caps.length === 0) return true;

  return caps.includes(required);
}

/**
 * Check whether a given model supports the required capability.
 * Priority: hard-coded mapping -> provider metadata (model_type/tags) -> model-name inference -> platform fallback.
 */
function modelSupportsCapability(
  modelName: string,
  provider: { platform: string; capabilities?: ModelCapability[] },
  required?: ModelCapability,
  modelType?: string,     // Provider-level type metadata
  modelTagsList?: string[] // Provider-level tag metadata
): boolean {
  if (!required) return true;

  // 1. Hard-coded mapping for a small set of known models.
  const modelCaps = MODEL_CAPABILITIES[modelName];
  if (modelCaps) {
    return modelCaps.includes(required);
  }

  // 2. Provider metadata from /api/pricing_new (model_type + tags).
  if (modelType) {
    switch (required) {
      case 'text':
        return modelType === '\u6587\u672c';
      case 'image_generation':
        return modelType === '\u56fe\u50cf';
      case 'video_generation':
        // For audio-video types, keep only models tagged as video (exclude pure audio/TTS/music models).
        return modelType === '\u97f3\u89c6\u9891' && (modelTagsList?.some(t => t.includes('\u89c6\u9891')) ?? false);
      case 'vision':
        // Vision capability can cross model types; rely on tags like image-understanding or multimodal.
        return modelTagsList?.some(t => t.includes('\u8bc6\u56fe') || t.includes('\u591a\u6a21\u6001')) ?? false;
      case 'embedding':
        return modelType === '\u68c0\u7d22';
      default:
        break;
    }
  }

  // 3. Model-name pattern inference.
  const inferred = classifyModelByName(modelName);
  if (inferred.length > 0) {
    return inferred.includes(required);
  }

  // 4. Platform-level fallback.
  return providerSupportsCapability(provider, required);
}

export function FeatureBindingPanel() {
  const { t } = useI18n();
  const {
    providers,
    modelTypes,
    modelTags,
    toggleFeatureBinding,
    getFeatureBindings,
  } = useAPIConfigStore();

  const getProviderDisplayName = (provider: { platform: string; name: string }) => provider.name;
  
  // Track expanded/collapsed sections.
  const [expandedFeatures, setExpandedFeatures] = useState<Set<AIFeature>>(new Set());

  const configuredProviderIds = useMemo(() => {
    const set = new Set<string>();
    for (const p of providers) {
      if (isProviderCredentialConfigured(p.platform, p.apiKey)) {
        set.add(p.id);
        // Include platform as well for legacy-data compatibility checks.
        set.add(p.platform);
      }
    }
    return set;
  }, [providers]);

  const isProviderConfigured = useCallback((providerIdOrPlatform: string): boolean => {
    return configuredProviderIds.has(providerIdOrPlatform);
  }, [configuredProviderIds]);

  const optionsByFeature = useMemo(() => {
    const map: Partial<Record<AIFeature, ProviderOption[]>> = {};

    for (const feature of FEATURE_CONFIGS) {
      const opts: ProviderOption[] = [];

      for (const provider of providers) {
        const models = (provider.model || [])
          .map((m) => m.trim())
          .filter((m) => m.length > 0);

        for (const model of models) {
          // Use platform metadata (model_type/tags) for precise categorization.
          const mType = modelTypes[model];
          const mTags = modelTags[model];
          if (!modelSupportsCapability(model, provider, feature.requiredCapability, mType, mTags)) continue;
          opts.push({
            providerId: provider.id,
            platform: provider.platform,
            name: provider.name,
            model,
          });
        }
      }

      // Prefer configured providers first for better UX.
      opts.sort((a, b) => {
        const aConfigured = isProviderConfigured(a.providerId);
        const bConfigured = isProviderConfigured(b.providerId);
        if (aConfigured !== bConfigured) return aConfigured ? -1 : 1;
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return a.model.localeCompare(b.model);
      });

      map[feature.key] = opts;
    }

    return map;
  }, [providers, modelTypes, modelTags, isProviderConfigured]);

  // Count configured features that have at least one valid binding.
  const configuredCount = useMemo(() => {
    return FEATURE_CONFIGS.filter((feature) => {
      const bindings = getFeatureBindings(feature.key);
      if (bindings.length === 0) return false;
      
      // Check whether there is at least one valid binding.
      const options = optionsByFeature[feature.key] || [];
      return bindings.some(binding => {
        const parsed = parseOptionKey(binding);
        if (!parsed) return false;
        const existsInOptions = options.some((o) => getOptionKey(o) === binding || (`${o.platform}:${o.model}` === binding));
        return existsInOptions && isProviderConfigured(parsed.providerIdOrPlatform);
      });
    }).length;
  }, [optionsByFeature, getFeatureBindings, isProviderConfigured]);

  // Toggle one model binding
  const handleToggleBinding = (feature: FeatureMeta, optionKey: string) => {
    const parsed = parseOptionKey(optionKey);
    if (!parsed) return;
    toggleFeatureBinding(feature.key, optionKey);
  };
  
  // Toggle expanded/collapsed state
  const toggleExpanded = (feature: AIFeature) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feature)) {
        newSet.delete(feature);
      } else {
        newSet.add(feature);
      }
      return newSet;
    });
  };

  // Per-feature search query
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});

  return (
    <div className="p-6 border border-border rounded-xl bg-card space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          {t("featureBindings.title")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("featureBindings.configured", { count: configuredCount, total: FEATURE_CONFIGS.length })}
        </span>
      </div>

      {/* Service Mapping Table - Multi-Select */}
      <div className="grid gap-3">
        {FEATURE_CONFIGS.map((feature) => {
          const options = optionsByFeature[feature.key] || [];
          const currentBindings = getFeatureBindings(feature.key);
          const isExpanded = expandedFeatures.has(feature.key);
          // Split bindings into valid and invalid entries.
          const validBindings: string[] = [];
          const invalidBindings: string[] = [];
          for (const binding of currentBindings) {
            const parsed = parseOptionKey(binding);
            if (!parsed) {
              invalidBindings.push(binding);
              continue;
            }
            const existsInOptions = options.some((o) => getOptionKey(o) === binding || (`${o.platform}:${o.model}` === binding));
            if (existsInOptions && isProviderConfigured(parsed.providerIdOrPlatform)) {
              validBindings.push(binding);
            } else {
              invalidBindings.push(binding);
            }
          }
          const configured = validBindings.length > 0;

          return (
            <div
              key={feature.key}
              className={cn(
                "rounded-lg border transition-all",
                configured
                  ? "bg-primary/5 border-primary/30"
                  : "bg-destructive/5 border-destructive/30"
              )}
            >
              {/* Header - Click to expand */}
              <div 
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => toggleExpanded(feature.key)}
              >
                {/* Service Info */}
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      configured
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium text-foreground cursor-pointer">
                        {t(feature.nameKey)}
                      </Label>
                      {configured ? (
                        <Check className="h-3 w-3 text-primary shrink-0" />
                      ) : (
                        <X className="h-3 w-3 text-destructive shrink-0" />
                      )}
                      {validBindings.length > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                          {t("featureBindings.modelCount", { count: validBindings.length })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {t(feature.descriptionKey)}
                    </p>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              {/* Expanded: searchable model selection */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-border/60">
                  {options.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      {t("featureBindings.noModels")}
                    </p>
                  ) : (
                    <div className="space-y-3 pt-3">
                      <p className="text-xs text-muted-foreground">
                        {t("featureBindings.multiSelectHint")}
                      </p>

                      {/* Recommended model hint */}
                      {feature.recommendationKey && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                          <span className="text-sm font-bold text-red-600 dark:text-red-400 leading-relaxed">
                            {t(feature.recommendationKey)}
                          </span>
                        </div>
                      )}

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder={t("featureBindings.searchPlaceholder")}
                          value={searchQuery[feature.key] || ''}
                          onChange={(e) => setSearchQuery(prev => ({ ...prev, [feature.key]: e.target.value }))}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>

                      {(() => {
                        const query = (searchQuery[feature.key] || '').toLowerCase();
                        const filteredOptions = options.filter((option) => {
                          if (!query) return true;
                          return option.model.toLowerCase().includes(query)
                            || getModelDisplayName(option.model).toLowerCase().includes(query)
                            || getProviderDisplayName(option).toLowerCase().includes(query);
                        });

                        return (
                          <div className="space-y-1 max-h-[280px] overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2 text-center">
                                {t("featureBindings.noMatches")}
                              </p>
                            ) : (
                              filteredOptions.map((option) => {
                                const optionKey = getOptionKey(option);
                                const optionConfigured = isProviderConfigured(option.providerId);
                                const legacyKey = `${option.platform}:${option.model}`;
                                const isSelected = currentBindings.includes(optionKey) || currentBindings.includes(legacyKey);

                                return (
                                  <label
                                    key={optionKey}
                                    className={cn(
                                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                      isSelected
                                        ? "bg-primary/10 border border-primary/30"
                                        : "hover:bg-accent/50 border border-transparent",
                                      !optionConfigured && "opacity-50"
                                    )}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleToggleBinding(feature, optionKey)}
                                      disabled={!optionConfigured}
                                    />
                                    <span className="text-xs font-mono text-foreground break-all">
                                      {getModelDisplayName(option.model)}
                                    </span>
                                    <span className="text-2xs text-muted-foreground ml-auto shrink-0">
                                      {getProviderDisplayName(option)}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Summary */}
      {configuredCount < FEATURE_CONFIGS.length && (
        <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-xs">
              <p className="font-medium text-destructive">
                {t("featureBindings.incompleteTitle")}
              </p>
              <p className="text-muted-foreground mt-1">
                {t("featureBindings.incompleteBody")}
              </p>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-2">
        <p>
          <strong>{t("featureBindings.tip")}</strong>
          {t("featureBindings.helpRotation")}
        </p>
        <p>
          <strong>{t("featureBindings.note")}</strong>
          {t("featureBindings.helpSource")}
        </p>
      </div>
    </div>
  );
}
