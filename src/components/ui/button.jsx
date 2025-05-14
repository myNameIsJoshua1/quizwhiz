import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white shadow hover:bg-indigo-700 active:bg-indigo-800",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        outline: "border border-gray-300 bg-transparent text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100",
        secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300",
        ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
        link: "text-indigo-600 underline-offset-4 hover:underline",
        success: "bg-emerald-600 text-white shadow hover:bg-emerald-700 active:bg-emerald-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-7 rounded-md px-2.5 text-xs",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants }; 