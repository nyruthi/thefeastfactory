'use client';

import type { OperatingRegion } from '@aranyam/shared-types';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../../components/status-badge';
import { Select } from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function OperationsPage() {
  const session = useAdminSessionStore((state) => state.session);
  const [events, setEvents] = useState<any[]>([]);
  const [regions, setRegions] = useState<OperatingRegion[]>([]);
  const [regionId, setRegionId] = useState('');
  const [city, setCity] = useState('');
  const [from, setFrom] = useState(() => dateKey(new Date()));
  const [to, setTo] = useState(() =>
    dateKey(new Date(Date.now() + 30 * 86_400_000)),
  );
  const effectiveRegionId =
    session?.admin.role === 'OPERATIONS'
      ? (session.admin.regionId ?? '')
      : regionId;

  const query = useMemo(() => {
    const params = new URLSearchParams({ from, to });
    if (effectiveRegionId) params.set('regionId', effectiveRegionId);
    if (city) params.set('city', city);
    return params.toString();
  }, [from, to, effectiveRegionId, city]);

  useEffect(() => {
    if (!session) return;
    apiRequest<OperatingRegion[]>(
      '/admin/operating-regions?activeOnly=true',
      {},
      session.accessToken,
    ).then(setRegions);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    apiRequest<any[]>(
      `/admin/operations/calendar?${query}`,
      {},
      session.accessToken,
    ).then(setEvents);
  }, [session, query]);

  if (!session) return <main className="admin-page">Sign in to continue.</main>;

  return (
    <main className="admin-page">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        Delivery tracking
      </p>
      <h1 className="admin-title mt-2">Operations calendar</h1>
      <section className="admin-card mt-7 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <Input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
        <Input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Filter city"
        />
        {session.admin.role === 'ADMIN' ? (
          <Select
            value={regionId}
            onChange={(event) => setRegionId(event.target.value)}
          >
            <option value="">All regions</option>
            {regions.map((region) => (
              <option value={region.id} key={region.id}>
                {region.name}
              </option>
            ))}
          </Select>
        ) : (
          <div className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">
            {session.admin.region?.name ?? 'Region not assigned'}
          </div>
        )}
        <div className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
          {events.length} scheduled
        </div>
      </section>
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {events.map((event) => (
          <article key={event.id} className="admin-card">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {new Date(event.eventDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {event.eventName || 'Catering event'}
                </h2>
              </div>
              {event.orders[0] && (
                <StatusBadge value={event.orders[0].orderStatus} />
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {event.address.addressLine1}, {event.address.city} ·{' '}
              {event.guestCount} guests
            </p>
            <p className="mt-2 text-sm">
              {event.user.name || event.user.mobileNumber}
            </p>
            <div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
              <strong>{event.region?.name ?? 'Unassigned region'}</strong>
              <span className="block text-xs text-muted-foreground">
                {event.distanceKm
                  ? `${event.distanceKm} km · delivery ₹${event.deliveryFee}`
                  : 'Distance pending'}
              </span>
            </div>
            {event.address.latitude && (
              <a
                className="mt-4 inline-block text-sm font-semibold text-primary"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps?q=${event.address.latitude},${event.address.longitude}`}
              >
                Open venue map
              </a>
            )}
            {event.orders[0] && (
              <Link
                className="ml-4 text-sm font-semibold text-primary"
                href={`/admin/orders/${event.orders[0].id}`}
              >
                View order
              </Link>
            )}
          </article>
        ))}
      </div>
      {!events.length && (
        <div className="admin-card mt-7 text-center text-muted-foreground">
          No events match these filters.
        </div>
      )}
    </main>
  );
}
