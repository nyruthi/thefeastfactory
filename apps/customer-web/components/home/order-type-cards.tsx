import { ArrowRight, ChefHat, Package, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

const cards = [
  {
    id: 'meal-boxes',
    Icon: Package,
    heading: 'Meal Boxes',
    description: 'One box per person with 3, 5 or 8 items.',
    cta: 'Explore Meal Boxes',
    href: '/packages',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=480&q=80',
  },
  {
    id: 'occasion',
    Icon: Sparkles,
    heading: 'Occasion Packages',
    description: 'Pre-designed menus for every occasion.',
    cta: 'View Occasion Packages',
    href: '/packages',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=480&q=80',
  },
  {
    id: 'custom',
    Icon: ChefHat,
    heading: 'Build Your Own Menu',
    description: 'Pick your favorite dishes and create your own menu.',
    cta: 'Build Your Menu',
    href: '/packages',
    image:
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=480&q=80',
  },
] as const;

export function OrderTypeCards() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      {/* Decorative centred heading */}
      <div className="mb-10 flex items-center gap-5">
        <div className="h-[2px] flex-1 rounded-full bg-accent/40" />
        <h2 className="shrink-0 text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Choose how you want to order
        </h2>
        <div className="h-[2px] flex-1 rounded-full bg-accent/40" />
      </div>

      {/* 3 horizontal cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="group flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Left: text + CTA */}
            <div className="flex flex-1 flex-col p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <card.Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{card.heading}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                {card.description}
              </p>
              <Button asChild size="sm" className="mt-5 w-fit rounded-full text-xs">
                <Link href={card.href}>
                  {card.cta} <ArrowRight className="ml-1.5 h-3 w-3" />
                </Link>
              </Button>
            </div>

            {/* Right: food image */}
            <div className="w-36 shrink-0 overflow-hidden sm:w-44">
              <img
                src={card.image}
                alt={card.heading}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
