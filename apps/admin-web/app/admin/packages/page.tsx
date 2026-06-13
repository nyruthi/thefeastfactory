'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';
export default function AdminPackages() {
  const session = useAdminSessionStore((s) => s.session); const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { if (session) apiRequest<any[]>('/admin/packages', {}, session.accessToken).then(setRows); }, [session]);
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-semibold">Packages</h1><div className="mt-6 grid gap-4 md:grid-cols-3">{rows.map((r) => <Link key={r.id} href={`/admin/packages/${r.id}`} className="rounded-md border bg-white p-5"><h2 className="text-xl font-semibold">{r.name}</h2><p className="mt-2 text-sm text-muted-foreground">{r.versions.length} version(s)</p></Link>)}</div></main>;
}
