import { U as Root2, V as Trigger, W as Sub2, j as jsxRuntimeExports, X as Portal2, Y as Content2, Z as Item2, _ as Separator2, $ as SubTrigger2, a0 as SubContent2, a1 as CheckboxItem2, a2 as ItemIndicator2, a3 as RadioItem2, a4 as Label2 } from "./radix-ui-BYOyDlCM.js";
import { r as reactExports, a0 as ChevronRight, a9 as Check, a6 as Circle } from "./lucide-react-Cs1Usobv.js";
import { c as cn, z as cva } from "./index-B8Pnvlyd.js";
const ContextMenu = Root2;
const ContextMenuTrigger = Trigger;
const ContextMenuSub = Sub2;
const contextMenuItemVariants = cva(
  "relative flex cursor-pointer select-none items-center gap-2 px-2 py-1.5 text-sm outline-hidden transition-colors data-disabled:pointer-events-none data-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "focus:bg-accent focus:text-accent-foreground",
        destructive: "text-destructive focus:bg-destructive/10 focus:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const ContextMenuSubTrigger = reactExports.forwardRef(({ className, inset, children, variant = "default", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SubTrigger2,
  {
    ref,
    className: cn(
      contextMenuItemVariants({ variant }),
      "data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
ContextMenuSubTrigger.displayName = SubTrigger2.displayName;
const ContextMenuSubContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SubContent2,
  {
    ref,
    className: cn(
      "z-50 min-w-32 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
ContextMenuSubContent.displayName = SubContent2.displayName;
const ContextMenuContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    className: cn(
      "z-50 min-w-32 overflow-hidden rounded-lg border p-1 bg-popover text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
ContextMenuContent.displayName = Content2.displayName;
const ContextMenuItem = reactExports.forwardRef(({ className, inset, variant = "default", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Item2,
  {
    ref,
    className: cn(
      contextMenuItemVariants({ variant }),
      inset && "pl-8",
      className
    ),
    ...props
  }
));
ContextMenuItem.displayName = Item2.displayName;
const ContextMenuCheckboxItem = reactExports.forwardRef(({ className, children, checked, variant = "default", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  CheckboxItem2,
  {
    ref,
    className: cn(contextMenuItemVariants({ variant }), "pl-8 pr-2", className),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
ContextMenuCheckboxItem.displayName = CheckboxItem2.displayName;
const ContextMenuRadioItem = reactExports.forwardRef(({ className, children, variant = "default", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  RadioItem2,
  {
    ref,
    className: cn(contextMenuItemVariants({ variant }), "pl-8 pr-2", className),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
ContextMenuRadioItem.displayName = RadioItem2.displayName;
const ContextMenuLabel = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Label2,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
ContextMenuLabel.displayName = Label2.displayName;
const ContextMenuSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator2,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-foreground/10", className),
    ...props
  }
));
ContextMenuSeparator.displayName = Separator2.displayName;
export {
  ContextMenu as C,
  ContextMenuTrigger as a,
  ContextMenuContent as b,
  ContextMenuItem as c,
  ContextMenuSeparator as d,
  ContextMenuSub as e,
  ContextMenuSubTrigger as f,
  ContextMenuSubContent as g
};
