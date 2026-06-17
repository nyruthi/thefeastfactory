'use client';

import type { PackageSummary } from '@aranyam/shared-types';
import { ArrowRight, Check, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatePanel } from '../../components/ui/state-panel';
import { apiRequest } from '../../lib/api';

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<PackageSummary[]>('/packages').then(setPackages).catch((reason) => setError(reason.message));
  }, []);

  return (
    <main className="page-shell pb-28">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="eyebrow">Curated packages</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">A generous starting point for every occasion.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            Each package includes a balanced menu structure. Pick your dishes, see any premium additions,
            and stay in control of the final price.
          </p>
        </div>
        <div className="rounded-full border bg-white/70 px-5 py-3 text-sm text-muted-foreground">
          <Users className="mr-2 inline h-4 w-4 text-primary" /> Built for gatherings from 10 guests
        </div>
      </div>

      {error && <StatePanel className="mt-8" tone="danger" title="Packages could not load" description={error} actionHref="/menu" actionLabel="Browse menu instead" />}
      {!error && !packages.length && (
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-xl bg-white/60" />)}
        </div>
      )}

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((pkg, index) => (
          <Link
            key={pkg.id}
            href={`/packages/${pkg.id}`}
            className="surface-card group flex min-h-[340px] flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-primary/25"
          >
            <div className={`h-2 ${index % 3 === 1 ? 'bg-accent' : index % 3 === 2 ? 'bg-[#9c5940]' : 'bg-primary'}`} />
            <div className="flex flex-1 flex-col p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {pkg.isCustom ? 'Build your own menu' : `Package ${String(index + 1).padStart(2, '0')}`}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold">{pkg.name}</h2>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-white transition group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {pkg.description || 'A thoughtfully balanced catering menu ready to personalize for your event.'}
              </p>
              <div className="mt-6 space-y-2 text-sm">
                {(pkg.isCustom ? ['Any active menu item', 'Actual item pricing'] : ['Flexible course selection', 'Live customization pricing']).map((feature) => (
                  <p key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> {feature}
                  </p>
                ))}
              </div>
              <div className="mt-auto border-t pt-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{'Starting at'}</p>
                <p className="mt-1 font-serif text-3xl font-semibold">
                  {pkg.isCustom ? '₹100' : `₹${pkg.activeVersion?.basePricePerPlate ?? '-'}`}
                  <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">
                    {pkg.isCustom ? 'per plate' : 'per plate'}
                  </span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
