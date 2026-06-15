'use client';
import type { CustomerNotification } from '@aranyam/shared-types';
import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { apiRequest } from '../../lib/api';
import { useSessionStore } from '../../store/session.store';

export default function NotificationsPage() {
  const session = useSessionStore((state) => state.session);
  const [rows, setRows] = useState<CustomerNotification[]>([]);
  const load = () => session && apiRequest<CustomerNotification[]>('/me/notifications', {}, session.accessToken).then(setRows);
  useEffect(() => { load(); }, [session]);
  async function markAll() {
    await apiRequest('/me/notifications/read-all', { method: 'POST' }, session!.accessToken);
    await load();
  }
  async function markOne(id: string) {
    await apiRequest(`/me/notifications/${id}/read`, { method: 'POST' }, session!.accessToken);
    await load();
  }
  if (!session) return <main className="mx-auto max-w-3xl px-5 py-14"><h1 className="text-3xl font-semibold">Sign in to view notifications</h1><Link href="/login" className="mt-5 inline-block font-semibold text-primary">Continue to login</Link></main>;
  return <main className="mx-auto max-w-3xl px-5 py-12 pb-24"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Order updates</p><h1 className="mt-2 font-serif text-4xl font-semibold">Notifications</h1></div>{rows.some((row) => !row.readAt) && <Button variant="outline" onClick={markAll}><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button>}</div><div className="mt-7 space-y-3">{rows.map((row) => <article key={row.id} className={`rounded-2xl border p-5 ${row.readAt ? 'bg-white' : 'border-primary/30 bg-primary/5'}`}><div className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Bell className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-semibold">{row.title}</h2><time className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString('en-IN')}</time></div><p className="mt-1 text-sm text-muted-foreground">{row.message}</p><div className="mt-3 flex gap-4">{row.orderId && <Link href={`/orders/${row.orderId}`} className="text-sm font-semibold text-primary">View order</Link>}{!row.readAt && <button className="text-sm font-semibold text-primary" onClick={() => markOne(row.id)}>Mark read</button>}</div></div></div></article>)}{!rows.length && <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">No notifications yet.</div>}</div></main>;
}
