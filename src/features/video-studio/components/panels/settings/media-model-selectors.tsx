"use client";

/**
 * Picks which connected provider and model produce images and videos.
 *
 * The selectors fall back to the only available provider when no binding exists
 * yet; an effect persists that fallback immediately so generation uses exactly
 * what is on screen.
 */

import { useCallback, useEffect, useMemo } from "react";
import { Zap } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { getModelDisplayName } from "@/features/video-studio/lib/api-key-manager";
import { useAPIConfigStore, type AIFeature, type IProvider } from "@/features/video-studio/stores/api-config-store";
import { getProviderDisplayName, getProviderMediaModels, type MediaModelKind } from "./shared";

type MediaSelection = { provider: IProvider; model: string } | null;

export function MediaModelSelectors() {
  const { providers, setFeatureBindings, getFeatureBindings } = useAPIConfigStore();

  const mediaProviders = useMemo(
    () => providers.filter((provider) => ['googleflow', 'grok'].includes(provider.platform)),
    [providers],
  );

  const getMediaSelection = useCallback((feature: AIFeature, kind: MediaModelKind): MediaSelection => {
    const bindings = getFeatureBindings(feature);
    for (const binding of bindings) {
      const separator = binding.indexOf(':');
      if (separator <= 0) continue;
      const providerIdOrPlatform = binding.slice(0, separator);
      const model = binding.slice(separator + 1);
      const provider = mediaProviders.find((item) => item.id === providerIdOrPlatform)
        || mediaProviders.find((item) => item.platform === providerIdOrPlatform);
      if (provider && getProviderMediaModels(provider, kind).includes(model)) {
        return { provider, model };
      }
    }

    const fallbackProvider = mediaProviders[0];
    const fallbackModels = fallbackProvider ? getProviderMediaModels(fallbackProvider, kind) : [];
    const fallbackModel = fallbackModels[0] || '';
    return fallbackProvider ? { provider: fallbackProvider, model: fallbackModel } : null;
  }, [getFeatureBindings, mediaProviders]);

  const imageSelection = getMediaSelection('character_generation', 'image');
  const videoSelection = getMediaSelection('video_generation', 'video');

  const setMediaModelBinding = useCallback((feature: AIFeature, provider: IProvider, model: string) => {
    setFeatureBindings(feature, [`${provider.id}:${model}`]);
    if (feature === "character_generation") {
      setFeatureBindings("scene_generation", [`${provider.id}:${model}`]);
    }
  }, [setFeatureBindings]);

  const setMediaProvider = useCallback((feature: AIFeature, kind: MediaModelKind, providerId: string) => {
    const provider = mediaProviders.find((item) => item.id === providerId);
    if (!provider) return;
    const model = getProviderMediaModels(provider, kind)[0];
    if (model) setMediaModelBinding(feature, provider, model);
  }, [mediaProviders, setMediaModelBinding]);

  useEffect(() => {
    const ensureBinding = (feature: AIFeature, selection: MediaSelection) => {
      if (!selection) return;
      const expected = `${selection.provider.id}:${selection.model}`;
      if (!getFeatureBindings(feature).includes(expected)) {
        setFeatureBindings(feature, [expected]);
      }
    };

    ensureBinding('character_generation', imageSelection);
    ensureBinding('scene_generation', imageSelection);
    ensureBinding('video_generation', videoSelection);
  }, [
    getFeatureBindings,
    imageSelection?.model,
    imageSelection?.provider.id,
    setFeatureBindings,
    videoSelection?.model,
    videoSelection?.provider.id,
  ]);

  return (
    <div className="p-6 border border-border rounded-xl bg-card space-y-5">
      <div>
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Nhà cung cấp và mô hình tạo nội dung
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Mỗi loại nội dung chỉ hiển thị các mô hình thuộc nhà cung cấp đang được chọn.
        </p>
      </div>

      {mediaProviders.length === 0 ? (
        <p className="text-xs text-amber-600">
          Hãy kết nối Google Flow hoặc Grok trước để chọn mô hình.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-border/60 p-4">
            <div className="space-y-2">
              <Label>Nhà cung cấp tạo ảnh</Label>
              <Select
                value={imageSelection?.provider.id}
                onValueChange={(providerId) => setMediaProvider('character_generation', 'image', providerId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhà cung cấp tạo ảnh" />
                </SelectTrigger>
                <SelectContent>
                  {mediaProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>{getProviderDisplayName(provider)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mô hình tạo ảnh</Label>
              <Select
                value={imageSelection?.model}
                onValueChange={(model) => imageSelection && setMediaModelBinding('character_generation', imageSelection.provider, model)}
                disabled={!imageSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mô hình tạo ảnh" />
                </SelectTrigger>
                <SelectContent>
                  {(imageSelection ? getProviderMediaModels(imageSelection.provider, 'image') : []).map((model) => (
                    <SelectItem key={model} value={model}>{getModelDisplayName(model)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {imageSelection ? `Chỉ hiển thị mô hình ảnh của ${getProviderDisplayName(imageSelection.provider)}.` : 'Chưa có nhà cung cấp tạo ảnh.'}
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border/60 p-4">
            <div className="space-y-2">
              <Label>Nhà cung cấp tạo video</Label>
              <Select
                value={videoSelection?.provider.id}
                onValueChange={(providerId) => setMediaProvider('video_generation', 'video', providerId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhà cung cấp tạo video" />
                </SelectTrigger>
                <SelectContent>
                  {mediaProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>{getProviderDisplayName(provider)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mô hình tạo video</Label>
              <Select
                value={videoSelection?.model}
                onValueChange={(model) => videoSelection && setMediaModelBinding('video_generation', videoSelection.provider, model)}
                disabled={!videoSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mô hình tạo video" />
                </SelectTrigger>
                <SelectContent>
                  {(videoSelection ? getProviderMediaModels(videoSelection.provider, 'video') : []).map((model) => (
                    <SelectItem key={model} value={model}>{getModelDisplayName(model)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {videoSelection ? `Chỉ hiển thị mô hình video của ${getProviderDisplayName(videoSelection.provider)}.` : 'Chưa có nhà cung cấp tạo video.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
