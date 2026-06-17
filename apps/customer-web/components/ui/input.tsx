import * as React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('h-12 w-full rounded-xl border bg-white/95 px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground', className)}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
