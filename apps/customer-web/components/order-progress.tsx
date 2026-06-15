'use client';

import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

const steps = ['Package', 'Event', 'Menu', 'Review'];

export function OrderProgress({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                'grid h-7 w-7 place-items-center rounded-full border text-xs font-bold',
                complete && 'border-primary bg-primary text-white',
                active && 'border-accent bg-accent text-accent-foreground',
                !complete && !active && 'bg-white text-muted-foreground',
              )}
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className={cn('text-xs font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>
              {step}
            </span>
            {index < steps.length - 1 && <span className="mx-1 h-px w-5 bg-border sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}
