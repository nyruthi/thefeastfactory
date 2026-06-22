'use client';

import type { PackageSummary } from '@aranyam/shared-types';
import {
  ArrowRight,
  Check,
  ChefHat,
  Minus,
  Package,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { StatePanel } from '../../components/ui/state-panel';
import { apiRequest } from '../../lib/api';
import { cn } from '../../lib/utils';

type Tab = 'all' | 'occasion' | 'custom';

/* ─────────────────────────────────────────────────────────
   Ordering model definitions — maps to API tab filter
───────────────────────────────────────────────────────── */
const ORDERING_MODELS: ReadonlyArray<{
  id: Tab;
  title: string;
  subtitle: string;
  bestFor: string;
  description: string;
  cta: string;
  Icon: React.ElementType;
  image: string;
}> = [
  {
    id: 'all',
    title: 'Meal Boxes',
    subtitle: '3 · 5 · 8 Item Boxes',
    bestFor: 'Corporate Lunches',
    description: 'Pre-portioned meal boxes per guest. Efficient, consistent, ideal for large corporate gatherings.',
    cta: 'Explore',
    Icon: Package,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'occasion',
    title: 'Occasion Packages',
    subtitle: 'Preset Menus',
    bestFor: 'Parties & Celebrations',
    description: 'Curated menus for Farm House parties, Puja gatherings, Birthdays and community events.',
    cta: 'Explore',
    Icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'custom',
    title: 'Build Your Own',
    subtitle: 'Choose every dish',
    bestFor: 'Custom Events',
    description: 'Full control. Browse every dish, pick what you want, pay exact item-level prices.',
    cta: 'Start Building',
    Icon: ChefHat,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
  },
] as const;

/* ─────────────────────────────────────────────────────────
   Package image — derived from tier / type
───────────────────────────────────────────────────────── */
const TIER_IMAGES: Record<string, string> = {
  gold:    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=720&q=80',
  silver:  'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=720&q=80',
  premium: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=720&q=80',
  custom:  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=720&q=80',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=720&q=80',
};

function getPkgImage(pkg: PackageSummary): string {
  if (pkg.isCustom) return TIER_IMAGES.custom;
  const n = pkg.name.toLowerCase();
  if (n.includes('gold')) return TIER_IMAGES.gold;
  if (n.includes('silver')) return TIER_IMAGES.silver;
  if (n.includes('premium') || n.includes('platinum') || n.includes('royal')) return TIER_IMAGES.premium;
  return TIER_IMAGES.default;
}

/* ─────────────────────────────────────────────────────────
   Tier → visual styling
───────────────────────────────────────────────────────── */
type Tier = 'gold' | 'silver' | 'premium' | 'default';

function getPkgTier(pkg: PackageSummary): Tier {
  const n = pkg.name.toLowerCase();
  if (n.includes('gold')) return 'gold';
  if (n.includes('silver')) return 'silver';
  if (n.includes('premium') || n.includes('platinum') || n.includes('royal')) return 'premium';
  return 'default';
}

const TIER_RING: Record<Tier, string> = {
  gold:    'ring-2 ring-accent',
  silver:  'ring-1 ring-border',
  premium: 'ring-2 ring-primary/50',
  default: 'ring-1 ring-border',
};

const TIER_BADGE: Record<Tier, { label: string; cls: string } | null> = {
  gold:    { label: 'Most Popular', cls: 'bg-accent text-accent-foreground' },
  silver:  null,
  premium: { label: 'Premium', cls: 'bg-primary text-white' },
  default: null,
};

/* ─────────────────────────────────────────────────────────
   Package feature list — derived from isCustom + name
   (API summary doesn't include category rules)
───────────────────────────────────────────────────────── */
function getFeatures(pkg: PackageSummary): string[] {
  if (pkg.isCustom) {
    return [
      'Full menu access — every dish',
      'Exact item-level pricing',
      'Any dish combination',
      'No preset structure',
    ];
  }
  const n = pkg.name.toLowerCase();
  if (n.includes('gold'))   return ['3 Starters', '4 Main Courses', '2 Desserts', 'Beverages'];
  if (n.includes('silver')) return ['2 Starters', '3 Main Courses', '1 Dessert', 'Beverage'];
  if (n.includes('premium') || n.includes('platinum')) {
    return ['4 Starters', '5 Main Courses', '3 Desserts', 'Premium Beverages'];
  }
  return ['Pre-set Starters', 'Main Course & Rice', 'Desserts', 'Beverages included'];
}

/* ═══════════════════════════════════════════════════════
   Ordering Model Selector
══════════════════════════════════════════════════════════ */
function OrderingModelSelector({
  activeModel,
  onChange,
  gridRef,
}: {
  activeModel: Tab;
  onChange: (t: Tab) => void;
  gridRef: React.RefObject<HTMLDivElement>;
}) {
  function pick(id: Tab) {
    onChange(id);
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  return (
    <section>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Choose Your Ordering Model
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ORDERING_MODELS.map((model) => {
          const isActive = activeModel === model.id;
          return (
            <button
              key={model.id}
              onClick={() => pick(model.id)}
              className={cn(
                'group relative overflow-hidden rounded-2xl text-left transition-all duration-200',
                isActive
                  ? 'ring-2 ring-primary shadow-lg -translate-y-0.5'
                  : 'ring-1 ring-border/60 hover:ring-primary/40 hover:shadow-md hover:-translate-y-0.5',
              )}
            >
              {/* Photo background */}
              <div className="absolute inset-0">
                <img src={model.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/80" />
              </div>

              {/* Content */}
              <div className="relative flex h-40 flex-col justify-between p-4 sm:h-44">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                  <model.Icon className="h-3 w-3" />
                  Best for: {model.bestFor}
                </span>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">
                    {model.subtitle}
                  </p>
                  <h3 className="mt-0.5 font-serif text-lg font-bold text-white">{model.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-[1.4] text-white/65">
                    {model.description}
                  </p>
                  <div
                    className={cn(
                      'mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors',
                      isActive
                        ? 'bg-white text-primary'
                        : 'bg-white/20 text-white backdrop-blur-sm group-hover:bg-white/30',
                    )}
                  >
                    {model.cta} <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   Package Card
══════════════════════════════════════════════════════════ */
function PackageCard({
  pkg,
  onSelect,
  isSelected,
}: {
  pkg: PackageSummary;
  onSelect: (pkg: PackageSummary) => void;
  isSelected: boolean;
}) {
  const tier     = getPkgTier(pkg);
  const badge    = TIER_BADGE[tier];
  const features = getFeatures(pkg);
  const image    = getPkgImage(pkg);
  const price    = pkg.activeVersion?.basePricePerPlate;
  const minGuests = pkg.activeVersion?.minGuestCount ?? 20;
  const maxGuests = pkg.activeVersion?.maxGuestCount;

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        isSelected ? 'ring-2 ring-primary shadow-xl -translate-y-1' : TIER_RING[tier],
      )}
    >
      {/* Food image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={image}
          alt={pkg.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 to-transparent" />

        {/* Popularity / tier badge */}
        {badge && (
          <span className={cn('absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm', badge.cls)}>
            {badge.label}
          </span>
        )}

        {/* Type label — bottom of image */}
        <span className="absolute bottom-2.5 left-3 text-[10px] font-bold uppercase tracking-widest text-white/75">
          {pkg.isCustom ? 'Build Your Own' : 'Occasion Package'}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Name */}
        <h2 className="font-serif text-xl font-bold leading-snug text-foreground">{pkg.name}</h2>

        {/* Description */}
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {pkg.description ?? 'A thoughtfully curated catering package for your next event.'}
        </p>

        {/* Includes */}
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Includes
          </p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="text-xs leading-4 text-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Capacity chip */}
        <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
          <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Serves {minGuests.toLocaleString('en-IN')}
            {maxGuests ? `–${maxGuests.toLocaleString('en-IN')}` : '+'} guests
          </span>
        </div>

        {/* Price */}
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Starting at
          </p>
          <div className="mt-0.5 flex items-baseline">
            <span className="text-3xl font-extrabold tracking-tight text-primary">
              {price ? `₹${price}` : '—'}
            </span>
            <span className="ml-1.5 text-sm text-muted-foreground">/ person</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="mt-5 flex gap-2">
          <Link
            href={`/packages/${pkg.id}`}
            className="flex flex-1 items-center justify-center rounded-xl border border-border px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            View Details
          </Link>
          <button
            onClick={() => onSelect(pkg)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200',
              isSelected
                ? 'bg-primary text-white'
                : 'bg-primary/8 text-primary hover:bg-primary hover:text-white',
            )}
          >
            {isSelected ? (
              <>Selected <Check className="h-3.5 w-3.5" /></>
            ) : (
              'Select Package'
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════
   Selection Sidebar
══════════════════════════════════════════════════════════ */
function SelectionSidebar({
  pkg,
  guestCount,
  onGuestCountChange,
  onClear,
}: {
  pkg: PackageSummary | null;
  guestCount: number;
  onGuestCountChange: (n: number) => void;
  onClear: () => void;
}) {
  const price    = parseFloat(pkg?.activeVersion?.basePricePerPlate ?? '0');
  const minGuests = pkg?.activeVersion?.minGuestCount ?? 20;
  const total    = Math.round(price * guestCount);

  if (!pkg) {
    return (
      <aside className="sticky top-20 rounded-2xl border border-border bg-white p-5 shadow-md">
        <h2 className="font-serif text-lg font-bold text-foreground">Your Selection</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick a package to see pricing and continue to your catering order.
        </p>
        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            How It Works
          </p>
          {[
            'Choose your ordering model',
            'Select a package that fits your event',
            'Set your guest count',
            'Customize dishes on the next screen',
          ].map((step, i) => (
            <div key={step} className="flex items-start gap-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-extrabold text-primary">
                {i + 1}
              </span>
              <p className="text-xs leading-5 text-foreground">{step}</p>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-20 overflow-hidden rounded-2xl border border-border bg-white shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border bg-primary/5 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Selected Package
          </p>
          <h2 className="mt-0.5 font-serif text-lg font-bold text-foreground">{pkg.name}</h2>
        </div>
        <button
          onClick={onClear}
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-border hover:text-foreground"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5 px-5 py-5">
        {/* Guest count control */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Guest Count
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-border">
              <button
                onClick={() => onGuestCountChange(Math.max(minGuests, guestCount - 5))}
                className="grid h-9 w-9 place-items-center text-muted-foreground transition hover:text-foreground"
                aria-label="Decrease"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-bold tabular-nums">{guestCount}</span>
              <button
                onClick={() => onGuestCountChange(guestCount + 5)}
                className="grid h-9 w-9 place-items-center text-muted-foreground transition hover:text-foreground"
                aria-label="Increase"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">Min. {minGuests} guests</span>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Per person</span>
            <span className="font-semibold text-foreground">₹{pkg.activeVersion?.basePricePerPlate}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Guests</span>
            <span className="font-semibold text-foreground">× {guestCount}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Estimated Total
            </span>
            <span className="text-xl font-extrabold text-primary">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          {pkg.isCustom
            ? 'Final price depends on the dishes you choose.'
            : 'Price may change if you swap or upgrade dishes.'}
        </p>
      </div>

      {/* CTA */}
      <div className="border-t border-border px-5 py-4">
        <Link
          href={`/packages/${pkg.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-primary/90"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Customize dishes on the next screen
        </p>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════
   Skeleton
══════════════════════════════════════════════════════════ */
function PackageSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-border">
          <div className="aspect-[16/9] animate-pulse bg-muted" />
          <div className="space-y-3 p-5">
            <div className="h-6 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 animate-pulse rounded bg-muted" />
              ))}
            </div>
            <div className="h-9 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 w-28 animate-pulse rounded bg-muted" />
            <div className="flex gap-2 pt-1">
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════════ */
export default function PackagesPage() {
  const [packages, setPackages]   = useState<PackageSummary[]>([]);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedPkg, setSelectedPkg] = useState<PackageSummary | null>(null);
  const [guestCount, setGuestCount]   = useState(50);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiRequest<PackageSummary[]>('/packages')
      .then(setPackages)
      .catch((reason) => setError(reason.message));
  }, []);

  const filtered = packages.filter((pkg) => {
    if (activeTab === 'occasion') return !pkg.isCustom;
    if (activeTab === 'custom')   return pkg.isCustom;
    return true;
  });

  function handleSelect(pkg: PackageSummary) {
    setSelectedPkg((prev) => (prev?.id === pkg.id ? null : pkg));
    const pkgMin = pkg.activeVersion?.minGuestCount ?? 20;
    setGuestCount((g) => Math.max(g, pkgMin));
  }

  return (
    <main className="pb-16">
      {/* ① Compact header — max ~80px */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Packages</h1>
            <p className="text-sm text-muted-foreground">
              Choose how you'd like to order · Minimum 10 guests
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-semibold text-muted-foreground sm:flex">
            <Users className="h-4 w-4 text-primary" />
            20 – 1,000 guests
          </div>
        </div>
      </div>

      {/* ② Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-start lg:gap-7">

          {/* Left — model selector + grid */}
          <div className="min-w-0 flex-1">

            {/* Ordering model selector */}
            <OrderingModelSelector
              activeModel={activeTab}
              onChange={setActiveTab}
              gridRef={gridRef}
            />

            {/* Package grid */}
            <div ref={gridRef} className="mt-7 scroll-mt-24">
              {/* Grid header */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {activeTab === 'occasion'
                    ? 'Occasion Packages'
                    : activeTab === 'custom'
                    ? 'Build Your Own Menu'
                    : 'All Packages'}
                  {filtered.length > 0 && (
                    <span className="ml-2 font-normal text-muted-foreground">({filtered.length})</span>
                  )}
                </p>
                {activeTab !== 'all' && (
                  <button
                    onClick={() => setActiveTab('all')}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View all
                  </button>
                )}
              </div>

              {error && (
                <StatePanel
                  tone="danger"
                  title="Packages could not load"
                  description={error}
                  actionHref="/menu"
                  actionLabel="Browse menu instead"
                />
              )}

              {!error && packages.length === 0 && <PackageSkeleton />}

              {!error && packages.length > 0 && filtered.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {filtered.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      onSelect={handleSelect}
                      isSelected={selectedPkg?.id === pkg.id}
                    />
                  ))}
                </div>
              )}

              {!error && packages.length > 0 && filtered.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-lg font-bold text-foreground">No packages here</p>
                  <button
                    onClick={() => setActiveTab('all')}
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    View all packages
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right — sticky selection sidebar (desktop only) */}
          <div className="hidden lg:block lg:w-72 xl:w-80 shrink-0 pt-[3.25rem]">
            <SelectionSidebar
              pkg={selectedPkg}
              guestCount={guestCount}
              onGuestCountChange={setGuestCount}
              onClear={() => setSelectedPkg(null)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
