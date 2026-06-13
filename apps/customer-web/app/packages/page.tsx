'use client';

import type { PackageSummary } from '@aranyam/shared-types';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  useEffect(() => { apiRequest<PackageSummary[]>('/packages').then(setPackages); }, []);
  return <main className="mx-auto max-w-6xl px-5 py-12 pb-24"><h1 className="text-3xl font-semibold">Catering packages</h1><p className="mt-2 text-muted-foreground">Choose a base package, then customize dishes within its rules.</p><div className="mt-8 grid gap-4 md:grid-cols-3">{packages.map((pkg) => <Link key={pkg.id} href={`/packages/${pkg.id}`} className="rounded-md border bg-white p-5 shadow-sm hover:border-primary"><h2 className="text-xl font-semibold">{pkg.name}</h2><p className="mt-2 text-sm text-muted-foreground">{pkg.description}</p><p className="mt-6 text-2xl font-semibold">₹{pkg.activeVersion?.basePricePerPlate}<span className="text-sm font-normal text-muted-foreground"> / plate</span></p></Link>)}</div></main>;
}
