'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../../lib/api';
export default function PackageVersion() {
  const { versionId } = useParams<{ versionId: string }>(); const [config, setConfig] = useState<any>();
  useEffect(() => { apiRequest(`/package-versions/${versionId}/configuration`).then(setConfig); }, [versionId]);
  if (!config) return <main className="p-8">Loading configuration...</main>;
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-semibold">{config.packageName} v{config.versionNo}</h1><p className="mt-2 text-muted-foreground">₹{config.basePricePerPlate} per plate</p><div className="mt-8 space-y-6">{config.categoryRules.map((r: any) => <section key={r.id}><h2 className="font-semibold">{r.category.name} · {r.minSelections}-{r.maxSelections}</h2><div className="mt-2 grid gap-2 md:grid-cols-3">{r.items.map((i: any) => <div key={i.id} className="rounded-md border bg-white p-3"><strong>{i.name}</strong><p className="text-sm text-muted-foreground">₹{i.itemPrice} · +₹{i.adjustmentAmount}</p></div>)}</div></section>)}</div></main>;
}
