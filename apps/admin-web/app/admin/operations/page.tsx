'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatusBadge } from '../../../components/status-badge';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';

export default function OperationsPage() {
  const session = useAdminSessionStore((state) => state.session);
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    if (!session) return;
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    apiRequest<any[]>(`/admin/operations/calendar?from=${from}&to=${to}`, {}, session.accessToken).then(setEvents);
  }, [session]);
  return <main className="admin-page"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">30-day schedule</p><h1 className="admin-title mt-2">Operations calendar</h1><div className="mt-7 grid gap-4 lg:grid-cols-2">{events.map((event) => <article key={event.id} className="admin-card"><div className="flex justify-between gap-4"><div><p className="text-sm font-semibold text-primary">{new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p><h2 className="mt-1 text-xl font-semibold">{event.eventName || 'Catering event'}</h2></div>{event.orders[0] && <StatusBadge value={event.orders[0].orderStatus} />}</div><p className="mt-3 text-sm text-muted-foreground">{event.address.addressLine1}, {event.address.city} · {event.guestCount} guests</p><p className="mt-2 text-sm">{event.user.name || event.user.mobileNumber}</p>{event.address.latitude && <a className="mt-4 inline-block text-sm font-semibold text-primary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${event.address.latitude},${event.address.longitude}`}>Open venue map</a>}{event.orders[0] && <Link className="ml-4 text-sm font-semibold text-primary" href={`/admin/orders/${event.orders[0].id}`}>View order</Link>}</article>)}</div>{!events.length && <div className="admin-card mt-7 text-center text-muted-foreground">No events scheduled in the next 30 days.</div>}</main>;
}
