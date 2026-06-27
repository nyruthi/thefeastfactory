'use client';

import type { LucideIcon } from 'lucide-react';
import type { PackageSummary } from '@aranyam/shared-types';
import {
  ArrowRight,
  Check,
  ChevronUp,
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
  Soup,
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

/* ─── static display data ───────────────────────────────────────────── */

const BOX_DISPLAY_NAMES = ['3 Item Box', '5 Item Box', '8 Item Box'] as const;
const BOX_NUMS          = ['3', '5', '8'] as const;

type BoxMeta = { image: string; chips: { Icon: LucideIcon; label: string }[]; popular?: true };

const BOX_META: BoxMeta[] = [
  {
    image: '/tray-3.png',
    chips: [
      { Icon: UtensilsCrossed, label: '1 Main Course' },
      { Icon: Wheat,           label: '1 Rice / Bread' },
      { Icon: Cookie,          label: '1 Dessert' },
    ],
  },
  {
    image: '/tray-5.png',
    chips: [
      { Icon: Flame,           label: '1 Starter' },
      { Icon: UtensilsCrossed, label: '1 Main Course' },
      { Icon: Wheat,           label: '1 Rice / Bread' },
      { Icon: Coffee,          label: '1 Beverage' },
      { Icon: Cookie,          label: '1 Dessert' },
    ],
    popular: true,
  },
  {
    image: '/tray-8.png',
    chips: [
      { Icon: Flame,           label: '2 Starters' },
      { Icon: UtensilsCrossed, label: '1 Main Course' },
      { Icon: Wheat,           label: '1 Rice / Bread' },
      { Icon: Soup,            label: '1 Dal' },
      { Icon: Leaf,            label: '1 Sabzi' },
      { Icon: Coffee,          label: '1 Beverage' },
      { Icon: Cookie,          label: '1 Dessert' },
    ],
  },
];

type SampleDish = { category: string; name: string; image: string; description: string };

const BOX_VEG_DISHES: SampleDish[][] = [
  [
    { category: 'Main Course',  name: 'Paneer Butter Masala', image: '/inc-main.png',     description: 'Soft paneer cubes cooked in rich tomato gravy.' },
    { category: 'Rice / Bread', name: 'Steamed Basmati Rice', image: '/inc-rice.png',     description: 'Light, fluffy steamed basmati rice.' },
    { category: 'Dessert',      name: 'Gulab Jamun',          image: '/inc-dessert.png',  description: 'Soft and sweet milk-solid dumplings.' },
  ],
  [
    { category: 'Starter',      name: 'Veg Manchurian',       image: '/inc-starter.png',  description: 'Crispy veg balls tossed in a spicy, tangy sauce.' },
    { category: 'Main Course',  name: 'Paneer Butter Masala', image: '/inc-main.png',     description: 'Soft paneer cubes cooked in rich tomato gravy.' },
    { category: 'Rice / Bread', name: 'Steamed Rice',         image: '/inc-rice.png',     description: 'Light, fluffy steamed basmati rice.' },
    { category: 'Beverage',     name: 'Fresh Lime Juice',     image: '/inc-beverage.png', description: 'Refreshing lime juice to energize you.' },
    { category: 'Dessert',      name: 'Gulab Jamun',          image: '/inc-dessert.png',  description: 'Soft and sweet milk-solid dumplings.' },
  ],
  [
    { category: 'Starter',      name: 'Veg Manchurian',       image: '/inc-starter.png',  description: 'Crispy veg balls tossed in a spicy, tangy sauce.' },
    { category: 'Starter',      name: 'Paneer Tikka',         image: '/inc-starter.png',  description: 'Marinated paneer grilled with peppers and onions.' },
    { category: 'Main Course',  name: 'Dal Makhani',          image: '/inc-main.png',     description: 'Creamy black lentils slow-cooked overnight.' },
    { category: 'Rice / Bread', name: 'Steamed Rice',         image: '/inc-rice.png',     description: 'Light, fluffy steamed basmati rice.' },
    { category: 'Rice / Bread', name: 'Butter Naan',          image: '/inc-rice.png',     description: 'Soft, buttery flatbread from the tandoor.' },
    { category: 'Beverage',     name: 'Fresh Lime Juice',     image: '/inc-beverage.png', description: 'Refreshing lime juice to energize you.' },
    { category: 'Dessert',      name: 'Gulab Jamun',          image: '/inc-dessert.png',  description: 'Soft and sweet milk-solid dumplings.' },
    { category: 'Premium',      name: 'Rasgulla',             image: '/inc-dessert.png',  description: 'Spongy cottage cheese balls in light sugar syrup.' },
  ],
];

const BOX_NONVEG_DISHES: SampleDish[][] = [
  [
    { category: 'Main Course',  name: 'Butter Chicken',       image: '/inc-main.png',     description: 'Tender chicken in rich, creamy tomato gravy.' },
    { category: 'Rice / Bread', name: 'Steamed Basmati Rice', image: '/inc-rice.png',     description: 'Light, fluffy steamed basmati rice.' },
    { category: 'Dessert',      name: 'Gulab Jamun',          image: '/inc-dessert.png',  description: 'Soft and sweet milk-solid dumplings.' },
  ],
  [
    { category: 'Starter',      name: 'Chicken Tikka',        image: '/inc-starter.png',  description: 'Tender chicken marinated and grilled to perfection.' },
    { category: 'Main Course',  name: 'Butter Chicken',       image: '/inc-main.png',     description: 'Tender chicken in rich, creamy tomato gravy.' },
    { category: 'Rice / Bread', name: 'Steamed Rice',         image: '/inc-rice.png',     description: 'Light, fluffy steamed basmati rice.' },
    { category: 'Beverage',     name: 'Fresh Lime Juice',     image: '/inc-beverage.png', description: 'Refreshing lime juice to energize you.' },
    { category: 'Dessert',      name: 'Gulab Jamun',          image: '/inc-dessert.png',  description: 'Soft and sweet milk-solid dumplings.' },
  ],
  [
    { category: 'Starter',      name: 'Chicken Tikka',        image: '/inc-starter.png',  description: 'Tender chicken marinated and grilled to perfection.' },
    { category: 'Starter',      name: 'Prawn 65',             image: '/inc-starter.png',  description: 'Crispy prawns tossed in a spicy masala.' },
    { category: 'Main Course',  name: 'Mutton Masala',        image: '/inc-main.png',     description: 'Slow-cooked mutton in aromatic spices.' },
    { category: 'Rice / Bread', name: 'Steamed Rice',         image: '/inc-rice.png',     description: 'Light, fluffy steamed basmati rice.' },
    { category: 'Rice / Bread', name: 'Butter Naan',          image: '/inc-rice.png',     description: 'Soft, buttery flatbread from the tandoor.' },
    { category: 'Beverage',     name: 'Fresh Lime Juice',     image: '/inc-beverage.png', description: 'Refreshing lime juice to energize you.' },
    { category: 'Dessert',      name: 'Gulab Jamun',          image: '/inc-dessert.png',  description: 'Soft and sweet milk-solid dumplings.' },
    { category: 'Premium',      name: 'Fish Tikka',           image: '/inc-starter.png',  description: 'Marinated fish pieces grilled to tender perfection.' },
  ],
];

const INFO_CARDS: { Icon: LucideIcon; label: string; desc: string }[] = [
  { Icon: Users,       label: 'Perfect for',      desc: 'Corporate Lunches, Trainings, Events & Community Meals' },
  { Icon: Package,     label: 'Minimum Order',    desc: '20 Boxes' },
  { Icon: ShieldCheck, label: 'Hygienic & Fresh', desc: 'Prepared daily' },
  { Icon: Truck,       label: 'On-time Delivery', desc: 'Always on schedule' },
];

const BOTTOM_FEATURES: { Icon: LucideIcon; label: string; desc: string }[] = [
  { Icon: Leaf,   label: 'Fresh Ingredients',  desc: 'Sourced daily for the best taste' },
  { Icon: Shield, label: 'Hygienic Packaging', desc: 'Food safe and tamper-proof' },
  { Icon: Check,  label: 'Balanced Nutrition', desc: 'Curated for a wholesome meal' },
  { Icon: Clock,  label: 'Timely Delivery',    desc: 'Always on time, every time' },
];

/* ─── VegDot ─────────────────────────────────────────────────────────── */

function VegDot({ type, active }: { type: 'veg' | 'non-veg'; active: boolean }) {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-sm border-2 border-current">
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          active
            ? 'bg-white'
            : type === 'veg'
            ? 'bg-green-600'
            : 'bg-red-600',
        )}
      />
    </span>
  );
}

/* ─── BoxCard ───────────────────────────────────────────────────────── */

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
      onClick={onSelect}
      className={cn(
        'cursor-pointer overflow-hidden rounded-2xl bg-white transition-all duration-200',
        isSelected
          ? 'shadow-elevated ring-2 ring-primary'
          : meta.popular
          ? 'shadow-sm ring-1 ring-border hover:ring-primary/40'
          : 'shadow-sm ring-1 ring-border hover:ring-primary/30',
      )}
    >
      {meta.popular && (
        <div className="flex justify-center bg-primary py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="relative overflow-hidden">
        <img
          src={meta.image}
          alt={displayName}
          className="aspect-[16/10] w-full object-cover"
        />
        <span className="absolute left-2.5 top-2.5 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {displayName}
        </span>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {meta.chips.map(({ Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary"
            >
              <Icon className="h-2.5 w-2.5 shrink-0" />
              {label}
            </span>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">Serves 1 Person</p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl font-extrabold text-foreground">
              ₹{pkg.activeVersion?.basePricePerPlate}
            </span>
            <span className="text-xs text-muted-foreground">/ box</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
              'shrink-0 rounded-xl px-5 py-2 text-sm font-bold transition-all duration-200',
              isSelected
                ? 'bg-primary text-white'
                : 'border border-primary bg-white text-primary hover:bg-primary hover:text-white',
            )}
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── OrderSidebar ──────────────────────────────────────────────────── */

function OrderSidebar({
  pkg,
  index,
  vegMode,
  qty,
  onQtyChange,
  onContinue,
  onEditBox,
}: {
  pkg:         PackageSummary | null;
  index:       number | null;
  vegMode:     'veg' | 'non-veg';
  qty:         number;
  onQtyChange: (n: number) => void;
  onContinue:  () => void;
  onEditBox:   () => void;
}) {
  const meta         = index !== null ? (BOX_META[index] ?? null) : null;
  const displayName  = index !== null
    ? `${BOX_NUMS[index] ?? ''} Item ${vegMode === 'veg' ? 'Veg' : 'Non-Veg'} Box`
    : '';
  const sampleDishes = index !== null
    ? ((vegMode === 'veg' ? BOX_VEG_DISHES : BOX_NONVEG_DISHES)[index] ?? [])
    : [];
  const price    = parseFloat(pkg?.activeVersion?.basePricePerPlate ?? '0');
  const subtotal = price * qty;
  const minQty   = pkg?.activeVersion?.minGuestCount ?? 20;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-md">

      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-base font-bold text-foreground">Your Order</span>
        {pkg && (
          <button
            onClick={onEditBox}
            className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Edit Box
          </button>
        )}
      </div>

      {pkg && meta ? (
        <>
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <img
              src={meta.image}
              alt={displayName}
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
            <div>
              <p className="font-semibold text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">
                ₹{pkg.activeVersion?.basePricePerPlate} / box
              </p>
            </div>
          </div>

          <div className="border-b border-border px-5 py-4">
            <p className="font-semibold text-foreground">How many boxes?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Minimum order: {minQty} boxes</p>
            <div className="mt-4 flex items-center gap-5">
              <button
                onClick={() => onQtyChange(Math.max(minQty, qty - 10))}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary/90"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-14 text-center text-2xl font-bold tabular-nums text-foreground">
                {qty}
              </span>
              <button
                onClick={() => onQtyChange(qty + 10)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary/90"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{qty} Boxes</p>
          </div>

          <div className="border-b border-border px-5 py-4">
            <p className="font-semibold text-foreground">What's included in your box</p>
            <ul className="mt-3 space-y-3">
              {sampleDishes.map((dish, i) => (
                <li key={i} className="flex items-center gap-3">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
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

          <div className="border-b border-border px-5 py-4">
            <div className="space-y-2 text-sm">
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
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Estimated Total
              </p>
              <p className="mt-1 font-serif text-3xl font-extrabold text-foreground">
                ₹{subtotal.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            <button
              onClick={onContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
            >
              Continue to Checkout <ArrowRight className="h-4 w-4" />
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Secure & Safe Payments
            </div>
          </div>
        </>
      ) : (
        <div className="px-5 py-6">
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-foreground">No box selected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a meal box to see your order summary.
            </p>
          </div>
          <div className="mt-5">
            <p className="font-semibold text-foreground">How many boxes?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Minimum order: 20 boxes</p>
            <div className="mt-4 flex items-center gap-5">
              <button
                onClick={() => onQtyChange(Math.max(20, qty - 10))}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary/90"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-14 text-center text-2xl font-bold tabular-nums text-foreground">
                {qty}
              </span>
              <button
                onClick={() => onQtyChange(qty + 10)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary/90"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{qty} Boxes</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PageSkeleton ──────────────────────────────────────────────────── */

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-52 animate-pulse rounded-full bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-border">
            <div className="aspect-[16/10] animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                ))}
              </div>
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function MealBoxesPage() {
  const router        = useRouter();
  const setPackage    = useOrderBuilderStore((s) => s.setPackage);
  const setGuestCount = useOrderBuilderStore((s) => s.setGuestCount);

  const [vegPackages,    setVegPackages]    = useState<PackageSummary[]>([]);
  const [nonVegPackages, setNonVegPackages] = useState<PackageSummary[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [selectedIdx,    setSelectedIdx]    = useState<number | null>(null);
  const [vegMode,        setVegMode]        = useState<'veg' | 'non-veg'>('veg');
  const [qty,            setQty]            = useState(100);

  useEffect(() => {
    apiRequest<PackageSummary[]>('/packages')
      .then((pkgs) => {
        const mealBoxes = pkgs
          .filter((p) => p.type === 'MEAL_BOX' && p.activeVersion)
          .sort(
            (a, b) =>
              parseFloat(a.activeVersion!.basePricePerPlate) -
              parseFloat(b.activeVersion!.basePricePerPlate),
          );
        setVegPackages(mealBoxes.filter((p) => !p.name.toLowerCase().includes('non')).slice(0, 3));
        setNonVegPackages(mealBoxes.filter((p) => p.name.toLowerCase().includes('non')).slice(0, 3));
      })
      .catch((r) => setError(r.message))
      .finally(() => setLoading(false));
  }, []);

  const packages    = vegMode === 'veg' ? vegPackages : nonVegPackages;
  const selectedPkg = selectedIdx !== null ? (packages[selectedIdx] ?? null) : null;

  const currentDishes = selectedIdx !== null
    ? ((vegMode === 'veg' ? BOX_VEG_DISHES : BOX_NONVEG_DISHES)[selectedIdx] ?? [])
    : [];

  const selectedDisplayName = selectedIdx !== null
    ? `${BOX_NUMS[selectedIdx] ?? ''} Item ${vegMode === 'veg' ? 'Veg' : 'Non-Veg'} Box`
    : '';

  function handleSelect(idx: number) {
    setSelectedIdx((prev) => (prev === idx ? null : idx));
    const minQ = packages[idx]?.activeVersion?.minGuestCount ?? 20;
    setQty((q) => Math.max(q, minQ));
  }

  function handleVegModeChange(mode: 'veg' | 'non-veg') {
    setVegMode(mode);
    setSelectedIdx(null);
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
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Page header ── */}
        <div className="mb-7">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground">
            Meal Boxes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Delicious, balanced meals. Perfectly portioned.
          </p>
        </div>

        {/* ── Trust cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {INFO_CARDS.map(({ Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 shadow-sm"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-foreground">{label}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <StatePanel
            tone="danger"
            title="Could not load meal boxes"
            description={error}
            actionHref="/packages"
            actionLabel="Browse all packages"
          />
        )}

        {/* ── Two-column layout ── */}
        <div className="lg:flex lg:items-start lg:gap-8">

          {/* Left: main content */}
          <div className="min-w-0 flex-1 space-y-6">

            {!error && loading && <PageSkeleton />}

            {!error && !loading && (
              <>
                {/* ── Veg / Non-Veg toggle ── */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVegModeChange('veg')}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all duration-200',
                      vegMode === 'veg'
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-border bg-white text-foreground hover:border-primary/40',
                    )}
                  >
                    <VegDot type="veg" active={vegMode === 'veg'} />
                    Veg
                  </button>
                  <button
                    onClick={() => handleVegModeChange('non-veg')}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all duration-200',
                      vegMode === 'non-veg'
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-border bg-white text-foreground hover:border-primary/40',
                    )}
                  >
                    <VegDot type="non-veg" active={vegMode === 'non-veg'} />
                    Non Veg
                  </button>
                </div>

                {/* ── Box cards ── */}
                {packages.length > 0 ? (
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
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {vegMode === 'non-veg' ? 'Non-Veg boxes coming soon' : 'No boxes available'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Please check back later or try the Veg selection.
                    </p>
                  </div>
                )}

                {/* ── Expandable included items ── */}
                {selectedIdx !== null && currentDishes.length > 0 && (
                  <div className="rounded-2xl border border-border bg-white p-6">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {selectedDisplayName} Includes
                        </h3>
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                          Serves 1 Person
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedIdx(null)}
                        className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                      >
                        Collapse
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
                      {currentDishes.map((dish, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="h-16 w-full rounded-xl object-cover sm:h-14 sm:w-14"
                          />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                              {dish.category}
                            </p>
                            <p className="text-sm font-semibold text-foreground">{dish.name}</p>
                            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                              {dish.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Bottom features ── */}
                <div className="grid gap-5 rounded-2xl border border-border bg-white p-6 sm:grid-cols-4">
                  {BOTTOM_FEATURES.map(({ Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: sticky sidebar */}
          <div className="hidden lg:block lg:w-80 xl:w-[340px] shrink-0">
            <div className="sticky top-20">
              <OrderSidebar
                pkg={selectedPkg}
                index={selectedIdx}
                vegMode={vegMode}
                qty={qty}
                onQtyChange={setQty}
                onContinue={handleContinue}
                onEditBox={() => setSelectedIdx(null)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {selectedPkg && (
        <div className="fixed inset-x-0 bottom-16 z-30 px-4 pb-2 md:hidden">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-primary px-5 py-4 shadow-2xl">
            <div>
              <p className="font-bold leading-tight text-white">{selectedDisplayName}</p>
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
    </main>
  );
}
