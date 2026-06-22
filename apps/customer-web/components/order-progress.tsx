'use client';

import { cn } from '../lib/utils';

const steps = [
  { label: 'Package', sub: 'Choose plan' },
  { label: 'Event', sub: 'Date & venue' },
  { label: 'Menu', sub: 'Select dishes' },
  { label: 'Pay', sub: 'Confirm & pay' },
];

export function OrderProgress({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex items-start">
      {steps.map((step, idx) => {
        const complete = idx < current;
        const active = idx === current;
        return (
          <div key={step.label} className="flex flex-1 items-start">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold transition-all',
                  complete && 'bg-accent text-accent-foreground',
                  active && 'bg-white text-primary ring-2 ring-white/30',
                  !complete && !active && 'bg-white/15 text-white/40',
                )}
              >
                {complete ? '✓' : idx + 1}
              </span>
              <span
                className={cn(
                  'hidden text-[10px] font-bold leading-none sm:block',
                  active ? 'text-white' : complete ? 'text-accent' : 'text-white/40',
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'mx-1.5 mt-4 h-0.5 flex-1 rounded-full',
                  idx < current ? 'bg-accent/50' : 'bg-white/15',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
