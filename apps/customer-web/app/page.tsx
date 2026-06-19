import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  Sparkles,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../components/ui/button';

const steps = [
  {
    label: 'Tell us the occasion',
    copy: 'Choose your date, venue, and guest count.',
    icon: CalendarDays,
  },
  {
    label: 'Curate the menu',
    copy: 'Build within a package, then add premium favourites.',
    icon: Utensils,
  },
  {
    label: 'Confirm with clarity',
    copy: 'See the exact per-plate and event total before payment.',
    icon: IndianRupee,
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="page-shell">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-white shadow-2xl shadow-primary/15 sm:px-10 lg:px-16 lg:py-20">
          <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-40 right-16 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-accent">
                <Sparkles className="h-4 w-4" /> Thoughtful catering for every
                gathering
              </p>
              <h1 className="mt-5 max-w-4xl font-serif text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
                A memorable table begins with a simple plan.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                Choose a crafted package, personalize every course, and get
                transparent pricing for your celebration in minutes.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link href="/packages">
                    Explore packages <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href="/orders">Track an order</Link>
                </Button>
              </div>
            </div>
            <div className="surface-card relative overflow-hidden border-white/10 bg-white/10 p-6 text-white backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                The Feast Factory promise
              </p>
              <div className="mt-6 space-y-5">
                {[
                  'Curated vegetarian and non-vegetarian menus',
                  'Clear package rules and live pricing',
                  'Event details, payment, and tracking in one place',
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm leading-6 text-white/80">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-xl bg-white/10 p-5">
                <p className="font-serif text-3xl font-semibold">10 to 500+</p>
                <p className="mt-1 text-sm text-white/60">
                  Guests, with packages that scale with you
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pt-4">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold">
            From first idea to final plate.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.label}
              className="surface-card group p-6 transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/8 text-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-serif text-3xl text-border">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-8 font-serif text-2xl font-semibold">
                {step.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.copy}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
