'use client';

import type { AddressType, UserAddress } from '@aranyam/shared-types';
import { createAddressSchema } from '@aranyam/validation';
import { CheckCircle2, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AddressMapPicker } from '../../components/address-map-picker';
import { apiRequest } from '../../lib/api';
import { useSessionStore } from '../../store/session.store';

const initialForm = {
  addressType: 'HOME' as AddressType,
  label: 'Home',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
  latitude: '',
  longitude: '',
  isDefault: false,
};

export default function AddressesPage() {
  const session = useSessionStore((state) => state.session);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!session) return;
    setLoading(true);
    try {
      setAddresses(await apiRequest<UserAddress[]>('/me/addresses', {}, session.accessToken));
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [session]);

  if (!session) {
    return (
      <main className="page-shell">
        <div className="surface-card mx-auto max-w-xl p-8 text-center">
          <h1 className="font-serif text-3xl font-semibold">Sign in to manage venues</h1>
          <p className="mt-3 text-muted-foreground">Saved addresses make event planning quicker.</p>
          <Button asChild className="mt-6"><Link href="/login">Continue with mobile</Link></Button>
        </div>
      </main>
    );
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const result = createAddressSchema.safeParse({
      ...form,
      label: form.label.trim() || undefined,
      addressLine2: form.addressLine2.trim() || undefined,
      landmark: form.landmark.trim() || undefined,
      latitude: form.latitude || undefined,
      longitude: form.longitude || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check the address details.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(
        '/me/addresses',
        { method: 'POST', body: JSON.stringify(result.data) },
        session!.accessToken,
      );
      setForm({ ...initialForm, isDefault: false });
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell pb-28">
      <div className="max-w-2xl">
        <p className="eyebrow">Your venues</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold">Saved addresses</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Keep home, office, and event locations ready for faster planning.
        </p>
      </div>

      <section className="surface-card mt-8 p-5 sm:p-7">
        <div className="mb-5">
          <p className="eyebrow">Choose on map</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Find the exact location</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Search for a venue, click anywhere, drag the pin, or use your current location. You can review and edit the detected address before saving.
          </p>
        </div>
        <AddressMapPicker
          onAddress={(address) => {
            setError('');
            setForm((current) => ({ ...current, ...address }));
          }}
        />
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
        <form onSubmit={add} className="surface-card h-fit p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </span>
            <h2 className="font-serif text-2xl font-semibold">Add an address</h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <label>
              <span className="mb-2 block text-sm font-semibold">Address type</span>
              <select
                className="h-12 w-full rounded-lg border bg-white/90 px-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                value={form.addressType}
                onChange={(event) => setForm({ ...form, addressType: event.target.value as AddressType })}
              >
                <option value="HOME">Home</option>
                <option value="OFFICE">Office</option>
                <option value="EVENT_VENUE">Event venue</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Label</span>
              <Input
                placeholder="e.g. Home or Garden venue"
                maxLength={50}
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
              />
            </label>
            <label className="sm:col-span-2 lg:col-span-1">
              <span className="mb-2 block text-sm font-semibold">Address line 1</span>
              <Input
                placeholder="House, flat, building, or street"
                maxLength={255}
                value={form.addressLine1}
                onChange={(event) => setForm({ ...form, addressLine1: event.target.value })}
                required
              />
            </label>
            <label className="sm:col-span-2 lg:col-span-1">
              <span className="mb-2 block text-sm font-semibold">Address line 2 <span className="font-normal text-muted-foreground">(optional)</span></span>
              <Input
                placeholder="Area or locality"
                maxLength={255}
                value={form.addressLine2}
                onChange={(event) => setForm({ ...form, addressLine2: event.target.value })}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">City</span>
              <Input
                placeholder="City"
                maxLength={100}
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">State</span>
              <Input
                placeholder="State"
                maxLength={100}
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Pincode</span>
              <Input
                placeholder="6-digit pincode"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                value={form.pincode}
                onChange={(event) => setForm({ ...form, pincode: event.target.value.replace(/\D/g, '') })}
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Landmark <span className="font-normal text-muted-foreground">(optional)</span></span>
              <Input
                placeholder="Nearby landmark"
                maxLength={255}
                value={form.landmark}
                onChange={(event) => setForm({ ...form, landmark: event.target.value })}
              />
            </label>
          </div>

          <label className="mt-5 flex items-center gap-3 rounded-lg border bg-white/60 p-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={form.isDefault}
              onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
            />
            Make this my default address
          </label>

          {form.latitude && form.longitude && (
            <p className="mt-3 text-xs text-muted-foreground">
              Map pin: {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
            </p>
          )}

          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button className="mt-5 w-full" disabled={submitting}>
            {submitting ? 'Saving address…' : 'Save address'}
          </Button>
        </form>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold">Your saved places</h2>
            <span className="text-sm text-muted-foreground">{addresses.length} saved</span>
          </div>

          {loading ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-white/60" />)}
            </div>
          ) : addresses.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <article key={address.id} className="surface-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </span>
                    {address.isDefault && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Default
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 font-serif text-2xl font-semibold">{address.label || address.addressType}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                    <br />
                    {address.city}, {address.state} {address.pincode}
                  </p>
                  {address.landmark && <p className="mt-2 text-xs text-muted-foreground">Near {address.landmark}</p>}
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-card mt-5 p-8 text-center">
              <MapPin className="mx-auto h-7 w-7 text-primary" />
              <p className="mt-4 font-semibold">No saved addresses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Your first address becomes the default automatically.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
