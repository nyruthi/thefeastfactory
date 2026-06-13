'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { apiRequest } from '../../../lib/api';

export default function PackagePage() {
  const { packageId } = useParams<{ packageId: string }>();
  const [version, setVersion] = useState<any>();
  useEffect(() => { apiRequest(`/packages/${packageId}/active-version`).then(setVersion); }, [packageId]);
  if (!version) return <main className="mx-auto max-w-4xl px-5 py-12">Loading package...</main>;
  return <main className="mx-auto max-w-4xl px-5 py-12"><h1 className="text-4xl font-semibold">{version.packageName}</h1><p className="mt-4 text-2xl">₹{version.basePricePerPlate} per plate</p><p className="mt-2 text-muted-foreground">{version.minGuestCount}-{version.maxGuestCount ?? 'unlimited'} guests</p><Button asChild className="mt-8"><Link href={`/events/new?packageVersionId=${version.id}`}>Plan event</Link></Button></main>;
}
