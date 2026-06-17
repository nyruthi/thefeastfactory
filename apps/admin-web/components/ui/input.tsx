import * as React from 'react';
import { cn } from '../../lib/utils';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn('h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground', className)} {...props} />);
Input.displayName = 'Input';
