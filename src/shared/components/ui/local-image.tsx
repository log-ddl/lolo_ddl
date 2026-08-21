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

export function LocalImage({ src, fallback, className, alt, ...props }: LocalImageProps) {
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const { t } = useI18n();

  const handleError = () => {
    if (!error && fallback) {
      setError(true);
      setCurrentSrc(fallback);
    } else {
      setError(true);
    }
  };

  // Reset error state when src changes
  if (src !== currentSrc && !error) {
    setCurrentSrc(src);
  }

  if (error && !fallback) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-xs",
          className
        )}
        style={props.style}
      >
        {t("common.loadingImageFailed")}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
