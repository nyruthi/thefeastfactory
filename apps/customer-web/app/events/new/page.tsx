'use client';

import {
  eventTypeOptions,
  servingTimePresets,
  type PackageConfiguration,
  type UserAddress,
} from '@aranyam/shared-types';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { OrderProgress } from '../../../components/order-progress';
import { Button } from '../../../components/ui/button';
import {
  DateField,
  Field,
  Select,
  Textarea,
  TimeField,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import {
  AuthRequiredPanel,
  StatePanel,
} from '../../../components/ui/state-panel';
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
  const packageVersionId =
    searchParams.get('packageVersionId') ?? cartPackage?.packageVersionId ?? '';
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
      apiRequest<PackageConfiguration>(
        `/package-versions/${packageVersionId}/configuration`,
      )
        .then((configuration) => {
          setPackage({
            packageId: configuration.packageId,
            packageVersionId: configuration.id,
            packageName: configuration.packageName,
            isCustom: configuration.isCustom,
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
      customEventName: known ? '' : (cartEvent.eventName ?? ''),
      eventDate: cartEvent.eventDate,
      eventTimeStart: cartEvent.eventTimeStart ?? current.eventTimeStart,
    }));
  }, [cartEvent?.eventId]);

  if (!packageVersionId) {
    return (
      <main className="page-shell">
        <StatePanel
          icon={Users}
          eyebrow="Package required"
          title="Choose a package first"
          description="Your event details are matched to a package so guest limits, courses, and pricing stay accurate."
          actionHref="/packages"
          actionLabel="Browse packages"
          secondaryHref="/menu"
          secondaryLabel="Preview menu"
        />
      </main>
    );
  }

  if (!session) {
    return (
      <AuthRequiredPanel
        title="Sign in to save your event"
        description="Your selected package is waiting. Sign in once, then your venue, cart, and checkout stay connected."
        returnHref={`/events/new?packageVersionId=${packageVersionId}`}
      />
    );
  }

  async function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!cartPackage) return;
    setError('');
    setSubmitting(true);
    try {
      const address = addresses.find((item) => item.id === form.addressId);
      const eventName =
        form.eventType === 'Other'
          ? form.customEventName.trim() || 'Other'
          : form.eventType;
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
    <main className="pb-28">
      {/* ── Header ── */}
      <div className="bg-primary">
        <div className="container-pad py-8">
          <div className="mb-6">
            <OrderProgress current={1} />
          </div>
          <p className="eyebrow text-accent">Event details</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Tell us when and where.
          </h1>
          <p className="mt-2 text-sm text-white/70">
            We use these details to confirm availability and calculate your exact total.
          </p>
        </div>
      </div>

      <div className="container-pad py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── Form ── */}
          <section className="surface-card p-6 sm:p-8">
            {!addresses.length ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-extrabold text-amber-900">An event venue is required</p>
                <p className="mt-1 text-sm text-amber-800">
                  Add a saved address, then return here. Your package will stay in the cart.
                </p>
                <Button asChild variant="outline" className="mt-4 rounded-full">
                  <Link href="/addresses">Add an address</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                <Field label="Event type" className="sm:col-span-2">
                  <Select
                    value={form.eventType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        eventType: event.target.value,
                        customEventName: event.target.value === 'Other' ? form.customEventName : '',
                      })
                    }
                  >
                    {eventTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </Field>
                {form.eventType === 'Other' && (
                  <Field label="Custom event name" optional className="sm:col-span-2">
                    <Input
                      placeholder="e.g. Riya's engagement dinner"
                      value={form.customEventName}
                      onChange={(event) => setForm({ ...form, customEventName: event.target.value })}
                    />
                  </Field>
                )}
                <Field label="Date" hint="Bookings need at least 48 hours of lead time.">
                  <DateField
                    min={minimumDate}
                    value={form.eventDate}
                    onValueChange={(eventDate) => setForm({ ...form, eventDate })}
                    required
                  />
                </Field>
                <Field label="Serving preset" hint="Pick a meal slot or keep a custom time.">
                  <Select
                    value={form.servingPreset}
                    onChange={(event) => {
                      const preset = servingTimePresets.find((item) => item.label === event.target.value);
                      setForm({
                        ...form,
                        servingPreset: event.target.value,
                        eventTimeStart: preset?.time ?? form.eventTimeStart,
                      });
                    }}
                  >
                    <option value="">Custom time</option>
                    {servingTimePresets.map((preset) => (
                      <option key={preset.label} value={preset.label}>
                        {preset.label} · {preset.time}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Exact serving time">
                  <TimeField
                    value={form.eventTimeStart}
                    onValueChange={(eventTimeStart) => setForm({ ...form, eventTimeStart })}
                    required
                  />
                </Field>
                <Field
                  label="Guest count"
                  hint={`Package allows ${cartPackage?.minGuestCount}–${cartPackage?.maxGuestCount ?? 'unlimited'} guests.`}
                >
                  <Input
                    type="number"
                    min={cartPackage?.minGuestCount}
                    max={cartPackage?.maxGuestCount ?? undefined}
                    value={form.guestCount}
                    onChange={(event) => setForm({ ...form, guestCount: Number(event.target.value) })}
                    required
                  />
                </Field>
                <Field label="Venue">
                  <Select
                    value={form.addressId}
                    onChange={(event) => setForm({ ...form, addressId: event.target.value })}
                    required
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label || address.addressLine1}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Notes for our team" optional className="sm:col-span-2">
                  <Textarea
                    placeholder="Access instructions, serving preferences, or anything we should know"
                    value={form.specialNotes}
                    onChange={(event) => setForm({ ...form, specialNotes: event.target.value })}
                  />
                </Field>
                {error && (
                  <p className="sm:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
                    {error}
                  </p>
                )}
                <Button className="sm:col-span-2 rounded-full" disabled={submitting}>
                  {submitting ? 'Saving event…' : 'Continue to menu'}
                </Button>
              </form>
            )}
          </section>

          {/* ── Package sidebar ── */}
          <aside className="surface-card h-fit p-6 lg:sticky lg:top-24">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Your selected package</p>
            <h2 className="mt-3 text-xl font-extrabold">
              {cartPackage?.packageName ?? 'Loading package…'}
            </h2>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2.5">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                At least 48 hours advance booking
              </p>
              <p className="flex items-center gap-2.5">
                <Users className="h-4 w-4 shrink-0 text-primary" />
                {cartPackage?.isCustom
                  ? 'Item-based pricing per guest'
                  : `₹${cartPackage?.basePricePerPlate} per guest`}
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                Choose from your saved venues
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function NewEventPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </main>
      }
    >
      <NewEventContent />
    </Suspense>
  );
}
