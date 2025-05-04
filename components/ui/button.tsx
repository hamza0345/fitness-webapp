import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80 border-primary/50",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80 border-destructive/50",
        outline:
          "border-primary bg-background hover:bg-primary/10 text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 border-primary/30",
        ghost: "border-transparent hover:bg-accent/20 hover:text-accent-foreground",
        link: "text-primary hover:underline border-transparent underline-offset-4",
      },
      size: {
        default: "h-9 px-4 py-1",
        sm: "h-8 px-3 text-xs py-1",
        lg: "h-10 px-6 text-base py-1",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
