import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { c as cn, z as cva } from "./index-DI8hnspe.js";
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 pb-[3px] pt-[5px] text-2xs font-semibold uppercase leading-none tracking-[0.18em] transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border/60 bg-background/80 text-muted-foreground",
        warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
        success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        info: "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
export {
  Badge as B
};
