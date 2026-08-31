import { j as jsxRuntimeExports, v as Root2, w as Trigger, x as Portal2, y as Content2, I as Item2, z as Separator2, B as SubTrigger2, E as SubContent2, F as CheckboxItem2, G as ItemIndicator2, H as RadioItem2, L as Label2 } from "./radix-ui-BYOyDlCM.js";
import { r as reactExports, a0 as ChevronRight, a9 as Check, a6 as Circle } from "./lucide-react-Cs1Usobv.js";
import { c as cn, z as cva } from "./index-B8Pnvlyd.js";
const ScrollArea = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn("overflow-auto scrollbar-thin", className),
    ...props,
    children
  }
));
ScrollArea.displayName = "ScrollArea";
const DropdownMenu = Root2;
const DropdownMenuTrigger = Trigger;
const dropdownMenuItemVariants = cva(
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
const DropdownMenuSubTrigger = reactExports.forwardRef(({ className, inset, children, variant = "default", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SubTrigger2,
  {
    ref,
    className: cn(
      dropdownMenuItemVariants({ variant }),
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
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
const DropdownMenuSubContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
DropdownMenuSubContent.displayName = SubContent2.displayName;
const DropdownMenuContent = reactExports.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    sideOffset,
    onCloseAutoFocus: (e) => {
      e.stopPropagation();
      e.preventDefault();
    },
    className: cn(
      "z-50 min-w-32 overflow-hidden rounded-lg border p-1 bg-popover text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = Content2.displayName;
const DropdownMenuItem = reactExports.forwardRef(({ className, inset, variant = "default", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Item2,
  {
    ref,
    className: cn(
      dropdownMenuItemVariants({ variant }),
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = Item2.displayName;
const DropdownMenuCheckboxItem = reactExports.forwardRef(({ className, children, checked, variant = "default", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  CheckboxItem2,
  {
    ref,
    className: cn(
      dropdownMenuItemVariants({ variant }),
      "pl-2 pr-8",
      className
    ),
    checked,
    onSelect: (e) => {
      e.preventDefault();
    },
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) })
    ]
  }
));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
const DropdownMenuRadioItem = reactExports.forwardRef(({ className, children, variant = "default", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  RadioItem2,
  {
    ref,
    className: cn(
      dropdownMenuItemVariants({ variant }),
      "pl-8 pr-2",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
const DropdownMenuLabel = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
DropdownMenuLabel.displayName = Label2.displayName;
const DropdownMenuSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator2,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-foreground/10", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = Separator2.displayName;
export {
  DropdownMenu as D,
  ScrollArea as S,
  DropdownMenuTrigger as a,
  DropdownMenuContent as b,
  DropdownMenuItem as c,
  DropdownMenuSeparator as d
};
