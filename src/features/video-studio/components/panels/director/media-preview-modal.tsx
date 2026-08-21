"use client";

/**
 * Media preview modals.
 * Used for full-screen image and video preview.
 * Supports HTTP URLs, data URIs, and the local-image:// protocol.
 */

import { useEffect, useCallback, useState } from "react";
import { X, Eye, Loader2, Check } from "lucide-react";
import { LocalImage } from "@/shared/components/ui/local-image";
import { removeWatermarkFromUrl } from "@/features/video-studio/lib/ai/watermark-remover";
import { toast } from "sonner";

interface ImagePreviewModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the cleaned local-image:// path after watermark removal succeeds. */
  onImageCleaned?: (cleanedUrl: string) => void;
}

export function ImagePreviewModal({
  imageUrl,
  isOpen,
  onClose,
  onImageCleaned,
}: ImagePreviewModalProps) {
  const [removing, setRemoving] = useState(false);
  const [cleanedUrl, setCleanedUrl] = useState<string | null>(null);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling while open.
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Reset state when modal opens with a new image.
  useEffect(() => {
    if (isOpen) {
      setCleanedUrl(null);
      setRemoving(false);
    }
  }, [isOpen, imageUrl]);

  const handleRemoveWatermark = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      const result = await removeWatermarkFromUrl(cleanedUrl || imageUrl);
      if (result) {
        setCleanedUrl(result);
        onImageCleaned?.(result);
        toast.success("Đã xoá watermark");
      } else {
        toast.error("Không xoá được watermark — có thể ảnh không có watermark Gemini");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xoá watermark");
    } finally {
      setRemoving(false);
    }
  };

  if (!isOpen) return null;

  const displayUrl = cleanedUrl || imageUrl;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center cursor-zoom-out"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <LocalImage
          src={displayUrl}
          alt="Preview"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded"
        />
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {/* Remove watermark button */}
        <button
          onClick={handleRemoveWatermark}
          disabled={removing}
          title={cleanedUrl ? "Xoá watermark lần nữa" : "Xoá watermark Gemini"}
          className="absolute top-2 right-12 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50"
        >
          {removing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : cleanedUrl ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full pointer-events-none">
          {removing ? "Đang xoá watermark..." : cleanedUrl ? "Đã xoá watermark ✓" : "Click outside or press Esc to close"}
        </div>
      </div>
    </div>
  );
}

interface VideoPreviewModalProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPreviewModal({
  videoUrl,
  isOpen,
  onClose,
}: VideoPreviewModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <video
          src={videoUrl}
          controls
          autoPlay
          className="max-w-full max-h-[90vh] object-contain"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
