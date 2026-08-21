import type {
  ColorParamDefinition,
  FontParamDefinition,
  NumberParamDefinition,
  ParamDefinition,
  SelectParamDefinition,
  TextParamDefinition,
} from "./params";
import type { TimelineElement, VisualElement } from "../types";

/**
 * Property registry — maps an element to the ordered groups of editable params
 * shown in the inspector. Keys are the flat dotted param keys used on elements.
 */

export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color_dodge",
  "color_burn",
  "hard_light",
  "soft_light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
  "add",
] as const;

export const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Impact",
  "Trebuchet MS",
];

const num = (
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  dflt: number,
  shortLabel?: string,
): NumberParamDefinition => ({
  key,
  label,
  shortLabel,
  type: "number",
  default: dflt,
  min,
  max,
  step,
});

const POSITION_X = num("transform.positionX", "Position X", -4000, 4000, 1, 0, "X");
const POSITION_Y = num("transform.positionY", "Position Y", -4000, 4000, 1, 0, "Y");
const SCALE_X = num("transform.scaleX", "Scale X", 0.01, 20, 0.01, 1, "W");
const SCALE_Y = num("transform.scaleY", "Scale Y", 0.01, 20, 0.01, 1, "H");
const ROTATE = num("transform.rotate", "Rotation", -360, 360, 1, 0, "Rot");
const FIT: SelectParamDefinition = {
  key: "transform.fit",
  label: "Fit",
  type: "select",
  default: "contain",
  options: [
    { value: "contain", label: "Fit" },
    { value: "cover", label: "Fill" },
    { value: "stretch", label: "Stretch" },
  ],
};
const OPACITY = num("opacity", "Opacity", 0, 1, 0.01, 1);

/** Audio gain in dB (opencut scale −60…20, 0 = unity). */
const VOLUME = num("volume", "Volume (dB)", -60, 20, 1, 0);

const BLEND_MODE: SelectParamDefinition = {
  key: "blendMode",
  label: "Blend mode",
  type: "select",
  default: "normal",
  options: BLEND_MODES.map((m) => ({ value: m, label: m.replace(/_/g, " ") })),
};

const CONTENT: TextParamDefinition = {
  key: "content",
  label: "Text",
  type: "text",
  default: "",
};

const FONT_SIZE = num("fontSize", "Font size", 8, 500, 1, 96);
const COLOR: ColorParamDefinition = { key: "color", label: "Color", type: "color", default: "#ffffff" };
const FONT_FAMILY: FontParamDefinition = {
  key: "fontFamily",
  label: "Font",
  type: "font",
  default: "Arial",
};
const FONT_WEIGHT: SelectParamDefinition = {
  key: "fontWeight",
  label: "Weight",
  type: "select",
  default: "normal",
  options: [
    { value: "normal", label: "Normal" },
    { value: "bold", label: "Bold" },
  ],
};
const FONT_STYLE: SelectParamDefinition = {
  key: "fontStyle",
  label: "Style",
  type: "select",
  default: "normal",
  options: [
    { value: "normal", label: "Normal" },
    { value: "italic", label: "Italic" },
  ],
};
const TEXT_ALIGN: SelectParamDefinition = {
  key: "textAlign",
  label: "Align",
  type: "select",
  default: "center",
  options: [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ],
};

export interface PropertyGroup {
  id: string;
  label: string;
  params: ParamDefinition[];
}

const TRANSFORM_GROUP: PropertyGroup = {
  id: "transform",
  label: "Transform",
  params: [POSITION_X, POSITION_Y, SCALE_X, SCALE_Y, ROTATE],
};

const BLENDING_GROUP: PropertyGroup = {
  id: "blending",
  label: "Blending",
  params: [OPACITY, BLEND_MODE],
};

const TEXT_GROUP: PropertyGroup = {
  id: "text",
  label: "Text",
  params: [CONTENT, FONT_SIZE, FONT_FAMILY, FONT_WEIGHT, FONT_STYLE, COLOR, TEXT_ALIGN],
};

const AUDIO_GROUP: PropertyGroup = {
  id: "audio",
  label: "Audio",
  params: [VOLUME],
};

export function isVisualElement(element: TimelineElement): element is VisualElement {
  return element.type === "video" || element.type === "image" || element.type === "text";
}

export function getPropertyGroups(element: TimelineElement): PropertyGroup[] {
  const groups: PropertyGroup[] = [];
  if (element.type === "text") groups.push(TEXT_GROUP);
  if (isVisualElement(element)) {
    const isMedia = element.type === "video" || element.type === "image";
    groups.push({
      id: "transform",
      label: "Transform",
      // Fit only applies to media (text is rasterized at its intrinsic size).
      params: isMedia ? [FIT, ...TRANSFORM_GROUP.params] : TRANSFORM_GROUP.params,
    });
    groups.push(BLENDING_GROUP);
  }
  // Audio-capable clips (uploaded audio + video with source audio) expose a gain.
  if (element.type === "audio" || element.type === "video") groups.push(AUDIO_GROUP);
  return groups;
}

/** Whether an element type supports speed/retime editing. */
export function isRetimable(element: TimelineElement): boolean {
  return element.type === "video" || element.type === "audio";
}
