import { j as jsxRuntimeExports, Q as Root } from "./radix-ui-BYOyDlCM.js";
import { r as reactExports } from "./lucide-react-Cs1Usobv.js";
import { c as cn } from "./index-B8Pnvlyd.js";
const Separator = reactExports.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root,
    {
      ref,
      decorative,
      orientation,
      className: cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      ),
      ...props
    }
  )
);
Separator.displayName = Root.displayName;
export {
  Separator as S
};
