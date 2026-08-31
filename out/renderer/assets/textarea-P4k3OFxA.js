import { j as jsxRuntimeExports } from "./radix-ui-BYOyDlCM.js";
import { r as reactExports } from "./lucide-react-Cs1Usobv.js";
import { c as cn } from "./index-B8Pnvlyd.js";
const Textarea = reactExports.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "textarea",
    {
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input/40 flex min-h-[60px] w-full rounded-lg border bg-background px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[2px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ref,
      ...props
    }
  );
});
Textarea.displayName = "Textarea";
export {
  Textarea as T
};
