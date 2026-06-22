'use client';

import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { HeroSection } from '../components/home/hero-section';
import { OrderTypeCards } from '../components/home/order-type-cards';
import { OccasionPackagesSection } from '../components/home/occasion-packages-section';
import { TrustIndicators } from '../components/home/trust-indicators';

const testimonials = [
  {
    quote:
      'We ordered 200 boxes for our quarterly all-hands. Everything arrived hot, on time, and the team was thrilled. Will repeat every quarter.',
    name: 'Priya Anand',
    role: 'Office Admin, Bengaluru Tech Co.',
    initial: 'P',
  },
  {
    quote:
      'The Farm House package was perfect for our society annual day. 350 people, zero complaints. Pricing was crystal clear from the start.',
    name: 'Rajan Sharma',
    role: 'RWA President, Whitefield Enclave',
    initial: 'R',
  },
  {
    quote:
      "Ordered the Puja Package for my mother's housewarming. They let us swap two dishes, price updated instantly. Absolutely loved it.",
    name: 'Divya Krishnan',
    role: 'Homemaker, Chennai',
    initial: 'D',
  },
];

export default function HomePage() {
  return (
    <main>
      {/* 1 ── Hero */}
      <HeroSection />

      {/* 2 ── Choose how you want to order */}
      <OrderTypeCards />

      {/* 3 ── Popular Occasion Packages */}
      <OccasionPackagesSection />

      {/* 4 ── Trust indicators */}
      <TrustIndicators />

      {/* 5 ── Testimonials */}
      <section className="bg-muted/40 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Testimonials</p>
            <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              Trusted by offices, communities &amp; families
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="surface-card flex flex-col gap-4 p-6">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-7 text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t pt-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                    {t.initial}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 ── CTA Banner */}
      <section className="bg-primary">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Ready to place your catering order?
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Book online in minutes. We handle everything from kitchen to venue.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/packages">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/25 text-white hover:bg-white/10"
              >
                <Link href="/menu">Browse menu</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
