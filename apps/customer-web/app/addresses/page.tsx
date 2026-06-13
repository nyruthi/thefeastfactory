'use client';

import type { UserAddress } from '@aranyam/shared-types';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../../lib/api';
import { useSessionStore } from '../../store/session.store';

export default function AddressesPage() {
  const session = useSessionStore((s) => s.session);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState({ label: 'Home', addressLine1: '', city: '', state: '', pincode: '' });
  const load = () => session && apiRequest<UserAddress[]>('/me/addresses', {}, session.accessToken).then(setAddresses);
  useEffect(() => { load(); }, [session]);
  if (!session) return <main className="mx-auto max-w-5xl px-5 py-12">Please log in to manage addresses.</main>;
  async function add(e: React.FormEvent) { e.preventDefault(); await apiRequest('/me/addresses', { method: 'POST', body: JSON.stringify({ ...form, addressType: 'HOME' }) }, session!.accessToken); setForm({ ...form, addressLine1: '' }); load(); }
  return <main className="mx-auto max-w-5xl px-5 py-12 pb-24"><h1 className="text-3xl font-semibold">Saved addresses</h1><div className="mt-8 grid gap-8 md:grid-cols-2"><form onSubmit={add} className="space-y-3"><h2 className="font-semibold">Add address</h2>{Object.entries(form).map(([key, value]) => <Input key={key} placeholder={key.replace(/([A-Z])/g, ' $1')} value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />)}<Button>Add address</Button></form><div className="space-y-3">{addresses.map((a) => <article key={a.id} className="rounded-md border bg-white p-4"><div className="flex justify-between"><strong>{a.label || a.addressType}</strong>{a.isDefault && <span className="text-xs text-primary">Default</span>}</div><p className="mt-2 text-sm text-muted-foreground">{a.addressLine1}, {a.city}, {a.state} {a.pincode}</p></article>)}</div></div></main>;
}
