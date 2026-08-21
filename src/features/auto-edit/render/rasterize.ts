import type { TextLayerSpec } from "./plan";

/**
 * Rasterize a text layer to an RGBA PNG data URL at its intrinsic size, using
 * the same font/style/textAlign as the DOM preview. The PNG is later scaled /
 * rotated / positioned by the ffmpeg pipeline via `iw`/`ih`, so we don't need to
 * know the natural size in the main process — it is embedded in the image.
 */
export async function rasterizeTextLayer(spec: TextLayerSpec): Promise<string> {
  const fontSize = spec.fontSize || 96;
  const fontWeight = spec.fontWeight || "normal";
  const fontStyle = spec.fontStyle || "normal";
  const font = `${fontStyle !== "normal" ? fontStyle + " " : ""}${fontWeight} ${fontSize}px ${spec.fontFamily || "Arial"}`;

  const content = spec.content ?? "";
  const lines = content.length ? content.split("\n") : [""];
  const lineHeight = Math.max(1, Math.round(fontSize * 1.2));

  // Measure with an offscreen context (fonts must be loaded; system fonts are).
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("Canvas 2D is not available");
  measure.font = font;
  const widths = lines.map((line) => measure.measureText(line || " ").width);
  const textWidth = Math.max(1, ...widths);

  // Small padding so ascenders/descenders aren't clipped by the tight box.
  const padX = Math.ceil(fontSize * 0.06);
  const padY = Math.ceil(fontSize * 0.12);
  const width = Math.ceil(textWidth) + padX * 2;
  const height = lines.length * lineHeight + padY * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");

  ctx.font = font;
  ctx.fillStyle = spec.color || "#ffffff";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  lines.forEach((line, i) => {
    const w = widths[i];
    const x =
      spec.textAlign === "center"
        ? padX + (textWidth - w) / 2
        : spec.textAlign === "right"
          ? padX + (textWidth - w)
          : padX;
    ctx.fillText(line || " ", x, padY + i * lineHeight);
  });

  return canvas.toDataURL("image/png");
}
