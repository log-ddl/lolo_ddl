import { j as jsxRuntimeExports, ae as Root, af as Indicator } from "./radix-ui-G3HX32g5.js";
import { r as reactExports } from "./lucide-react-DHCwBhKI.js";
import { c as cn } from "./index-DI8hnspe.js";
const Progress = reactExports.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    ref,
    className: cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-muted",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Indicator,
      {
        className: "h-full w-full flex-1 bg-primary transition-all",
        style: { transform: `translateX(-${100 - (value || 0)}%)` }
      }
    )
  }
));
Progress.displayName = Root.displayName;
export {
  Progress as P
};
