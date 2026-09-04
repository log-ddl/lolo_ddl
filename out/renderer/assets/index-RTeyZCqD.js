import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, K as Plus, a3 as Check, P as Pencil, d as Trash2 } from "./lucide-react-DHCwBhKI.js";
import { a as useI18n, c as cn, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, I as Input, k as DialogFooter, B as Button, E as AlertDialog, H as AlertDialogContent, J as AlertDialogHeader, K as AlertDialogTitle, L as AlertDialogDescription, M as AlertDialogFooter, N as AlertDialogCancel, O as AlertDialogAction } from "./index-DI8hnspe.js";
import { S as ScrollArea } from "./dropdown-menu-BC-MjFZS.js";
import { L as Label } from "./label-CEtfDDyg.js";
import { T as Textarea } from "./textarea-qoaBcCzv.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-CDkCw224.js";
import { a8 as useCustomStyleStore, C as getStyleById, V as VISUAL_STYLE_PRESETS, a9 as STYLE_CATEGORIES } from "./autopilot-store-5JX3PjC8.js";
const CATEGORY_COLORS = {
  "none": "bg-muted text-muted-foreground",
  "3d": "bg-blue-500/20 text-blue-600",
  "2d": "bg-green-500/20 text-green-600",
  "real": "bg-amber-500/20 text-amber-600",
  "stop_motion": "bg-purple-500/20 text-purple-600"
};
function StylePicker({
  value,
  onChange,
  popover = true,
  trigger,
  className,
  disabled = false,
  placeholder
}) {
  const [hoveredStyle, setHoveredStyle] = reactExports.useState(null);
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const [editorOpen, setEditorOpen] = reactExports.useState(false);
  const [editingStyleId, setEditingStyleId] = reactExports.useState(null);
  const [styleName, setStyleName] = reactExports.useState("");
  const [stylePrompt, setStylePrompt] = reactExports.useState("");
  const [negativePrompt, setNegativePrompt] = reactExports.useState("");
  const [deleteTargetId, setDeleteTargetId] = reactExports.useState(null);
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder || t("stylePicker.placeholder");
  const customStyles = useCustomStyleStore((s) => s.styles);
  const addStyle = useCustomStyleStore((s) => s.addStyle);
  const updateStyle = useCustomStyleStore((s) => s.updateStyle);
  const deleteStyle = useCustomStyleStore((s) => s.deleteStyle);
  const customAsPresets = reactExports.useMemo(
    () => customStyles.map((style) => getStyleById(style.id)).filter((style) => Boolean(style)),
    [customStyles]
  );
  const selectedStyle = reactExports.useMemo(() => getStyleById(value), [value, customStyles]);
  const previewStyle = hoveredStyle || selectedStyle || VISUAL_STYLE_PRESETS[0];
  const isCustomPreview = previewStyle.id.startsWith("custom_style_");
  const handleSelect = (style) => {
    onChange(style.id);
    if (popover) {
      setIsOpen(false);
    }
  };
  const openStyleEditor = (styleId) => {
    const style = styleId ? customStyles.find((item) => item.id === styleId) : void 0;
    setEditingStyleId(style?.id || null);
    setStyleName(style?.name || "");
    setStylePrompt(style?.prompt || "");
    setNegativePrompt(style?.negativePrompt || "");
    setIsOpen(false);
    setEditorOpen(true);
  };
  const handleSaveStyle = () => {
    const name = styleName.trim();
    const prompt = stylePrompt.trim();
    if (!name || !prompt) return;
    if (editingStyleId) {
      updateStyle(editingStyleId, {
        name,
        prompt,
        negativePrompt: negativePrompt.trim()
      });
      onChange(editingStyleId);
    } else {
      const newId = addStyle({
        name,
        prompt,
        negativePrompt: negativePrompt.trim(),
        description: "",
        referenceImages: [],
        tags: [],
        folderId: null,
        styleTokens: "",
        sceneTokens: ""
      });
      onChange(newId);
    }
    setEditorOpen(false);
  };
  const requestDeleteStyle = (styleId) => {
    setIsOpen(false);
    setDeleteTargetId(styleId);
  };
  const handleDeleteStyle = () => {
    if (!deleteTargetId) return;
    deleteStyle(deleteTargetId);
    if (value === deleteTargetId) onChange("none");
    setDeleteTargetId(null);
  };
  const pickerContent = /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex", popover ? "w-[520px] h-[400px]" : "w-full h-full", className), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "w-[240px] border-r border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2", children: [
      STYLE_CATEGORIES.map((category) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/60 mb-2", children: category.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: category.styles.map((style) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          StyleItem,
          {
            style,
            isSelected: value === style.id,
            onSelect: () => handleSelect(style),
            onHover: () => setHoveredStyle(style),
            onLeave: () => setHoveredStyle(null)
          },
          style.id
        )) })
      ] }, category.id)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-2 py-1.5 border-b border-primary/30 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-primary", children: t("stylePicker.myStyles") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "flex items-center gap-1 text-2xs text-primary hover:opacity-70",
              onClick: () => openStyleEditor(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3" }),
                t("stylePicker.addStyle")
              ]
            }
          )
        ] }),
        customAsPresets.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: customAsPresets.map((style) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          StyleItem,
          {
            style,
            isSelected: value === style.id,
            isCustom: true,
            onSelect: () => handleSelect(style),
            onHover: () => setHoveredStyle(style),
            onLeave: () => setHoveredStyle(null),
            onEdit: () => openStyleEditor(style.id),
            onDelete: () => requestDeleteStyle(style.id)
          },
          style.id
        )) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 p-4 flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
        "flex-1 flex flex-col items-center justify-center rounded-lg mb-3",
        isCustomPreview ? "bg-primary/10 text-primary" : CATEGORY_COLORS[previewStyle.category] || "bg-muted/30"
      ), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold mb-2", children: previewStyle.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-[220px] text-center text-xs opacity-70 line-clamp-3", children: isCustomPreview ? previewStyle.prompt : `${previewStyle.category.toUpperCase()} · ${previewStyle.mediaType}` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm mb-1", children: previewStyle.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground line-clamp-2", children: previewStyle.description })
      ] })
    ] })
  ] });
  if (popover) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open: isOpen, onOpenChange: setIsOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, disabled, children: trigger || /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: cn(
              // h-9 to match Input/SelectTrigger — the category chip inside
              // used to push this trigger taller than its neighbours.
              "flex h-9 items-center gap-2 px-3 rounded-lg border border-input bg-background",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "text-sm w-full justify-between"
            ),
            disabled,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                selectedStyle && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
                  "w-5 h-5 shrink-0 rounded flex items-center justify-center text-2xs font-bold",
                  selectedStyle.id.startsWith("custom_style_") ? "bg-primary/20 text-primary" : CATEGORY_COLORS[selectedStyle.category] || "bg-muted"
                ), children: selectedStyle.id.startsWith("custom_style_") ? "★" : selectedStyle.category === "none" ? "NO" : selectedStyle.category === "3d" ? "3D" : selectedStyle.category === "2d" ? "2D" : selectedStyle.category === "real" ? t("stylePicker.category.real") : t("stylePicker.category.stopMotion") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: !selectedStyle ? "text-muted-foreground" : "", children: selectedStyle?.name || resolvedPlaceholder })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "svg",
                {
                  className: "w-4 h-4 opacity-50",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" })
                }
              )
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PopoverContent,
          {
            className: "p-0 w-auto",
            align: "start",
            sideOffset: 4,
            children: pickerContent
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: editorOpen, onOpenChange: setEditorOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingStyleId ? t("stylePicker.editStyle") : t("stylePicker.addStyle") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "custom-style-name", children: t("stylePicker.styleName") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "custom-style-name",
                value: styleName,
                onChange: (event) => setStyleName(event.target.value),
                placeholder: t("stylePicker.styleNamePlaceholder"),
                autoFocus: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "custom-style-prompt", children: t("stylePicker.prompt") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "custom-style-prompt",
                value: stylePrompt,
                onChange: (event) => setStylePrompt(event.target.value),
                placeholder: t("stylePicker.promptPlaceholder"),
                rows: 5
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "custom-style-negative", children: t("stylePicker.negativePrompt") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "custom-style-negative",
                value: negativePrompt,
                onChange: (event) => setNegativePrompt(event.target.value),
                placeholder: t("stylePicker.negativePromptPlaceholder"),
                rows: 3
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setEditorOpen(false), children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handleSaveStyle,
              disabled: !styleName.trim() || !stylePrompt.trim(),
              children: t("stylePicker.save")
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AlertDialog,
        {
          open: deleteTargetId !== null,
          onOpenChange: (open) => !open && setDeleteTargetId(null),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("stylePicker.deleteTitle") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("stylePicker.deleteDescription", {
                name: customStyles.find((style) => style.id === deleteTargetId)?.name || ""
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                AlertDialogAction,
                {
                  onClick: handleDeleteStyle,
                  className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                  children: t("dashboard.delete")
                }
              )
            ] })
          ] })
        }
      )
    ] });
  }
  return pickerContent;
}
function StyleItem({ style, isSelected, isCustom, onSelect, onHover, onLeave, onEdit, onDelete }) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "group w-full flex items-center gap-1 rounded-lg transition-colors",
        "hover:bg-accent",
        isSelected && "bg-accent"
      ),
      onMouseEnter: onHover,
      onMouseLeave: onLeave,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "min-w-0 flex flex-1 items-center gap-2 px-2 py-1.5", onClick: onSelect, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
            "w-10 h-10 rounded flex items-center justify-center text-2xs font-bold flex-shrink-0",
            isCustom ? "bg-primary/20 text-primary" : CATEGORY_COLORS[style.category] || "bg-muted"
          ), children: isCustom ? "★" : style.category === "none" ? "NO" : style.category === "3d" ? "3D" : style.category === "2d" ? "2D" : style.category === "real" ? t("stylePicker.category.real") : t("stylePicker.category.stopMotion") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-left text-sm truncate", children: style.name }),
          isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-primary flex-shrink-0" })
        ] }),
        isCustom && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex pr-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded p-1 text-muted-foreground hover:text-foreground", onClick: onEdit, title: t("common.edit"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded p-1 text-muted-foreground hover:text-destructive", onClick: onDelete, title: t("dashboard.delete"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ]
    }
  );
}
export {
  StylePicker as S
};
