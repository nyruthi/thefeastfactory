'use client';

import type { PackageConfiguration } from '@aranyam/shared-types';
import { Check, ChevronRight, Circle, Leaf, RotateCcw, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { OrderProgress } from '../../../components/order-progress';
import { Button } from '../../../components/ui/button';
import { apiRequest } from '../../../lib/api';
import { useOrderBuilderStore } from '../../../store/order-builder.store';

export default function MenuSelectPage() {
  const router = useRouter();
  const cartPackage = useOrderBuilderStore((state) => state.package);
  const event = useOrderBuilderStore((state) => state.event);
  const selectedItems = useOrderBuilderStore((state) => state.selectedItems);
  const toggleItem = useOrderBuilderStore((state) => state.toggleItem);
  const clearSelections = useOrderBuilderStore((state) => state.clearSelections);
  const [config, setConfig] = useState<PackageConfiguration>();
  const [error, setError] = useState('');
  const [limitMessage, setLimitMessage] = useState('');

  useEffect(() => {
    if (!cartPackage?.packageVersionId) return;
    apiRequest<PackageConfiguration>(`/package-versions/${cartPackage.packageVersionId}/configuration`)
      .then(setConfig)
      .catch((reason) => setError(reason.message));
  }, [cartPackage?.packageVersionId]);

  const ruleProgress = useMemo(() => {
    if (!config) return [];
    return config.categoryRules.map((rule) => {
      const count = selectedItems.filter((item) => item.categoryId === rule.category.id).length;
      return { rule, count, valid: count >= rule.minSelections && count <= rule.maxSelections };
    });
  }, [config, selectedItems]);

  const isCustom = Boolean(config?.isCustom || cartPackage?.isCustom);
  const valid = isCustom ? selectedItems.length > 0 : ruleProgress.length > 0 && ruleProgress.every((item) => item.valid);
  const additions = selectedItems.reduce((total, item) => total + Number(item.adjustmentAmount), 0);
  const perPlate = Number(cartPackage?.basePricePerPlate ?? 0) + additions;

  if (!cartPackage) {
    return (
      <main className="page-shell">
        <div className="surface-card mx-auto max-w-xl p-8 text-center">
          <h1 className="font-serif text-3xl font-semibold">Your cart is empty</h1>
          <p className="mt-3 text-muted-foreground">Choose a package before building a menu.</p>
          <Button asChild className="mt-6"><Link href="/packages">Browse packages</Link></Button>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="page-shell">
        <div className="surface-card mx-auto max-w-xl p-8 text-center">
          <h1 className="font-serif text-3xl font-semibold">Add your event details</h1>
          <p className="mt-3 text-muted-foreground">We need a date, guest count, and venue before you curate the menu.</p>
          <Button asChild className="mt-6"><Link href={`/events/new?packageVersionId=${cartPackage.packageVersionId}`}>Plan event</Link></Button>
        </div>
      </main>
    );
  }

  if (error) return <main className="page-shell"><p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p></main>;
  if (!config) return <main className="page-shell"><div className="h-96 animate-pulse rounded-[2rem] bg-white/60" /></main>;

  return (
    <main className="page-shell pb-36">
      <OrderProgress current={2} />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Curate your courses</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Build your {config.packageName} menu.</h1>
          <p className="mt-3 text-muted-foreground">
            {isCustom
              ? 'Choose any dishes you like. Item prices update your per-plate estimate instantly.'
              : 'Select within each course limit. Premium dishes update your estimate instantly.'}
          </p>
        </div>
        {selectedItems.length > 0 && (
          <button onClick={clearSelections} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
            <RotateCcw className="h-4 w-4" /> Clear menu
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {ruleProgress.map(({ rule, count, valid: ruleValid }) => (
            <section key={rule.id} className="surface-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white/70 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-serif text-2xl font-semibold">{rule.category.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isCustom ? 'Choose any dishes' : `Choose ${rule.minSelections}-${rule.maxSelections}`}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${ruleValid ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {isCustom ? `${count} selected` : `${count} of ${rule.maxSelections} selected`}
                </span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
                {rule.items.map((item) => {
                  const selected = selectedItems.some((selectedItem) => selectedItem.menuItemId === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const changed = toggleItem(
                          {
                            categoryId: rule.category.id,
                            categoryName: rule.category.name,
                            menuItemId: item.id,
                            menuItemName: item.name,
                            itemPrice: item.itemPrice,
                            adjustmentAmount: item.adjustmentAmount,
                            isVeg: item.isVeg,
                          },
                          rule.maxSelections,
                        );
                        setLimitMessage(changed ? '' : `${rule.category.name} allows up to ${rule.maxSelections} selections.`);
                      }}
                      className={`group flex min-h-28 items-start justify-between gap-4 rounded-xl border p-4 text-left transition ${selected ? 'border-primary bg-primary/[0.045] ring-1 ring-primary' : 'bg-white/70 hover:border-primary/30 hover:bg-white'}`}
                    >
                      <div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${item.isVeg ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                          <Leaf className="h-3 w-3" /> {item.isVeg ? 'Vegetarian' : 'Non-veg'}
                        </span>
                        <strong className="mt-3 block font-serif text-lg">{item.name}</strong>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                          {isCustom
                            ? `₹${item.itemPrice} per plate`
                            : Number(item.adjustmentAmount) > 0 ? `+₹${item.adjustmentAmount} per plate` : 'Included in package'}
                        </p>
                      </div>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${selected ? 'bg-primary text-white' : 'border bg-white text-muted-foreground'}`}>
                        {selected ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {limitMessage && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{limitMessage}</p>}
        </div>

        <aside className="surface-card h-fit p-6 lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Menu progress</p>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {ruleProgress.map(({ rule, count, valid: ruleValid }) => (
              <div key={rule.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{rule.category.name}</span>
                <span className={isCustom || ruleValid ? 'font-semibold text-primary' : 'font-semibold text-amber-700'}>
                  {isCustom ? `${count} selected` : `${count}/${rule.minSelections} min`}
                </span>
              </div>
            ))}
          </div>
          <div className="my-5 h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span>{isCustom ? 'Selected item total per plate' : 'Estimated per plate'}</span>
            <strong>₹{perPlate.toFixed(2)}</strong>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Final total is verified by the server at checkout.</p>
          <Button className="mt-6 w-full" disabled={!valid} onClick={() => router.push('/cart')}>
            Review cart <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </aside>
      </div>
    </main>
  );
}
