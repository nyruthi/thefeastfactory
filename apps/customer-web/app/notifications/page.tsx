'use client';

import type { CustomerNotification } from '@aranyam/shared-types';
import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { AuthRequiredPanel, StatePanel } from '../../components/ui/state-panel';
import { apiRequest } from '../../lib/api';
import { useSessionStore } from '../../store/session.store';

export default function NotificationsPage() {
  const session = useSessionStore((state) => state.session);
  const [rows, setRows] = useState<CustomerNotification[]>([]);
  const load = () => session && apiRequest<CustomerNotification[]>('/me/notifications', {}, session.accessToken).then(setRows);

  useEffect(() => {
    load();
  }, [session]);

  async function markAll() {
    await apiRequest('/me/notifications/read-all', { method: 'POST' }, session!.accessToken);
    await load();
  }

  async function markOne(id: string) {
    await apiRequest(`/me/notifications/${id}/read`, { method: 'POST' }, session!.accessToken);
    await load();
  }

  if (!session) {
    return (
      <AuthRequiredPanel
        title="Sign in to view notifications"
        description="Order confirmations, payment updates, and delivery progress are tied to your verified account."
        returnHref="/notifications"
      />
    );
  }

  return (
    <main className="page-shell max-w-4xl pb-28">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Order updates</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">Notifications</h1>
        </div>
        {rows.some((row) => !row.readAt) && (
          <Button variant="outline" onClick={markAll}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {rows.length ? (
        <div className="mt-7 space-y-3">
          {rows.map((row) => (
            <article
              key={row.id}
              className={`rounded-xl border p-5 shadow-[0_12px_35px_-28px_rgba(111,29,45,0.5)] ${
                row.readAt ? 'bg-white/85' : 'border-primary/30 bg-primary/[0.055]'
              }`}
            >
              <div className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-semibold">{row.title}</h2>
                    <time className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString('en-IN')}</time>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{row.message}</p>
                  <div className="mt-3 flex gap-4">
                    {row.orderId && <Link href={`/orders/${row.orderId}`} className="text-sm font-semibold text-primary">View order</Link>}
                    {!row.readAt && <button className="text-sm font-semibold text-primary" onClick={() => markOne(row.id)}>Mark read</button>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <StatePanel
          className="mt-8"
          icon={Bell}
          eyebrow="Quiet for now"
          title="No notifications yet"
          description="Order updates and payment confirmations will appear here after checkout."
          actionHref="/packages"
          actionLabel="Start an order"
        />
      )}
    </main>
  );
}
