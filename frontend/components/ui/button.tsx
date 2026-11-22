import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "theme";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

    const variantStyles = {
      default:
        "bg-[#101828] text-white shadow-sm hover:bg-black active:scale-[0.99]",
      destructive:
        "bg-red-500 text-white shadow-xs hover:bg-red-600",
      outline:
        "border border-[#EAECF0] bg-white text-[#344054] shadow-xs hover:bg-[#F9FAFB] hover:border-[#D0D5DD] active:scale-[0.99]",
      secondary:
        "bg-[#F2F4F7] text-[#344054] shadow-xs hover:bg-[#E4E7EC]",
      ghost: "text-[#344054] hover:bg-[#F2F4F7] hover:text-[#101828]",
      link: "text-[#4D4B76] underline-offset-4 hover:underline",
      theme:
        "bg-gradient-to-r from-[#282E51] via-[#4D4B76] to-[#9072A3] text-white shadow-md hover:opacity-95 hover:shadow-lg active:scale-[0.99]",
    };

    const sizeStyles = {
      default: "h-11 px-5 py-2.5",
      sm: "h-9 rounded-lg px-3.5 text-xs",
      lg: "h-12 rounded-xl px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variantStyles[variant] || variantStyles.default,
          sizeStyles[size] || sizeStyles.default,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
