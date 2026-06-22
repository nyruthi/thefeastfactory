'use client';

import type { PackageConfiguration } from '@aranyam/shared-types';
import {
  Check,
  ChevronRight,
  ImagePlus,
  Leaf,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { OrderProgress } from '../../../components/order-progress';
import { Button } from '../../../components/ui/button';
import { StatePanel } from '../../../components/ui/state-panel';
import { apiRequest } from '../../../lib/api';
import { useOrderBuilderStore } from '../../../store/order-builder.store';
import { cn } from '../../../lib/utils';

type MenuSelectionItem =
  PackageConfiguration['categoryRules'][number]['items'][number] & {
    ingredients?: string | null;
  };

export default function MenuSelectPage() {
  const router = useRouter();
  const cartPackage = useOrderBuilderStore((s) => s.package);
  const event = useOrderBuilderStore((s) => s.event);
  const guestCount = useOrderBuilderStore((s) => s.guestCount);
  const setGuestCount = useOrderBuilderStore((s) => s.setGuestCount);
  const selectedItems = useOrderBuilderStore((s) => s.selectedItems);
  const toggleItem = useOrderBuilderStore((s) => s.toggleItem);
  const clearSelections = useOrderBuilderStore((s) => s.clearSelections);
  const [config, setConfig] = useState<PackageConfiguration>();
  const [error, setError] = useState('');
  const [limitMessage, setLimitMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [detailItem, setDetailItem] = useState<{
    item: MenuSelectionItem;
    categoryId: string;
    categoryName: string;
    maxSelections: number;
  }>();
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!cartPackage?.packageVersionId) return;
    apiRequest<PackageConfiguration>(
      `/package-versions/${cartPackage.packageVersionId}/configuration`,
    )
      .then(setConfig)
      .catch((reason) => setError(reason.message));
  }, [cartPackage?.packageVersionId]);

  useEffect(() => {
    if (!config) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        const idx = sectionRefs.current.indexOf(top.target as HTMLElement);
        if (idx !== -1) setActiveTab(idx);
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    sectionRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, [config]);

  const ruleProgress = useMemo(() => {
    if (!config) return [];
    return config.categoryRules.map((rule) => {
      const count = selectedItems.filter((i) => i.categoryId === rule.category.id).length;
      return { rule, count, valid: count >= rule.minSelections && count <= rule.maxSelections };
    });
  }, [config, selectedItems]);

  const isCustom = Boolean(config?.isCustom || cartPackage?.isCustom);
  const valid = isCustom
    ? selectedItems.length > 0
    : ruleProgress.length > 0 && ruleProgress.every((r) => r.valid);
  const additions = selectedItems.reduce((t, i) => t + Number(i.adjustmentAmount), 0);
  const perPlate = Number(cartPackage?.basePricePerPlate ?? 0) + additions;
  const estimate = perPlate * guestCount;
  const minGuests = cartPackage?.minGuestCount ?? 1;
  const maxGuests = cartPackage?.maxGuestCount ?? 1000;

  function scrollToSection(index: number) {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveTab(index);
  }

  function selectItem(
    item: MenuSelectionItem,
    categoryId: string,
    categoryName: string,
    maxSelections: number,
  ) {
    const changed = toggleItem(
      { categoryId, categoryName, menuItemId: item.id, menuItemName: item.name, itemPrice: item.itemPrice, adjustmentAmount: item.adjustmentAmount, isVeg: item.isVeg },
      maxSelections,
    );
    setLimitMessage(changed ? '' : `${categoryName} allows up to ${maxSelections} selections.`);
    return changed;
  }

  function detailText(item: MenuSelectionItem) {
    return {
      description: item.description || 'A Feast Factory catering favourite prepared fresh for your event.',
    };
  }

  if (!cartPackage)
    return (
      <main className="page-shell">
        <StatePanel icon={ShoppingBag} eyebrow="Menu builder" title="Choose a package first" description="Packages define your course rules and included dishes." actionHref="/packages" actionLabel="Browse packages" secondaryHref="/menu" secondaryLabel="Preview dishes" />
      </main>
    );

  if (!event)
    return (
      <main className="page-shell">
        <StatePanel icon={Users} eyebrow="Event required" title="Add your event details" description="We need the date, guest count, and venue before showing menu limits." actionHref={`/events/new?packageVersionId=${cartPackage.packageVersionId}`} actionLabel="Add event details" secondaryHref="/cart" secondaryLabel="Review cart" />
      </main>
    );

  if (error)
    return (
      <main className="page-shell">
        <StatePanel tone="danger" title="Menu could not load" description={error} actionHref="/packages" actionLabel="Choose another package" />
      </main>
    );

  if (!config)
    return (
      <main className="page-shell">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </main>
    );

  return (
    <main className="pb-40">
      {/* ── Maroon header ── */}
      <div className="bg-primary">
        <div className="container-pad py-6">
          <div className="mb-5">
            <OrderProgress current={2} />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Build your {config.packageName} menu
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {isCustom
                  ? 'Pick any dishes — prices update your estimate instantly.'
                  : 'Select within each course limit. Gold badges = premium upgrades.'}
              </p>
            </div>

            {/* Guest count stepper */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                <Users className="h-3.5 w-3.5 text-white/60" />
                <span className="text-xs font-semibold text-white/70">Guests</span>
                <button
                  onClick={() => setGuestCount(Math.max(minGuests, guestCount - 1))}
                  className="grid h-6 w-6 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[2rem] text-center text-sm font-extrabold text-white tabular-nums">
                  {guestCount}
                </span>
                <button
                  onClick={() => setGuestCount(Math.min(maxGuests, guestCount + 1))}
                  className="grid h-6 w-6 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {selectedItems.length > 0 && (
                <button
                  onClick={clearSelections}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white/80 hover:bg-white/15 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="border-t border-white/10">
          <div className="container-pad">
            <div className="flex gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
              {ruleProgress.map(({ rule, count, valid: ruleValid }, idx) => (
                <button
                  key={rule.id}
                  onClick={() => scrollToSection(idx)}
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors',
                    activeTab === idx
                      ? 'bg-white text-primary'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {rule.category.name}
                  {count > 0 && (
                    <span
                      className={cn(
                        'ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold',
                        ruleValid ? 'bg-accent text-accent-foreground' : 'bg-white/20 text-white',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="container-pad py-6">
        <div className="flex gap-8">
          {/* Dish sections */}
          <div className="min-w-0 flex-1 space-y-12">
            {ruleProgress.map(({ rule, count, valid: ruleValid }, idx) => (
              <section key={rule.id} ref={(el) => { sectionRefs.current[idx] = el; }}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold">{rule.category.name}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {isCustom ? 'Choose any dishes' : `Select ${rule.minSelections}–${rule.maxSelections} dishes`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1 text-xs font-extrabold',
                      (ruleValid || isCustom) ? 'bg-primary/10 text-primary'
                        : count > 0 ? 'bg-amber-50 text-amber-700'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isCustom ? `${count} selected` : `${count} / ${rule.maxSelections}`}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {rule.items.map((item) => {
                    const selected = selectedItems.some((s) => s.menuItemId === item.id);
                    const isUpgrade = !isCustom && Number(item.adjustmentAmount) > 0;
                    return (
                      <article
                        key={item.id}
                        className={cn(
                          'food-card group flex flex-col',
                          selected && 'border-primary ring-2 ring-primary/20',
                        )}
                      >
                        <button
                          type="button"
                          className="relative block w-full text-left"
                          onClick={() => setDetailItem({ item, categoryId: rule.category.id, categoryName: rule.category.name, maxSelections: rule.maxSelections })}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                                <ImagePlus className="h-8 w-8 text-primary/20" />
                              </div>
                            )}
                            <span className={cn('absolute left-2.5 top-2.5 shadow-sm', item.isVeg ? 'veg-badge' : 'nonveg-badge')}>
                              <Leaf className="h-2.5 w-2.5" />
                              {item.isVeg ? 'Veg' : 'Non-veg'}
                            </span>
                            {isUpgrade && (
                              <span className="absolute right-2.5 top-2.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-extrabold text-accent-foreground shadow-sm">
                                +₹{item.adjustmentAmount}
                              </span>
                            )}
                            {selected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-primary/40">
                                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary shadow-lg">
                                  <Check className="h-6 w-6 text-white" strokeWidth={3} />
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                        <div className="flex flex-1 flex-col p-4">
                          <p className="font-extrabold leading-tight">{item.name}</p>
                          <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-5 text-muted-foreground">
                            {detailText(item).description}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-muted-foreground">
                              {isCustom ? `₹${item.itemPrice}/plate`
                                : Number(item.adjustmentAmount) > 0 ? `+₹${item.adjustmentAmount}/plate`
                                  : 'Included'}
                            </p>
                            <button
                              type="button"
                              onClick={() => selectItem(item, rule.category.id, rule.category.name, rule.maxSelections)}
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-extrabold transition-colors',
                                selected
                                  ? 'bg-primary text-white'
                                  : 'border-2 border-border text-muted-foreground hover:border-primary hover:text-primary',
                              )}
                            >
                              {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" strokeWidth={3} />}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
            {limitMessage && (
              <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{limitMessage}</p>
            )}
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-20 space-y-4">
              <div className="surface-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Menu progress</p>
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-4 space-y-2.5">
                  {ruleProgress.map(({ rule, count, valid: ruleValid }) => (
                    <div key={rule.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{rule.category.name}</span>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-extrabold',
                        isCustom || ruleValid ? 'bg-primary/10 text-primary'
                          : count > 0 ? 'bg-amber-50 text-amber-700'
                            : 'bg-muted text-muted-foreground',
                      )}>
                        {isCustom ? `${count} selected` : `${count}/${rule.minSelections} min`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="my-4 h-px bg-border" />
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Per plate</span>
                    <span className="font-extrabold text-foreground">₹{perPlate.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{guestCount} guests</span>
                    <span className="font-extrabold text-foreground">≈ ₹{estimate.toFixed(0)}</span>
                  </div>
                </div>
                <Button className="mt-5 w-full rounded-full" disabled={!valid} onClick={() => router.push('/cart')}>
                  Review cart <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
                {!valid && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">Complete all required courses to continue.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} · ₹{perPlate.toFixed(0)}/plate
            </p>
            <p className="text-xs text-muted-foreground">≈ ₹{estimate.toFixed(0)} for {guestCount} guests</p>
          </div>
          <Button className="shrink-0 rounded-full" disabled={!valid} onClick={() => router.push('/cart')}>
            Review cart <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="surface-card max-h-[90vh] w-full max-w-2xl overflow-hidden bg-card">
            <div className="grid md:grid-cols-[1fr_1fr]">
              <div className="relative min-h-60 bg-muted">
                {detailItem.item.imageUrl ? (
                  <img src={detailItem.item.imageUrl} alt={detailItem.item.name} className="h-full max-h-[90vh] min-h-60 w-full object-cover" />
                ) : (
                  <div className="flex h-full min-h-60 items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                    <Utensils className="h-12 w-12 text-primary/25" />
                  </div>
                )}
              </div>
              <div className="overflow-y-auto p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={cn(detailItem.item.isVeg ? 'veg-badge' : 'nonveg-badge')}>
                      <Leaf className="h-2.5 w-2.5" />
                      {detailItem.item.isVeg ? 'Vegetarian' : 'Non-veg'}
                    </span>
                    <h2 className="mt-3 text-xl font-extrabold">{detailItem.item.name}</h2>
                    <p className="mt-0.5 text-sm font-bold text-primary">{detailItem.categoryName}</p>
                  </div>
                  <button onClick={() => setDetailItem(undefined)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-5 space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">{detailText(detailItem.item).description}</p>
                  <div className="surface-inset p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isCustom ? 'Item price' : 'Package adjustment'}</span>
                      <strong>
                        {isCustom
                          ? `₹${detailItem.item.itemPrice} / plate`
                          : Number(detailItem.item.adjustmentAmount) > 0
                            ? `+₹${detailItem.item.adjustmentAmount} / plate`
                            : 'Included in package'}
                      </strong>
                    </div>
                  </div>
                  <Button
                    className="w-full rounded-full"
                    onClick={() => {
                      selectItem(detailItem.item, detailItem.categoryId, detailItem.categoryName, detailItem.maxSelections);
                      setDetailItem(undefined);
                    }}
                  >
                    {selectedItems.some((s) => s.menuItemId === detailItem.item.id) ? 'Remove from menu' : 'Add to menu'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
