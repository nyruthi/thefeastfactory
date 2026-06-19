'use client';

import type { PackageConfiguration } from '@aranyam/shared-types';
import {
  Check,
  ChevronRight,
  ImagePlus,
  Leaf,
  RotateCcw,
  ShoppingBag,
  Utensils,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { OrderProgress } from '../../../components/order-progress';
import { Button } from '../../../components/ui/button';
import { StatePanel } from '../../../components/ui/state-panel';
import { apiRequest } from '../../../lib/api';
import { useOrderBuilderStore } from '../../../store/order-builder.store';

type MenuSelectionItem =
  PackageConfiguration['categoryRules'][number]['items'][number] & {
    ingredients?: string | null;
  };

export default function MenuSelectPage() {
  const router = useRouter();
  const cartPackage = useOrderBuilderStore((state) => state.package);
  const event = useOrderBuilderStore((state) => state.event);
  const selectedItems = useOrderBuilderStore((state) => state.selectedItems);
  const toggleItem = useOrderBuilderStore((state) => state.toggleItem);
  const clearSelections = useOrderBuilderStore(
    (state) => state.clearSelections,
  );
  const [config, setConfig] = useState<PackageConfiguration>();
  const [error, setError] = useState('');
  const [limitMessage, setLimitMessage] = useState('');
  const [detailItem, setDetailItem] = useState<{
    item: MenuSelectionItem;
    categoryId: string;
    categoryName: string;
    maxSelections: number;
  }>();

  useEffect(() => {
    if (!cartPackage?.packageVersionId) return;
    apiRequest<PackageConfiguration>(
      `/package-versions/${cartPackage.packageVersionId}/configuration`,
    )
      .then(setConfig)
      .catch((reason) => setError(reason.message));
  }, [cartPackage?.packageVersionId]);

  const ruleProgress = useMemo(() => {
    if (!config) return [];
    return config.categoryRules.map((rule) => {
      const count = selectedItems.filter(
        (item) => item.categoryId === rule.category.id,
      ).length;
      return {
        rule,
        count,
        valid: count >= rule.minSelections && count <= rule.maxSelections,
      };
    });
  }, [config, selectedItems]);

  const isCustom = Boolean(config?.isCustom || cartPackage?.isCustom);
  const valid = isCustom
    ? selectedItems.length > 0
    : ruleProgress.length > 0 && ruleProgress.every((item) => item.valid);
  const additions = selectedItems.reduce(
    (total, item) => total + Number(item.adjustmentAmount),
    0,
  );
  const perPlate = Number(cartPackage?.basePricePerPlate ?? 0) + additions;

  function selectItem(
    item: MenuSelectionItem,
    categoryId: string,
    categoryName: string,
    maxSelections: number,
  ) {
    const changed = toggleItem(
      {
        categoryId,
        categoryName,
        menuItemId: item.id,
        menuItemName: item.name,
        itemPrice: item.itemPrice,
        adjustmentAmount: item.adjustmentAmount,
        isVeg: item.isVeg,
      },
      maxSelections,
    );
    setLimitMessage(
      changed
        ? ''
        : `${categoryName} allows up to ${maxSelections} selections.`,
    );
    return changed;
  }

  function detailText(item: MenuSelectionItem) {
    return {
      description:
        item.description ||
        'A Feast Factory catering favourite prepared fresh for your event menu.',
      ingredients:
        item.ingredients ||
        item.description ||
        'Ingredient details will be confirmed by the Aranyam team. Please mention allergies or dietary restrictions in event notes.',
    };
  }

  if (!cartPackage) {
    return (
      <main className="page-shell">
        <StatePanel
          icon={ShoppingBag}
          eyebrow="Menu builder"
          title="Choose a package before building a menu"
          description="Packages define your course rules, included dishes, and premium additions so your estimate stays accurate."
          actionHref="/packages"
          actionLabel="Browse packages"
          secondaryHref="/menu"
          secondaryLabel="Preview dishes"
        />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="page-shell">
        <StatePanel
          icon={Users}
          eyebrow="Event required"
          title="Add your event details"
          description="We need the date, guest count, and venue before showing the right menu limits and checkout total."
          actionHref={`/events/new?packageVersionId=${cartPackage.packageVersionId}`}
          actionLabel="Plan event"
          secondaryHref="/cart"
          secondaryLabel="Review cart"
        />
      </main>
    );
  }

  if (error)
    return (
      <main className="page-shell">
        <StatePanel
          tone="danger"
          title="Menu could not load"
          description={error}
          actionHref="/packages"
          actionLabel="Choose another package"
        />
      </main>
    );
  if (!config)
    return (
      <main className="page-shell">
        <div className="h-96 animate-pulse rounded-[2rem] bg-white/60" />
      </main>
    );

  return (
    <main className="page-shell pb-36">
      <OrderProgress current={2} />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Curate your courses</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            Build your {config.packageName} menu.
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isCustom
              ? 'Choose any dishes you like. Item prices update your per-plate estimate instantly.'
              : 'Select within each course limit. Premium dishes update your estimate instantly.'}
          </p>
        </div>
        {selectedItems.length > 0 && (
          <button
            onClick={clearSelections}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
          >
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
                  <h2 className="font-serif text-2xl font-semibold">
                    {rule.category.name}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isCustom
                      ? 'Choose any dishes'
                      : `Choose ${rule.minSelections}-${rule.maxSelections}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${ruleValid ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                >
                  {isCustom
                    ? `${count} selected`
                    : `${count} of ${rule.maxSelections} selected`}
                </span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
                {rule.items.map((item) => {
                  const selected = selectedItems.some(
                    (selectedItem) => selectedItem.menuItemId === item.id,
                  );
                  const details = detailText(item);
                  return (
                    <article
                      key={item.id}
                      className={`group overflow-hidden rounded-xl border text-left transition ${selected ? 'border-primary bg-primary/[0.045] ring-1 ring-primary' : 'bg-white/75 hover:border-primary/30 hover:bg-white'}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setDetailItem({
                            item,
                            categoryId: rule.category.id,
                            categoryName: rule.category.name,
                            maxSelections: rule.maxSelections,
                          })
                        }
                        className="block w-full text-left"
                      >
                        <div className="relative aspect-[4/3] bg-muted">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="grid h-full place-items-center bg-gradient-to-br from-primary/10 via-accent/10 to-white text-primary">
                              <ImagePlus className="h-9 w-9" />
                            </div>
                          )}
                          <span
                            className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${item.isVeg ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}
                          >
                            <Leaf className="h-3 w-3" />{' '}
                            {item.isVeg ? 'Veg' : 'Non-veg'}
                          </span>
                        </div>
                        <div className="p-4">
                          <strong className="block font-serif text-xl">
                            {item.name}
                          </strong>
                          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                            {details.description}
                          </p>
                          <p className="mt-3 text-xs font-semibold text-muted-foreground">
                            {isCustom
                              ? `₹${item.itemPrice} per plate`
                              : Number(item.adjustmentAmount) > 0
                                ? `+₹${item.adjustmentAmount} per plate`
                                : 'Included in package'}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center justify-between gap-3 border-t bg-white/65 p-3">
                        <button
                          type="button"
                          onClick={() =>
                            setDetailItem({
                              item,
                              categoryId: rule.category.id,
                              categoryName: rule.category.name,
                              maxSelections: rule.maxSelections,
                            })
                          }
                          className="text-sm font-semibold text-primary"
                        >
                          View details
                        </button>
                        <Button
                          type="button"
                          variant={selected ? 'secondary' : 'outline'}
                          className="h-9 px-4"
                          onClick={() =>
                            selectItem(
                              item,
                              rule.category.id,
                              rule.category.name,
                              rule.maxSelections,
                            )
                          }
                        >
                          {selected ? <Check className="mr-2 h-4 w-4" /> : null}
                          {selected ? 'Selected' : 'Add'}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
          {limitMessage && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              {limitMessage}
            </p>
          )}
        </div>

        <aside className="surface-card h-fit p-6 lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Menu progress</p>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {ruleProgress.map(({ rule, count, valid: ruleValid }) => (
              <div
                key={rule.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {rule.category.name}
                </span>
                <span
                  className={
                    isCustom || ruleValid
                      ? 'font-semibold text-primary'
                      : 'font-semibold text-amber-700'
                  }
                >
                  {isCustom
                    ? `${count} selected`
                    : `${count}/${rule.minSelections} min`}
                </span>
              </div>
            ))}
          </div>
          <div className="my-5 h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span>
              {isCustom
                ? 'Selected item total per plate'
                : 'Estimated per plate'}
            </span>
            <strong>₹{perPlate.toFixed(2)}</strong>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Final total is verified by the server at checkout.
          </p>
          <Button
            className="mt-6 w-full"
            disabled={!valid}
            onClick={() => router.push('/cart')}
          >
            Review cart <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </aside>
      </div>
      {detailItem && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="surface-card max-h-[92vh] w-full max-w-3xl overflow-hidden bg-white">
            <div className="grid md:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-72 bg-muted">
                {detailItem.item.imageUrl ? (
                  <img
                    src={detailItem.item.imageUrl}
                    alt={detailItem.item.name}
                    className="h-full max-h-[92vh] min-h-72 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full min-h-72 place-items-center bg-gradient-to-br from-primary/10 via-accent/10 to-white text-primary">
                    <Utensils className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="overflow-y-auto p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${detailItem.item.isVeg ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}
                    >
                      <Leaf className="h-3 w-3" />{' '}
                      {detailItem.item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
                    </span>
                    <h2 className="mt-4 font-serif text-3xl font-semibold">
                      {detailItem.item.name}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-primary">
                      {detailItem.categoryName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailItem(undefined)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-white text-muted-foreground hover:text-foreground"
                    aria-label="Close item details"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-6 space-y-5">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Description
                    </h3>
                    <p className="mt-2 leading-7 text-muted-foreground">
                      {detailText(detailItem.item).description}
                    </p>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Ingredients
                    </h3>
                    <p className="mt-2 leading-7 text-muted-foreground">
                      {detailText(detailItem.item).ingredients}
                    </p>
                  </section>
                  <div className="rounded-xl bg-muted/60 p-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        {isCustom ? 'Item price' : 'Package adjustment'}
                      </span>
                      <strong>
                        {isCustom
                          ? `₹${detailItem.item.itemPrice} per plate`
                          : Number(detailItem.item.adjustmentAmount) > 0
                            ? `+₹${detailItem.item.adjustmentAmount} per plate`
                            : 'Included'}
                      </strong>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      selectItem(
                        detailItem.item,
                        detailItem.categoryId,
                        detailItem.categoryName,
                        detailItem.maxSelections,
                      );
                      setDetailItem(undefined);
                    }}
                  >
                    {selectedItems.some(
                      (selectedItem) =>
                        selectedItem.menuItemId === detailItem.item.id,
                    )
                      ? 'Remove from menu'
                      : 'Add to menu'}
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
