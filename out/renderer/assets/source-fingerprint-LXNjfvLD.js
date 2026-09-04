import { q as getFeatureConfig, A as getFeatureNotConfiguredMessage, g as googleFlowProvider } from "./autopilot-store-5JX3PjC8.js";
import { a as useProjectStore } from "./auto-video-store-kYjrHdTY.js";
async function generateImage(params, feature) {
  const featureConfig = getFeatureConfig(feature);
  if (!featureConfig) throw new Error(getFeatureNotConfiguredMessage(feature));
  if (featureConfig.platform !== "googleflow") {
    throw new Error(`Unsupported image platform: ${featureConfig.platform}. Only "googleflow" is supported.`);
  }
  const projectId = useProjectStore.getState().activeProjectId || "default-project";
  const result = await googleFlowProvider.generateImage({
    projectId,
    prompt: params.prompt,
    model: featureConfig.model || featureConfig.models?.[0] || "GEM_PIX_2",
    aspectRatio: params.aspectRatio || "1:1",
    references: params.referenceImages?.map((source) => ({ source, provider: "googleflow" })),
    preferredCredentialId: params.preferredCredentialId,
    onSubmitted: params.onSubmitted,
    signal: params.signal
  });
  const imageUrl = result.localUrl || result.remoteUrl;
  if (!imageUrl) throw new Error("Google Flow returned no image URL");
  return {
    imageUrl,
    taskId: result.taskId,
    mediaId: result.mediaId,
    credentialId: result.credentialId,
    accountId: result.accountId,
    ownerScopeId: result.ownerScopeId,
    flowProjectId: result.flowProjectId
  };
}
async function generateCharacterImage(params) {
  return generateImage(params, "character_generation");
}
async function generateSceneImage(params) {
  return generateImage(params, "scene_generation");
}
async function submitGridImageRequest(params) {
  const { model, prompt, aspectRatio, referenceImages, onSubmitted, signal } = params;
  if (params.platform !== "googleflow") {
    throw new Error(`Unsupported image platform: ${params.platform}. Only "googleflow" is supported.`);
  }
  const projectId = useProjectStore.getState().activeProjectId || "default-project";
  const result = await googleFlowProvider.generateImage({
    projectId,
    prompt,
    model,
    aspectRatio,
    references: referenceImages?.map((source) => {
      const hint = params.referenceMediaHints?.[source];
      return hint ? { source, provider: "googleflow", mediaId: hint.mediaId, ownerScopeId: hint.ownerScopeId, flowProjectId: hint.flowProjectId } : { source, provider: "googleflow" };
    }),
    preferredCredentialId: params.preferredCredentialId,
    taskId: params.taskId,
    onSubmitted,
    signal
  });
  return {
    imageUrl: result.localUrl || result.remoteUrl,
    taskId: result.taskId,
    mediaId: result.mediaId,
    credentialId: result.credentialId,
    accountId: result.accountId,
    ownerScopeId: result.ownerScopeId,
    flowProjectId: result.flowProjectId
  };
}
function getSourceFingerprint(source) {
  if (!source) return "";
  if (source.startsWith("local-image://")) {
    return source.replace("local-image://", "").replace(/^.*[\\/]/, "");
  }
  if (source.startsWith("data:image/")) {
    return source.slice(0, 100);
  }
  return source;
}
export {
  generateCharacterImage as a,
  generateSceneImage as b,
  getSourceFingerprint as g,
  submitGridImageRequest as s
};
