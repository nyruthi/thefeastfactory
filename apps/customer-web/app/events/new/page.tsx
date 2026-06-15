'use client';

import {
  eventTypeOptions,
  servingTimePresets,
  type PackageConfiguration,
  type UserAddress,
} from '@aranyam/shared-types';
import { CalendarDays, LogIn, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { OrderProgress } from '../../../components/order-progress';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { apiRequest } from '../../../lib/api';
import { useOrderBuilderStore } from '../../../store/order-builder.store';
import { useSessionStore } from '../../../store/session.store';

function NewEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSessionStore((state) => state.session);
  const cartPackage = useOrderBuilderStore((state) => state.package);
  const cartEvent = useOrderBuilderStore((state) => state.event);
  const setPackage = useOrderBuilderStore((state) => state.setPackage);
  const setEvent = useOrderBuilderStore((state) => state.setEvent);
  const setGuestCount = useOrderBuilderStore((state) => state.setGuestCount);
  const packageVersionId = searchParams.get('packageVersionId') ?? cartPackage?.packageVersionId ?? '';
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    addressId: '',
    eventType: 'Birthday',
    customEventName: '',
    eventDate: '',
    eventTimeStart: '18:00',
    servingPreset: '',
    guestCount: cartPackage?.minGuestCount ?? 10,
    specialNotes: '',
  });

  const minimumDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (packageVersionId && cartPackage?.packageVersionId !== packageVersionId) {
      apiRequest<PackageConfiguration>(`/package-versions/${packageVersionId}/configuration`)
        .then((configuration) => {
          setPackage({
            packageId: configuration.packageId,
            packageVersionId: configuration.id,
            packageName: configuration.packageName,
            basePricePerPlate: configuration.basePricePerPlate,
            minGuestCount: configuration.minGuestCount,
            maxGuestCount: configuration.maxGuestCount,
          });
          setForm((current) => ({ ...current, guestCount: configuration.minGuestCount }));
        })
        .catch((reason) => setError(reason.message));
    }
  }, [cartPackage?.packageVersionId, packageVersionId, setPackage]);

  useEffect(() => {
    if (!session) return;
    apiRequest<UserAddress[]>('/me/addresses', {}, session.accessToken)
      .then((rows) => {
        setAddresses(rows);
        const preferred = rows.find((row) => row.isDefault) ?? rows[0];
        setForm((current) => ({ ...current, addressId: preferred?.id ?? '' }));
      })
      .catch((reason) => setError(reason.message));
  }, [session]);

  useEffect(() => {
    if (!cartEvent?.eventName) return;
    const known = eventTypeOptions.find((option) => option === cartEvent.eventName);
    setForm((current) => ({
      ...current,
      eventType: known ?? 'Other',
      customEventName: known ? '' : cartEvent.eventName ?? '',
      eventDate: cartEvent.eventDate,
      eventTimeStart: cartEvent.eventTimeStart ?? current.eventTimeStart,
    }));
  }, [cartEvent?.eventId]);

  if (!packageVersionId) {
    return (
      <main className="page-shell">
        <div className="surface-card mx-auto max-w-xl p-8 text-center">
          <h1 className="font-serif text-3xl font-semibold">Choose a package first</h1>
          <p className="mt-3 text-muted-foreground">Your event details are matched to a package and its guest limits.</p>
          <Button asChild className="mt-6"><Link href="/packages">Browse packages</Link></Button>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page-shell">
        <div className="surface-card mx-auto max-w-xl p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><LogIn /></span>
          <h1 className="mt-5 font-serif text-3xl font-semibold">Sign in to save your event</h1>
          <p className="mt-3 text-muted-foreground">Your selected package is waiting in the cart.</p>
          <Button asChild className="mt-6"><Link href="/login">Continue with mobile</Link></Button>
        </div>
      </main>
    );
  }

  async function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!cartPackage) return;
    setError('');
    setSubmitting(true);
    try {
      const address = addresses.find((item) => item.id === form.addressId);
      const eventName = form.eventType === 'Other' ? form.customEventName.trim() : form.eventType;
      const created = await apiRequest<any>(
        cartEvent ? `/events/${cartEvent.eventId}` : '/events',
        {
          method: cartEvent ? 'PATCH' : 'POST',
          body: JSON.stringify({
            addressId: form.addressId,
            eventName,
            eventDate: form.eventDate,
            eventTimeStart: form.eventTimeStart,
            guestCount: Number(form.guestCount),
            specialNotes: form.specialNotes,
            packageVersionId,
          }),
        },
        session!.accessToken,
      );
      setEvent({
        eventId: created.id,
        eventName,
        eventDate: form.eventDate,
        eventTimeStart: form.eventTimeStart,
        addressLabel: address?.label || address?.addressLine1 || 'Event venue',
      });
      setGuestCount(Number(form.guestCount));
      router.push('/menu/select');
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell pb-28">
      <OrderProgress current={1} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow">Your occasion</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold">Tell us when and where.</h1>
          <p className="mt-3 text-muted-foreground">We use these details to confirm availability and calculate your exact total.</p>

          {!addresses.length ? (
            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">An event venue is required</p>
              <p className="mt-1 text-sm text-amber-800">Add a saved address, then return here. Your package will stay in the cart.</p>
              <Button asChild variant="outline" className="mt-4"><Link href="/addresses">Add an address</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Event type</span>
                <select className="h-12 w-full rounded-lg border bg-white/90 px-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15" value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value, customEventName: event.target.value === 'Other' ? form.customEventName : '' })}>
                  {eventTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              {form.eventType === 'Other' && (
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold">Custom event name</span>
                  <Input placeholder="e.g. Riya's engagement dinner" value={form.customEventName} onChange={(event) => setForm({ ...form, customEventName: event.target.value })} required />
                </label>
              )}
              <label>
                <span className="mb-2 block text-sm font-semibold">Date</span>
                <Input type="date" min={minimumDate} value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} required />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Serving preset</span>
                <select className="h-12 w-full rounded-lg border bg-white/90 px-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15" value={form.servingPreset} onChange={(event) => { const preset = servingTimePresets.find((item) => item.label === event.target.value); setForm({ ...form, servingPreset: event.target.value, eventTimeStart: preset?.time ?? form.eventTimeStart }); }}>
                  <option value="">Custom time</option>
                  {servingTimePresets.map((preset) => <option key={preset.label} value={preset.label}>{preset.label} · {preset.time}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Exact serving time</span>
                <Input type="time" value={form.eventTimeStart} onChange={(event) => setForm({ ...form, eventTimeStart: event.target.value })} required />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Guest count</span>
                <Input type="number" min={cartPackage?.minGuestCount} max={cartPackage?.maxGuestCount ?? undefined} value={form.guestCount} onChange={(event) => setForm({ ...form, guestCount: Number(event.target.value) })} required />
                <span className="mt-1 block text-xs text-muted-foreground">Package allows {cartPackage?.minGuestCount}–{cartPackage?.maxGuestCount ?? 'unlimited'} guests</span>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Venue</span>
                <select className="h-12 w-full rounded-lg border bg-white/90 px-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15" value={form.addressId} onChange={(event) => setForm({ ...form, addressId: event.target.value })} required>
                  {addresses.map((address) => <option key={address.id} value={address.id}>{address.label || address.addressLine1}</option>)}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Notes for our team</span>
                <textarea className="min-h-28 w-full rounded-lg border bg-white/90 px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15" placeholder="Access instructions, serving preferences, or anything we should know" value={form.specialNotes} onChange={(event) => setForm({ ...form, specialNotes: event.target.value })} />
              </label>
              {error && <p className="sm:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <Button className="sm:col-span-2" disabled={submitting}>{submitting ? 'Saving event…' : 'Continue to menu'}</Button>
            </form>
          )}
        </section>

        <aside className="surface-card h-fit p-6 lg:sticky lg:top-28">
          <p className="eyebrow">In your cart</p>
          <h2 className="mt-3 font-serif text-2xl font-semibold">{cartPackage?.packageName ?? 'Loading package…'}</h2>
          <div className="mt-6 space-y-4 text-sm">
            <p className="flex gap-3"><CalendarDays className="h-4 w-4 text-primary" /> At least 48 hours advance booking</p>
            <p className="flex gap-3"><Users className="h-4 w-4 text-primary" /> ₹{cartPackage?.basePricePerPlate} per guest</p>
            <p className="flex gap-3"><MapPin className="h-4 w-4 text-primary" /> Choose from your saved venues</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={<main className="page-shell"><div className="h-96 animate-pulse rounded-[2rem] bg-white/60" /></main>}>
      <NewEventContent />
    </Suspense>
  );
}
