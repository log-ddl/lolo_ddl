import { ag as Root2, ah as Trigger, j as jsxRuntimeExports, ai as Portal, aj as Content2 } from "./radix-ui-BYOyDlCM.js";
import { r as reactExports } from "./lucide-react-Cs1Usobv.js";
import { c as cn } from "./index-B8Pnvlyd.js";
const Popover = Root2;
const PopoverTrigger = Trigger;
const PopoverContent = reactExports.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-[300] w-72 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = Content2.displayName;
export {
  Popover as P,
  PopoverTrigger as a,
  PopoverContent as b
};
