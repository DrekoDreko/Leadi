import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-soft",
  {
    variants: {
      variant: {
        default: "bg-signal text-ink hover:bg-signal/90",
        destructive:
          "bg-red-500 text-white hover:bg-red-500/90",
        outline:
          "border border-ink/20 bg-transparent text-ink backdrop-blur-xl hover:bg-ink/5",
        secondary:
          "bg-cobalt/10 text-cobalt hover:bg-cobalt/20",
        ghost: "hover:bg-ink/5 text-ink",
        link: "text-cobalt underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-7 py-4",
        sm: "h-9 rounded-full px-4 py-2",
        lg: "h-14 rounded-full px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
