'use client';

import type { PackageSummary } from '@aranyam/shared-types';
import { ArrowRight, Briefcase, Home, Landmark, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { apiRequest } from '../../lib/api';
import { cn } from '../../lib/utils';

const PKG_META = [
  { Icon: Home, gradient: 'from-emerald-800 to-emerald-600' },
  { Icon: Landmark, gradient: 'from-orange-700 to-amber-500' },
  { Icon: Users, gradient: 'from-blue-800 to-blue-600' },
  { Icon: Briefcase, gradient: 'from-slate-700 to-slate-500' },
];

interface PackageCardProps {
  pkg: PackageSummary;
  index: number;
}

function PackageCard({ pkg, index }: PackageCardProps) {
  const meta = PKG_META[index % PKG_META.length];

  return (
    <Link
      href={`/packages/${pkg.id}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Gradient image area */}
      <div className={cn('relative aspect-[4/3] bg-gradient-to-br', meta.gradient)}>
        {index === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            Most Popular
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <meta.Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-bold leading-snug text-foreground">{pkg.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Serves {pkg.isCustom ? '10' : '20'}–{pkg.isCustom ? '1,000' : '500'} people
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="flex items-baseline gap-1">
            <span className="font-serif text-xl font-bold text-primary">
              ₹{pkg.isCustom ? '99' : (pkg.activeVersion?.basePricePerPlate ?? '—')}
            </span>
            <span className="text-xs text-muted-foreground">/ person</span>
          </p>
          <span className="flex items-center gap-1 text-xs font-bold text-primary transition-all group-hover:gap-1.5">
            View details <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function OccasionPackagesSection() {
  const [packages, setPackages] = useState<PackageSummary[]>([]);

  useEffect(() => {
    apiRequest<PackageSummary[]>('/packages')
      .then((pkgs) => setPackages(pkgs.slice(0, 4)))
      .catch(() => undefined);
  }, []);

  if (!packages.length) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      {/* Section header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Popular Occasion Packages
        </h2>
        <Link
          href="/packages"
          className="hidden items-center gap-1.5 text-sm font-bold text-primary hover:underline sm:flex"
        >
          View all packages <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 4-column grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg, i) => (
          <PackageCard key={pkg.id} pkg={pkg} index={i} />
        ))}
      </div>

      {/* Mobile: "View all" button */}
      <div className="mt-6 text-center sm:hidden">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/packages">View all packages</Link>
        </Button>
      </div>
    </section>
  );
}
