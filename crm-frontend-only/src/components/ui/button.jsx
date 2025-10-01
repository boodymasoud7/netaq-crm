import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white shadow hover:bg-primary-600 focus-visible:ring-primary-500",
        destructive: "bg-red-500 text-white shadow hover:bg-red-600 focus-visible:ring-red-500",
        outline: "border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:ring-gray-500",
        secondary: "bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200 focus-visible:ring-gray-500",
        ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
        link: "text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500",
        success: "bg-green-500 text-white shadow hover:bg-green-600 focus-visible:ring-green-500",
        warning: "bg-yellow-500 text-white shadow hover:bg-yellow-600 focus-visible:ring-yellow-500",
        info: "bg-blue-500 text-white shadow hover:bg-blue-600 focus-visible:ring-blue-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1.5 text-xs",
        lg: "h-12 px-6 py-3 text-base",
        icon: "h-10 w-10",
        xs: "h-6 px-2 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }