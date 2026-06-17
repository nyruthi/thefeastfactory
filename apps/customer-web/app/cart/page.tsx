'use client';

import type { PackageConfiguration } from '@aranyam/shared-types';
import { CalendarDays, ChevronRight, MapPin, MinusCircle, ShoppingBag, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { OrderProgress } from '../../components/order-progress';
import { Button } from '../../components/ui/button';
import { apiRequest } from '../../lib/api';
import { useOrderBuilderStore } from '../../store/order-builder.store';

export default function CartPage() {
  const cartPackage = useOrderBuilderStore((state) => state.package);
  const event = useOrderBuilderStore((state) => state.event);
  const guestCount = useOrderBuilderStore((state) => state.guestCount);
  const selectedItems = useOrderBuilderStore((state) => state.selectedItems);
  const removeItem = useOrderBuilderStore((state) => state.removeItem);
  const reset = useOrderBuilderStore((state) => state.reset);
  const [config, setConfig] = useState<PackageConfiguration>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (cartPackage?.packageVersionId) {
      apiRequest<PackageConfiguration>(`/package-versions/${cartPackage.packageVersionId}/configuration`)
        .then(setConfig)
        .catch(() => setConfig(undefined));
    }
  }, [cartPackage?.packageVersionId]);

  const selectionStatus = useMemo(() => {
    if (!config) return { valid: false, missing: [] as string[] };
    if (config.isCustom) return { valid: selectedItems.length > 0, missing: selectedItems.length ? [] : ['at least one dish'] };
    const missing = config.categoryRules
      .filter((rule) => {
        const count = selectedItems.filter((item) => item.categoryId === rule.category.id).length;
        return count < rule.minSelections || count > rule.maxSelections;
      })
      .map((rule) => rule.category.name);
    return { valid: missing.length === 0, missing };
  }, [config, selectedItems]);

  if (!mounted) return <main className="page-shell"><div className="h-80 animate-pulse rounded-[2rem] bg-white/60" /></main>;
  if (!cartPackage) {
    return (
      <main className="page-shell">
        <div className="surface-card mx-auto max-w-xl p-8 text-center sm:p-12">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><ShoppingBag className="h-7 w-7" /></span>
          <h1 className="mt-6 font-serif text-4xl font-semibold">Your cart is ready for an idea.</h1>
          <p className="mt-3 leading-7 text-muted-foreground">Start with a catering package, then add your event and curate the menu.</p>
          <Button asChild className="mt-7"><Link href="/packages">Explore packages</Link></Button>
        </div>
      </main>
    );
  }

  const additions = selectedItems.reduce((total, item) => total + Number(item.adjustmentAmount), 0);
  const finalPerPlate = Number(cartPackage.basePricePerPlate) + additions;
  const estimate = finalPerPlate * guestCount;
  const nextHref = !event
    ? `/events/new?packageVersionId=${cartPackage.packageVersionId}`
    : !selectionStatus.valid
      ? '/menu/select'
      : '/checkout';
  const nextLabel = !event ? 'Add event details' : !selectionStatus.valid ? 'Complete menu' : 'Continue to checkout';

  const grouped = selectedItems.reduce<Record<string, typeof selectedItems>>((groups, item) => {
    groups[item.categoryName] = [...(groups[item.categoryName] ?? []), item];
    return groups;
  }, {});

  return (
    <main className="page-shell pb-28">
      <OrderProgress current={!event ? 1 : !selectionStatus.valid ? 2 : 3} />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your cart</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">Review the celebration plan.</h1>
        </div>
        <button onClick={reset} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-red-700">
          <Trash2 className="h-4 w-4" /> Clear cart
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="surface-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Selected package</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold">{cartPackage.packageName}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {cartPackage.isCustom ? 'Priced from selected dish base prices' : `₹${cartPackage.basePricePerPlate} base price per guest`}
                </p>
              </div>
              <Button asChild variant="outline"><Link href="/packages">Change package</Link></Button>
            </div>
          </section>

          <section className="surface-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Event details</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold">{event?.eventName || (event ? 'Your catering event' : 'Not added yet')}</h2>
              </div>
              <Button asChild variant="outline">
                <Link href={`/events/new?packageVersionId=${cartPackage.packageVersionId}`}>{event ? 'Edit' : 'Add details'}</Link>
              </Button>
            </div>
            {event ? (
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <p className="flex gap-2"><CalendarDays className="h-4 w-4 text-primary" /> {new Date(`${event.eventDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="flex gap-2"><Users className="h-4 w-4 text-primary" /> {guestCount} guests</p>
                <p className="flex gap-2"><MapPin className="h-4 w-4 text-primary" /> {event.addressLabel}</p>
              </div>
            ) : <p className="mt-4 text-sm text-amber-700">Add a date, venue, and guest count to continue.</p>}
          </section>

          <section className="surface-card overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b bg-white/60 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Curated menu</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold">{selectedItems.length} dishes selected</h2>
              </div>
              <Button asChild variant="outline"><Link href="/menu/select">{selectedItems.length ? 'Edit menu' : 'Choose dishes'}</Link></Button>
            </div>
            {selectedItems.length ? (
              <div className="divide-y">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{category}</p>
                    <div className="mt-3 space-y-3">
                      {items.map((item) => (
                        <div key={item.menuItemId} className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{item.menuItemName}</p>
                            <p className="text-xs text-muted-foreground">
                              {cartPackage.isCustom
                                ? `₹${item.itemPrice} per plate`
                                : Number(item.adjustmentAmount) ? `+₹${item.adjustmentAmount} per plate` : 'Included'}
                            </p>
                          </div>
                          <button onClick={() => removeItem(item.menuItemId)} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-700" aria-label={`Remove ${item.menuItemName}`}>
                            <MinusCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="p-6 text-sm text-muted-foreground">No dishes selected yet.</p>}
          </section>
        </div>

        <aside className="surface-card h-fit p-7 lg:sticky lg:top-28">
          <p className="eyebrow">Estimated total</p>
          <div className="mt-6 space-y-3 text-sm">
            {!cartPackage.isCustom && (
              <div className="flex justify-between"><span className="text-muted-foreground">Base per plate</span><span>₹{Number(cartPackage.basePricePerPlate).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{cartPackage.isCustom ? 'Selected item total per plate' : 'Premium additions'}</span>
              <span>₹{additions.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold"><span>Per plate</span><span>₹{finalPerPlate.toFixed(2)}</span></div>
          </div>
          <div className="my-5 h-px bg-border" />
          <div className="flex items-end justify-between">
            <div><p className="text-sm text-muted-foreground">For {guestCount} guests</p><p className="mt-1 font-serif text-4xl font-semibold">₹{estimate.toFixed(2)}</p></div>
          </div>
          {!selectionStatus.valid && event && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Complete: {selectionStatus.missing.join(', ') || 'menu selections'}.
            </p>
          )}
          <Button asChild className="mt-6 w-full">
            <Link href={nextHref}>{nextLabel} <ChevronRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Final pricing is confirmed securely at checkout.</p>
        </aside>
      </div>
    </main>
  );
}
