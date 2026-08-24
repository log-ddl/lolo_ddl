"use client";

/**
 * LocalImage Component
 * Handles displaying images that may be stored locally (local-image://) or remotely
 * The local-image:// protocol is handled by Electron's custom protocol handler
 */

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";

interface LocalImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: string;
}

/** primary → retry (same file, one transient failure is common) → fallback → failed */
type Stage = "primary" | "retry" | "fallback" | "failed";

function nextStage(stage: Stage, hasFallback: boolean): Stage {
  if (stage === "primary") return "retry";
  if (stage === "retry") return hasFallback ? "fallback" : "failed";
  return "failed";
}

/**
 * Cache-bust the retry for our own protocol only — appending a param to a
 * signed remote URL would invalidate it, and the protocol handler ignores the
 * query string anyway.
 */
function retrySrc(src: string): string {
  if (!src.startsWith("local-image://")) return src;
  return `${src}${src.includes("?") ? "&" : "?"}__retry=1`;
}

export function LocalImage({ src, fallback, className, alt, ...props }: LocalImageProps) {
  // Keyed by src so a new image always starts from a clean slate: without this
  // a single failed load would keep showing the error for every later src.
  const [attempt, setAttempt] = useState<{ src: string; stage: Stage }>({ src, stage: "primary" });
  const { t } = useI18n();

  const stage: Stage = attempt.src === src ? attempt.stage : "primary";

  const handleError = () => {
    setAttempt({ src, stage: nextStage(stage, !!fallback) });
  };

  const placeholder = (message?: string) => (
    <div
      className={cn("flex items-center justify-center bg-muted text-muted-foreground text-xs", className)}
      style={props.style}
    >
      {message}
    </div>
  );

  // An empty src would make the browser load the document itself and fire an
  // error event, so render a neutral box instead of an <img> in that case.
  if (!src) return placeholder();
  if (stage === "failed") return placeholder(t("common.loadingImageFailed"));

  const currentSrc = stage === "retry" ? retrySrc(src) : stage === "fallback" ? fallback! : src;

  return (
    <img
      key={stage}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
