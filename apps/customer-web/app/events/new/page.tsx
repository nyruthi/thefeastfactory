'use client';

import type { UserAddress } from '@aranyam/shared-types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { apiRequest } from '../../../lib/api';
import { useOrderBuilderStore } from '../../../store/order-builder.store';
import { useSessionStore } from '../../../store/session.store';

export default function NewEventPage() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const setEventId = useOrderBuilderStore((s) => s.setEventId);
  const setPackageVersion = useOrderBuilderStore((s) => s.setPackageVersion);
  const setGuestCount = useOrderBuilderStore((s) => s.setGuestCount);
  const [packageVersionId, setVersionId] = useState('');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState({ addressId: '', eventName: '', eventDate: '', eventTimeStart: '18:00', guestCount: 10, specialNotes: '' });
  useEffect(() => {
    setVersionId(new URLSearchParams(window.location.search).get('packageVersionId') ?? '');
    if (session) apiRequest<UserAddress[]>('/me/addresses', {}, session.accessToken).then((rows) => { setAddresses(rows); setForm((f) => ({ ...f, addressId: rows[0]?.id ?? '' })); });
  }, [session]);
  if (!session) return <main className="mx-auto max-w-3xl px-5 py-12">Please log in before planning an event.</main>;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const event = await apiRequest<any>('/events', { method: 'POST', body: JSON.stringify({ ...form, packageVersionId, guestCount: Number(form.guestCount) }) }, session!.accessToken);
    setEventId(event.id); setPackageVersion(packageVersionId); setGuestCount(Number(form.guestCount)); router.push('/menu/select');
  }
  return <main className="mx-auto max-w-3xl px-5 py-12"><h1 className="text-3xl font-semibold">Plan your event</h1>{!addresses.length && <p className="mt-4 text-amber-700">Add a saved address before creating an event.</p>}<form onSubmit={submit} className="mt-8 grid gap-4 md:grid-cols-2"><Input placeholder="Event name" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} /><Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required /><Input type="time" value={form.eventTimeStart} onChange={(e) => setForm({ ...form, eventTimeStart: e.target.value })} /><Input type="number" min={10} value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) })} /><select className="h-10 rounded-md border bg-white px-3" value={form.addressId} onChange={(e) => setForm({ ...form, addressId: e.target.value })} required>{addresses.map((a) => <option key={a.id} value={a.id}>{a.label || a.addressLine1}</option>)}</select><Input placeholder="Special notes" value={form.specialNotes} onChange={(e) => setForm({ ...form, specialNotes: e.target.value })} /><Button className="md:col-span-2" disabled={!addresses.length}>Continue to menu</Button></form></main>;
}
