import { j as jsxRuntimeExports } from "./radix-ui-BYOyDlCM.js";
import { r as reactExports } from "./lucide-react-Cs1Usobv.js";
import { a as useI18n, c as cn } from "./index-B8Pnvlyd.js";
function nextStage(stage, hasFallback) {
  if (stage === "primary") return "retry";
  if (stage === "retry") return hasFallback ? "fallback" : "failed";
  return "failed";
}
function retrySrc(src) {
  if (!src.startsWith("local-image://")) return src;
  return `${src}${src.includes("?") ? "&" : "?"}__retry=1`;
}
function LocalImage({ src, fallback, className, alt, ...props }) {
  const [attempt, setAttempt] = reactExports.useState({ src, stage: "primary" });
  const { t } = useI18n();
  const stage = attempt.src === src ? attempt.stage : "primary";
  const handleError = () => {
    setAttempt({ src, stage: nextStage(stage, !!fallback) });
  };
  const placeholder = (message) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: cn("flex items-center justify-center bg-muted text-muted-foreground text-xs", className),
      style: props.style,
      children: message
    }
  );
  if (!src) return placeholder();
  if (stage === "failed") return placeholder(t("common.loadingImageFailed"));
  const currentSrc = stage === "retry" ? retrySrc(src) : stage === "fallback" ? fallback : src;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "img",
    {
      src: currentSrc,
      alt,
      className,
      onError: handleError,
      ...props
    },
    stage
  );
}
export {
  LocalImage as L
};
