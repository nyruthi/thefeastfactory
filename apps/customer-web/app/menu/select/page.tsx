'use client';

import type { PackageConfiguration } from '@aranyam/shared-types';
import { Check, Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { apiRequest } from '../../../lib/api';
import { useOrderBuilderStore } from '../../../store/order-builder.store';

export default function MenuSelectPage() {
  const router = useRouter();
  const versionId = useOrderBuilderStore((s) => s.packageVersionId);
  const selectedItems = useOrderBuilderStore((s) => s.selectedItems);
  const toggleItem = useOrderBuilderStore((s) => s.toggleItem);
  const [config, setConfig] = useState<PackageConfiguration>();
  useEffect(() => { if (versionId) apiRequest<PackageConfiguration>(`/package-versions/${versionId}/configuration`).then(setConfig); }, [versionId]);
  if (!versionId || !config) return <main className="mx-auto max-w-5xl px-5 py-12">Select a package and event first.</main>;
  const valid = config.categoryRules.every((rule) => { const count = selectedItems.filter((i) => i.categoryId === rule.category.id).length; return count >= rule.minSelections && count <= rule.maxSelections; });
  return <main className="mx-auto max-w-6xl px-5 py-12 pb-24"><h1 className="text-3xl font-semibold">Customize {config.packageName}</h1><div className="mt-8 space-y-10">{config.categoryRules.map((rule) => <section key={rule.id}><div className="flex items-end justify-between"><h2 className="text-xl font-semibold">{rule.category.name}</h2><span className="text-sm text-muted-foreground">Select {rule.minSelections}-{rule.maxSelections}</span></div><div className="mt-3 grid gap-3 md:grid-cols-3">{rule.items.map((item) => { const selected = selectedItems.some((s) => s.menuItemId === item.id); return <button key={item.id} onClick={() => toggleItem({ categoryId: rule.category.id, menuItemId: item.id })} className={`flex min-h-24 items-start justify-between rounded-md border bg-white p-4 text-left ${selected ? 'border-primary ring-1 ring-primary' : ''}`}><div><strong>{item.name}</strong><p className="mt-1 text-sm text-muted-foreground">{item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}{Number(item.adjustmentAmount) > 0 ? ` · +₹${item.adjustmentAmount}` : ''}</p></div>{selected ? <Check className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}</button>; })}</div></section>)}</div><div className="sticky bottom-16 mt-10 flex justify-end border-t bg-background py-4 md:bottom-0"><Button disabled={!valid} onClick={() => router.push('/checkout')}>Review checkout</Button></div></main>;
}
