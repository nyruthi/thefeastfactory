import { CheckCircle2, Gift, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

const trustBadges = [
  { Icon: Users, label: '20 – 1,000 People' },
  { Icon: CheckCircle2, label: 'On-time Delivery' },
  { Icon: ShieldCheck, label: 'Hygienic & Safe' },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[360px] overflow-hidden sm:min-h-[420px]">
      {/* Background photo */}
      <img
        src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=80"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden="true"
      />

      {/* Gradient overlay: solid maroon left → transparent right */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/88 to-primary/20" />

      <div className="relative mx-auto flex min-h-[360px] w-full max-w-7xl items-center gap-8 px-4 py-16 sm:min-h-[420px] sm:px-6 lg:px-8">
        {/* Left: heading + subtitle + badges */}
        <div className="max-w-lg flex-1">
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Premium food for
            <br />
            every{' '}
            <span className="italic text-accent">occasion</span>.
          </h1>
          <p className="mt-5 text-sm leading-7 text-white/80 sm:text-base">
            Bulk catering for 20 to 1,000 people.
            <br className="hidden sm:block" />
            Corporate lunches, parties, celebrations &amp; more.
          </p>

          {/* Trust badge chips */}
          <div className="mt-8 flex flex-wrap gap-3">
            {trustBadges.map(({ Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: floating white card */}
        <div className="ml-auto hidden shrink-0 lg:block">
          <div className="w-56 rounded-2xl bg-white p-6 shadow-2xl">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
              <Gift className="h-6 w-6 text-primary" />
            </span>
            <h3 className="mt-4 text-sm font-bold leading-snug text-foreground">
              Custom menus just the way you want
            </h3>
            <p className="mt-2.5 text-xs font-semibold leading-5 text-accent">
              Swap, upgrade or add items anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
