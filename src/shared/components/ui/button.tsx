import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // The implicit variant is the screen's main action, so it carries the
        // brand colour. Anything that should not compete for attention has to
        // opt out with outline/secondary/ghost.
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        "primary-gradient":
          "bg-brand-gradient text-white shadow hover:brightness-110",
        destructive:
          "bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground",
        outline:
          "border border-input/40 bg-background hover:bg-muted/70 hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        text: "bg-transparent p-0 rounded-none opacity-100 hover:opacity-50 transition-opacity",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // 28/32/36/40 — one 4px step apart, with the default matching the 36px
      // height of Input and SelectTrigger so mixed rows line up.
      size: {
        default: "h-9 px-3",
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-10 px-4",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? SlotPrimitive.Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
