import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, X, L as LoaderCircle, a3 as Check, E as Eye } from "./lucide-react-DHCwBhKI.js";
import { L as LocalImage } from "./local-image-COcd7dBC.js";
import { aa as removeWatermarkWithDiagnostics } from "./autopilot-store-5JX3PjC8.js";
import { t as toast } from "./index-DI8hnspe.js";
function ImagePreviewModal({
  imageUrl,
  isOpen,
  onClose,
  onImageCleaned
}) {
  const [removing, setRemoving] = reactExports.useState(false);
  const [cleanedUrl, setCleanedUrl] = reactExports.useState(null);
  const handleKeyDown = reactExports.useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);
  reactExports.useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);
  reactExports.useEffect(() => {
    if (isOpen) {
      setCleanedUrl(null);
      setRemoving(false);
    }
  }, [isOpen, imageUrl]);
  const handleRemoveWatermark = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      const result = await removeWatermarkWithDiagnostics(cleanedUrl || imageUrl);
      if (result.localPath) {
        setCleanedUrl(result.localPath);
        onImageCleaned?.(result.localPath);
        toast.success("Đã xoá watermark");
      } else {
        toast.error(result.error || "Không xoá được watermark — có thể ảnh không có watermark Gemini");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xoá watermark");
    } finally {
      setRemoving(false);
    }
  };
  if (!isOpen) return null;
  const displayUrl = cleanedUrl || imageUrl;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed inset-0 z-[999] bg-black/80 flex items-center justify-center cursor-zoom-out",
      onClick: onClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-[90vw] max-h-[90vh]", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LocalImage,
          {
            src: displayUrl,
            alt: "Preview",
            className: "max-w-[90vw] max-h-[90vh] object-contain rounded"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClose,
            className: "absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleRemoveWatermark,
            disabled: removing,
            title: cleanedUrl ? "Xoá watermark lần nữa" : "Xoá watermark Gemini",
            className: "absolute top-2 right-12 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50",
            children: removing ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) : cleanedUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-emerald-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-2 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full pointer-events-none", children: removing ? "Đang xoá watermark..." : cleanedUrl ? "Đã xoá watermark ✓" : "Click outside or press Esc to close" })
      ] })
    }
  );
}
function VideoPreviewModal({
  videoUrl,
  isOpen,
  onClose
}) {
  const handleKeyDown = reactExports.useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);
  reactExports.useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed inset-0 z-[999] bg-black/80 flex items-center justify-center",
      onClick: onClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-[90vw] max-h-[90vh]", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "video",
          {
            src: videoUrl,
            controls: true,
            autoPlay: true,
            className: "max-w-full max-h-[90vh] object-contain"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              onClose();
            },
            className: "absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
          }
        )
      ] })
    }
  );
}
export {
  ImagePreviewModal as I,
  VideoPreviewModal as V
};
