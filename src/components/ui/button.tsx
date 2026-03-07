import * as React from "react"

import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "secondary" | "outline" | "ghost"
type ButtonSize = "default" | "sm"

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[var(--accent-strong)] text-[var(--accent-strong-foreground)] shadow-[0_12px_30px_rgba(245,158,11,0.2)] hover:bg-[var(--accent-strong-hover)]",
  secondary:
    "bg-[var(--surface-strong)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
  outline:
    "border border-[var(--border-strong)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
  ghost:
    "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-xs",
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
})
