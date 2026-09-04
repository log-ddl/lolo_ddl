import { j as jsxRuntimeExports, Q as Root } from "./radix-ui-G3HX32g5.js";
import { r as reactExports } from "./lucide-react-DHCwBhKI.js";
import { c as cn } from "./index-DI8hnspe.js";
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
