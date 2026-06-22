'use client';

import type { LucideIcon } from 'lucide-react';
import type { PackageSummary } from '@aranyam/shared-types';
import {
  ArrowRight,
  Check,
  Clock,
  Coffee,
  Cookie,
  Flame,
  Leaf,
  Lock,
  Minus,
  Package,
  Plus,
  Shield,
  ShieldCheck,
  Star,
  Truck,
  Users,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StatePanel } from '../../../components/ui/state-panel';
import { apiRequest } from '../../../lib/api';
import { useOrderBuilderStore } from '../../../store/order-builder.store';
import { cn } from '../../../lib/utils';

/* ═══════════════════════════════════════════════════════
   Static display data
   API provides ids + prices. Everything else is fixed UI.
══════════════════════════════════════════════════════════ */

// Always show these names, regardless of API package names
const BOX_DISPLAY_NAMES = ['3 Item Box', '5 Item Box', '8 Item Box'] as const;

type BoxMeta = { image: string; chips: string[]; popular?: true };

const BOX_META: BoxMeta[] = [
  {
    image:  'https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=800&q=80',
    chips:  ['1 Main Course', '1 Rice / Bread', '1 Dessert'],
  },
  {
    image:  'https://images.unsplash.com/photo-1484980972926-edee96e0960d?auto=format&fit=crop&w=800&q=80',
    chips:  ['1 Starter', '1 Main Course', '1 Rice', '1 Beverage', '1 Dessert'],
    popular: true,
  },
  {
    image:  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    chips:  ['2 Starters', '1 Main Course', '1 Rice', '1 Bread', '1 Beverage', '1 Dessert', '1 Premium'],
  },
];

type Row = { label: string; Icon: LucideIcon; values: [boolean, boolean, boolean] };

const COMPARISON_ROWS: Row[] = [
  { label: 'Starter',       Icon: Flame,           values: [false, true,  true ] },
  { label: 'Main Course',   Icon: UtensilsCrossed, values: [true,  true,  true ] },
  { label: 'Rice / Breads', Icon: Wheat,           values: [true,  true,  true ] },
  { label: 'Beverage',      Icon: Coffee,          values: [false, true,  true ] },
  { label: 'Dessert',       Icon: Cookie,          values: [true,  true,  true ] },
  { label: 'Premium Item',  Icon: Star,            values: [false, false, true ] },
];

// Sample dish list shown in sidebar (display only — actual dishes are chosen on /menu/select)
type SampleDish = { category: string; name: string; image: string };

const BOX_SAMPLE_DISHES: SampleDish[][] = [
  [
    { category: 'Main Course', name: 'Paneer Butter Masala', image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=80&q=80' },
    { category: 'Rice',        name: 'Steamed Basmati Rice', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=80&q=80' },
    { category: 'Dessert',     name: 'Gulab Jamun',          image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=80&q=80' },
  ],
  [
    { category: 'Starter',     name: 'Veg Manchurian',       image: 'https://images.unsplash.com/photo-1567188040759-fb8a254b4d85?auto=format&fit=crop&w=80&q=80' },
    { category: 'Main Course', name: 'Paneer Butter Masala', image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=80&q=80' },
    { category: 'Rice',        name: 'Steamed Rice',         image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=80&q=80' },
    { category: 'Beverage',    name: 'Fresh Lime Juice',     image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=80&q=80' },
    { category: 'Dessert',     name: 'Gulab Jamun',          image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=80&q=80' },
  ],
  [
    { category: 'Starter',     name: 'Veg Manchurian',       image: 'https://images.unsplash.com/photo-1567188040759-fb8a254b4d85?auto=format&fit=crop&w=80&q=80' },
    { category: 'Starter',     name: 'Paneer Tikka',         image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=80&q=80' },
    { category: 'Main Course', name: 'Dal Makhani',          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=80&q=80' },
    { category: 'Rice',        name: 'Steamed Rice',         image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=80&q=80' },
    { category: 'Bread',       name: 'Butter Naan',          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=80&q=80' },
    { category: 'Beverage',    name: 'Fresh Lime Juice',     image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=80&q=80' },
    { category: 'Dessert',     name: 'Gulab Jamun',          image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=80&q=80' },
    { category: 'Premium',     name: 'Rasgulla',             image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=80&q=80' },
  ],
];

const INFO_CARDS: { Icon: LucideIcon; label: string; desc: string }[] = [
  { Icon: Users,      label: 'Perfect for',     desc: 'Corporate Lunches, Trainings, Events & Community Meals' },
  { Icon: Package,    label: 'Minimum Order',   desc: '20 Boxes' },
  { Icon: ShieldCheck,label: 'Hygienic & Fresh',desc: 'Prepared daily' },
  { Icon: Truck,      label: 'On-time Delivery',desc: 'Always on schedule' },
];

const BOTTOM_FEATURES: { Icon: LucideIcon; label: string; desc: string }[] = [
  { Icon: Leaf,       label: 'Freshly prepared',   desc: 'Made with premium ingredients and no preservatives' },
  { Icon: Shield,     label: 'Hygienic packaging', desc: 'Food safe, tamper-proof containers' },
  { Icon: Clock,      label: 'On-time delivery',   desc: 'Punctual delivery for all corporate & event orders' },
];

/* ═══════════════════════════════════════════════════════
   Comparison Table
══════════════════════════════════════════════════════════ */
function ComparisonTable({
  packages,
  selectedIdx,
  onSelect,
}: {
  packages:    PackageSummary[];
  selectedIdx: number | null;
  onSelect:    (i: number) => void;
}) {
  if (packages.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-foreground">Compare Meal Boxes</h2>

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[400px] border-collapse text-xs">
          {/* "MOST POPULAR" banner row */}
          <thead>
            <tr>
              <th className="w-[32%]" />
              {packages.map((pkg, i) => {
                const isPopular = BOX_META[i]?.popular ?? false;
                return (
                  <th
                    key={pkg.id}
                    className={cn('text-center', isPopular ? 'bg-primary' : '')}
                  >
                    {isPopular && (
                      <span className="block py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                        Most Popular
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>

            {/* Column header: name + price */}
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Includes
              </th>
              {packages.map((pkg, i) => {
                const isPopular   = BOX_META[i]?.popular ?? false;
                const displayName = BOX_DISPLAY_NAMES[i] ?? pkg.name;
                return (
                  <th
                    key={pkg.id}
                    className={cn('px-3 py-2 text-center', isPopular ? 'bg-primary/5' : '')}
                  >
                    <p className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      isPopular ? 'text-primary' : 'text-foreground',
                    )}>
                      {displayName}
                    </p>
                    <p className="mt-0.5">
                      <span className="text-sm font-extrabold text-primary">
                        ₹{pkg.activeVersion?.basePricePerPlate}
                      </span>
                      <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">/ box</span>
                    </p>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Feature rows */}
          <tbody className="divide-y divide-border/40">
            {COMPARISON_ROWS.map(({ label, Icon, values }) => (
              <tr key={label} className="hover:bg-muted/20">
                <td className="px-4 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3 shrink-0 text-primary/60" />
                    <span className="text-xs text-foreground">{label}</span>
                  </div>
                </td>
                {packages.map((pkg, i) => {
                  const included  = values[i] ?? false;
                  const isPopular = BOX_META[i]?.popular ?? false;
                  return (
                    <td
                      key={pkg.id}
                      className={cn(
                        'px-3 py-1.5 text-center',
                        isPopular ? 'bg-primary/[0.03]' : '',
                      )}
                    >
                      {included ? (
                        <Check className="mx-auto h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-sm leading-none text-muted-foreground/35">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   Box Card
══════════════════════════════════════════════════════════ */
function BoxCard({
  pkg,
  index,
  isSelected,
  onSelect,
}: {
  pkg:        PackageSummary;
  index:      number;
  isSelected: boolean;
  onSelect:   () => void;
}) {
  const meta        = BOX_META[index];
  const displayName = BOX_DISPLAY_NAMES[index] ?? pkg.name;
  if (!meta) return null;

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 cursor-pointer',
        isSelected
          ? 'ring-2 ring-primary shadow-md'
          : meta.popular
          ? 'ring-1 ring-accent/60 hover:ring-accent'
          : 'ring-1 ring-border hover:ring-primary/40',
      )}
      onClick={onSelect}
    >
      {/* Most Popular banner */}
      {meta.popular && (
        <div className="bg-primary py-1.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">
            Most Popular
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={meta.image}
          alt={displayName}
          className="aspect-[4/3] w-full object-cover"
        />
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
          {displayName}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Content chips */}
        <div className="flex flex-wrap gap-1.5">
          {meta.chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-primary/40" />
              {chip}
            </span>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">Serves 1 Person</p>

        {/* Price + CTA row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <p>
            <span className="text-2xl font-extrabold text-foreground">
              ₹{pkg.activeVersion?.basePricePerPlate}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">/ box</span>
          </p>
          <button
            className={cn(
              'shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200',
              isSelected
                ? 'bg-primary text-white'
                : 'border border-primary bg-white text-primary hover:bg-primary hover:text-white',
            )}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            {isSelected ? 'Selected ✓' : 'Select Box'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════
   Order Sidebar (sticky, desktop only)
══════════════════════════════════════════════════════════ */
function OrderSidebar({
  pkg,
  index,
  qty,
  onQtyChange,
  onContinue,
  onEditBox,
}: {
  pkg:         PackageSummary | null;
  index:       number | null;
  qty:         number;
  onQtyChange: (n: number) => void;
  onContinue:  () => void;
  onEditBox:   () => void;
}) {
  const meta         = index !== null ? (BOX_META[index] ?? null) : null;
  const displayName  = index !== null ? (BOX_DISPLAY_NAMES[index] ?? pkg?.name ?? '') : '';
  const sampleDishes = index !== null ? (BOX_SAMPLE_DISHES[index] ?? []) : [];
  const price        = parseFloat(pkg?.activeVersion?.basePricePerPlate ?? '0');
  const subtotal     = price * qty;
  const minQty       = pkg?.activeVersion?.minGuestCount ?? 20;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="font-bold text-foreground">Your Order</span>
        {pkg && (
          <button
            onClick={onEditBox}
            className="text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Edit Box
          </button>
        )}
      </div>

      {pkg && meta ? (
        <>
          {/* Selected box thumbnail */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
            <img
              src={meta.image}
              alt={displayName}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
            <div>
              <p className="font-semibold text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">
                ₹{pkg.activeVersion?.basePricePerPlate} / box
              </p>
            </div>
          </div>

          {/* Guest / box quantity */}
          <div className="border-b border-border px-5 py-4">
            <p className="font-semibold text-foreground">How many boxes?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Minimum order: {minQty} boxes
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-xl border-2 border-border">
                <button
                  onClick={() => onQtyChange(Math.max(minQty, qty - 10))}
                  className="grid h-11 w-11 place-items-center bg-muted/50 text-foreground transition hover:bg-muted"
                  aria-label="Decrease by 10"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-20 border-x border-border text-center text-xl font-bold tabular-nums text-foreground">
                  {qty}
                </span>
                <button
                  onClick={() => onQtyChange(qty + 10)}
                  className="grid h-11 w-11 place-items-center bg-muted/50 text-foreground transition hover:bg-muted"
                  aria-label="Increase by 10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{qty} Boxes</p>
          </div>

          {/* Sample dishes */}
          <div className="border-b border-border px-5 py-4">
            <p className="font-semibold text-foreground">What's included in your box</p>
            <ul className="mt-3 space-y-3">
              {sampleDishes.map((dish, i) => (
                <li key={i} className="flex items-center gap-3">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {dish.category}
                    </p>
                    <p className="text-sm font-medium text-foreground">{dish.name}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="border-b border-border px-5 py-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal ({qty} boxes)</span>
                <span className="font-semibold text-foreground">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Estimated Total
              </p>
              <p className="mt-0.5 text-3xl font-extrabold text-foreground">
                ₹{subtotal.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 py-4">
            <button
              onClick={onContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow transition hover:bg-primary/90"
            >
              Continue to Checkout <ArrowRight className="h-4 w-4" />
            </button>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Secure & Safe Payments
            </div>
          </div>
        </>
      ) : (
        /* Empty state — still show qty selector so user can pre-set count */
        <div className="px-5 py-5">
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-foreground">No box selected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a meal box below to see your order summary.
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-foreground">How many boxes?</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-lg border border-border">
                <button
                  onClick={() => onQtyChange(Math.max(20, qty - 10))}
                  className="grid h-9 w-9 place-items-center text-muted-foreground transition hover:bg-muted"
                  aria-label="Decrease"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-14 border-x border-border text-center text-sm font-bold tabular-nums">
                  {qty}
                </span>
                <button
                  onClick={() => onQtyChange(qty + 10)}
                  className="grid h-9 w-9 place-items-center text-muted-foreground transition hover:bg-muted"
                  aria-label="Increase"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{qty} boxes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Skeleton
══════════════════════════════════════════════════════════ */
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-border">
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="flex gap-1.5">
                {[1, 2, 3].map((j) => <div key={j} className="h-5 w-20 animate-pulse rounded-full bg-muted" />)}
              </div>
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════════ */
export default function MealBoxesPage() {
  const router        = useRouter();
  const setPackage    = useOrderBuilderStore((s) => s.setPackage);
  const setGuestCount = useOrderBuilderStore((s) => s.setGuestCount);

  const [packages,     setPackages]     = useState<PackageSummary[]>([]);
  const [error,        setError]        = useState('');
  const [selectedIdx,  setSelectedIdx]  = useState<number | null>(null);
  const [qty,          setQty]          = useState(100);

  useEffect(() => {
    apiRequest<PackageSummary[]>('/packages')
      .then((pkgs) => {
        const sorted = pkgs
          .filter((p) => !p.isCustom && p.activeVersion)
          .sort((a, b) =>
            parseFloat(a.activeVersion!.basePricePerPlate) -
            parseFloat(b.activeVersion!.basePricePerPlate),
          );
        setPackages(sorted.slice(0, 3));
      })
      .catch((r) => setError(r.message));
  }, []);

  const selectedPkg = selectedIdx !== null ? (packages[selectedIdx] ?? null) : null;

  function handleSelect(idx: number) {
    setSelectedIdx((prev) => (prev === idx ? null : idx));
    const minQ = packages[idx]?.activeVersion?.minGuestCount ?? 20;
    setQty((q) => Math.max(q, minQ));
  }

  function handleContinue() {
    if (!selectedPkg?.activeVersion) return;
    setPackage({
      packageId:         selectedPkg.id,
      packageVersionId:  selectedPkg.activeVersion.id,
      packageName:       selectedPkg.name,
      isCustom:          selectedPkg.isCustom,
      basePricePerPlate: selectedPkg.activeVersion.basePricePerPlate,
      minGuestCount:     selectedPkg.activeVersion.minGuestCount,
      maxGuestCount:     selectedPkg.activeVersion.maxGuestCount,
    });
    setGuestCount(qty);
    router.push(`/events/new?packageVersionId=${selectedPkg.activeVersion.id}`);
  }

  return (
    <main className="min-h-screen pb-20">

      {/* ── Compact header ── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">Meal Boxes</h1>
              <p className="text-xs text-muted-foreground">
                Delicious, balanced meals. Perfectly portioned.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INFO_CARDS.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5"
                >
                  <Icon className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-semibold text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <StatePanel
            tone="danger"
            title="Could not load meal boxes"
            description={error}
            actionHref="/packages"
            actionLabel="Browse all packages"
          />
        )}

        <div className="lg:flex lg:items-start lg:gap-7">

          {/* Left: main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {!error && packages.length === 0 && <PageSkeleton />}

            {!error && packages.length > 0 && (
              <>
                <ComparisonTable
                  packages={packages}
                  selectedIdx={selectedIdx}
                  onSelect={handleSelect}
                />

                {/* Box cards */}
                <section>
                  <h2 className="mb-3 text-base font-bold text-foreground">Choose your box</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {packages.map((pkg, i) => (
                      <BoxCard
                        key={pkg.id}
                        pkg={pkg}
                        index={i}
                        isSelected={selectedIdx === i}
                        onSelect={() => handleSelect(i)}
                      />
                    ))}
                  </div>
                </section>

                {/* Bottom features */}
                <div className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-3">
                  {BOTTOM_FEATURES.map(({ Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: sticky sidebar (desktop) */}
          <div className="hidden lg:block lg:w-80 xl:w-[340px] shrink-0 sticky top-20">
            <OrderSidebar
              pkg={selectedPkg}
              index={selectedIdx}
              qty={qty}
              onQtyChange={setQty}
              onContinue={handleContinue}
              onEditBox={() => setSelectedIdx(null)}
            />
          </div>
        </div>

        {/* Mobile sticky CTA */}
        {selectedPkg && (
          <div className="fixed inset-x-0 bottom-16 z-30 px-4 pb-3 md:hidden">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-primary px-5 py-4 shadow-2xl">
              <div>
                <p className="font-bold leading-tight text-white">
                  {selectedIdx !== null
                    ? (BOX_DISPLAY_NAMES[selectedIdx] ?? selectedPkg.name)
                    : selectedPkg.name}
                </p>
                <p className="text-sm text-white/70">
                  {qty} boxes · ₹{(
                    parseFloat(selectedPkg.activeVersion?.basePricePerPlate ?? '0') * qty
                  ).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={handleContinue}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary shadow transition hover:bg-white/90"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
