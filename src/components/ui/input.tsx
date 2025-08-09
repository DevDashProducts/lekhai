import * as React from 'react'
import { cn } from '@/lib/utils'

export const inputBaseClass =
  'block w-full rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input ref={ref} type={type} className={cn(inputBaseClass, className)} {...props} />
    )
  }
)
Input.displayName = 'Input'


