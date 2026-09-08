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
import { useAPIConfigStore, type AIFeature, type IProvider } from "@/features/video-studio/stores/api-config-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { MediaRoutingPicker } from "@/features/video-studio/components/media-routing-picker";
import { getProviderDisplayName, getProviderMediaModels, type MediaModelKind } from "./shared";

type MediaSelection = { provider: IProvider; model: string } | null;

export function MediaModelSelectors() {
  const { providers, setFeatureBindings, getFeatureBindings } = useAPIConfigStore();
  const mediaRouting = useVideoStudioSettingsStore((state) => state.mediaRouting);
  const setMediaRouting = useVideoStudioSettingsStore((state) => state.setMediaRouting);

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
    // The fallback order belongs to the provider it was picked from — keeping
    // Veo models around after a switch to Grok would leave the chain pointing at
    // models this provider cannot run.
    setMediaRouting(kind === 'image' ? { imageModelFallbacks: [] } : { videoModelFallbacks: [] });
  }, [mediaProviders, setMediaModelBinding, setMediaRouting]);

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

            <p className="text-xs text-muted-foreground">
              {imageSelection
                ? `Mô hình ảnh chọn ở phần dưới, trong danh sách của ${getProviderDisplayName(imageSelection.provider)}.`
                : 'Chưa có nhà cung cấp tạo ảnh.'}
            </p>
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

            <p className="text-xs text-muted-foreground">
              {videoSelection
                ? `Mô hình video chọn ở phần dưới, trong danh sách của ${getProviderDisplayName(videoSelection.provider)}.`
                : 'Chưa có nhà cung cấp tạo video.'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-border/60 pt-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Thứ tự model và tài khoản</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Dùng cho mọi chỗ tạo ảnh/video: panel Cảnh, Nhân vật, Đạo diễn đọc ngay lúc bấm nút; job AutoPilot chép lại lúc tạo và phần nâng cao của job ghi đè được.
          </p>
        </div>
        <MediaRoutingPicker
          imageModels={imageSelection ? getProviderMediaModels(imageSelection.provider, 'image') : []}
          videoModels={videoSelection ? getProviderMediaModels(videoSelection.provider, 'video') : []}
          videoOnGoogleFlow={videoSelection?.provider.platform === 'googleflow'}
          imageOnGoogleFlow={imageSelection?.provider.platform === 'googleflow'}
          value={{
            // Model đầu chuỗi chính là binding: một nguồn duy nhất, không còn hai
            // ô chọn model song song nhau.
            imageModel: imageSelection?.model,
            videoModel: videoSelection?.model,
            imageModelFallbacks: mediaRouting.imageModelFallbacks,
            videoModelFallbacks: mediaRouting.videoModelFallbacks,
            flowAccounts: mediaRouting.flowAccounts,
            accountVideoModels: mediaRouting.accountVideoModels,
            accountImageModels: mediaRouting.accountImageModels,
            routingMode: mediaRouting.routingMode,
          }}
          onChange={(next) => {
            if (imageSelection && next.imageModel && next.imageModel !== imageSelection.model) {
              setMediaModelBinding('character_generation', imageSelection.provider, next.imageModel);
            }
            if (videoSelection && next.videoModel && next.videoModel !== videoSelection.model) {
              setMediaModelBinding('video_generation', videoSelection.provider, next.videoModel);
            }
            setMediaRouting({
              imageModelFallbacks: next.imageModelFallbacks,
              videoModelFallbacks: next.videoModelFallbacks,
              flowAccounts: next.flowAccounts,
              accountVideoModels: next.accountVideoModels,
              accountImageModels: next.accountImageModels,
              routingMode: next.routingMode,
            });
          }}
        />
      </div>
    </div>
  );
}
