'use client';

import type { PackageConfiguration } from '@aranyam/shared-types';
import { ArrowLeft, CheckCircle2, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OrderProgress } from '../../../components/order-progress';
import { Button } from '../../../components/ui/button';
import { StatePanel } from '../../../components/ui/state-panel';
import { apiRequest } from '../../../lib/api';
import { useOrderBuilderStore } from '../../../store/order-builder.store';

export default function PackagePage() {
  const { packageId } = useParams<{ packageId: string }>();
  const router = useRouter();
  const setPackage = useOrderBuilderStore((state) => state.setPackage);
  const [version, setVersion] = useState<(PackageConfiguration & { packageName: string }) | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<any>(`/packages/${packageId}/active-version`)
      .then(async (activeVersion) => {
        const configuration = await apiRequest<PackageConfiguration>(
          `/package-versions/${activeVersion.id}/configuration`,
        );
        setVersion(configuration);
      })
      .catch((reason) => setError(reason.message));
  }, [packageId]);

  function startOrder() {
    if (!version) return;
    setPackage({
      packageId,
      packageVersionId: version.id,
      packageName: version.packageName,
      isCustom: version.isCustom,
      basePricePerPlate: version.basePricePerPlate,
      minGuestCount: version.minGuestCount,
      maxGuestCount: version.maxGuestCount,
    });
    router.push(`/events/new?packageVersionId=${version.id}`);
  }

  if (error) return <main className="page-shell"><StatePanel tone="danger" title="Package could not load" description={error} actionHref="/packages" actionLabel="Back to packages" /></main>;
  if (!version) return <main className="page-shell"><div className="h-96 animate-pulse rounded-[2rem] bg-white/60" /></main>;

  return (
    <main className="page-shell pb-28">
      <Link href="/packages" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All packages
      </Link>
      <div className="mt-6"><OrderProgress current={0} /></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <p className="eyebrow">{version.isCustom ? 'Build your own menu' : 'Curated for your table'}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">{version.packageName}</h1>
          <p className="mt-4 flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            {version.minGuestCount}–{version.maxGuestCount ?? 'unlimited'} guests
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {version.categoryRules.map((rule) => (
              <article key={rule.id} className="surface-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Course</p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold">{rule.category.name}</h2>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {version.isCustom
                    ? `${rule.items.length} dishes available at actual item pricing`
                    : `Choose ${rule.minSelections === rule.maxSelections ? rule.minSelections : `${rule.minSelections}-${rule.maxSelections}`} from ${rule.items.length} available dishes`}
                </p>
              </article>
            ))}
          </div>
        </section>
        <aside className="surface-card h-fit p-7 lg:sticky lg:top-28">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {version.isCustom ? 'Item-based package' : 'Base package'}
          </p>
          <p className="mt-2 font-serif text-4xl font-semibold">
            {version.isCustom ? 'Custom' : `₹${version.basePricePerPlate}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {version.isCustom ? 'Select dishes at their actual per-plate prices' : 'per guest, before premium additions'}
          </p>
          <div className="my-6 h-px bg-border" />
          <p className="text-sm leading-6 text-muted-foreground">
            {version.isCustom
              ? 'You will choose an event date and venue next, then build a menu from any available dish.'
              : 'You will choose an event date and venue next, then curate each course within the package rules.'}
          </p>
          <Button className="mt-7 w-full" onClick={startOrder}>Choose this package</Button>
        </aside>
      </div>
    </main>
  );
}
