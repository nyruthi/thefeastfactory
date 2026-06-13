'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../../lib/api';
import { useAdminSessionStore } from '../../../../store/session.store';
export default function AdminPackage() {
  const { packageId } = useParams<{ packageId: string }>(); const session = useAdminSessionStore((s) => s.session); const [pkg, setPkg] = useState<any>();
  useEffect(() => { if (session) apiRequest<any[]>('/admin/packages', {}, session.accessToken).then((rows) => setPkg(rows.find((r) => r.id === packageId))); }, [session, packageId]);
  if (!pkg) return <main className="p-8">Loading package...</main>;
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-semibold">{pkg.name}</h1><p className="mt-2 text-muted-foreground">{pkg.description}</p><div className="mt-6 space-y-3">{pkg.versions.map((v: any) => <Link key={v.id} href={`/admin/package-versions/${v.id}`} className="flex justify-between rounded-md border bg-white p-4"><span>Version {v.versionNo}</span><span>₹{String(v.basePricePerPlate)} / plate</span></Link>)}</div></main>;
}
