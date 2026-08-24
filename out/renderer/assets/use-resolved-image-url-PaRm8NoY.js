import { r as reactExports } from "./lucide-react-DHCwBhKI.js";
import { F as isIdbImagePath, a7 as readBlobFromBrowserStorage } from "./autopilot-store-i3rmgegs.js";
function useResolvedImageUrl(rawUrl) {
  const [blob, setBlob] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!rawUrl || !isIdbImagePath(rawUrl)) return;
    let blobUrl = null;
    let cancelled = false;
    readBlobFromBrowserStorage(rawUrl).then((storedBlob) => {
      if (cancelled) return;
      if (!storedBlob) {
        setBlob({ rawUrl, url: null });
        return;
      }
      blobUrl = URL.createObjectURL(storedBlob);
      setBlob({ rawUrl, url: blobUrl });
    });
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [rawUrl]);
  if (!rawUrl) return null;
  if (!isIdbImagePath(rawUrl)) return rawUrl;
  return blob?.rawUrl === rawUrl ? blob.url : null;
}
export {
  useResolvedImageUrl as u
};
