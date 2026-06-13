'use client';

import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../../lib/api';
import { useSessionStore } from '../../store/session.store';

export default function ProfilePage() {
  const session = useSessionStore((s) => s.session);
  const clear = useSessionStore((s) => s.clear);
  const [profile, setProfile] = useState({ name: '', email: '', mobileNumber: '' });
  const [message, setMessage] = useState('');
  useEffect(() => { if (session) apiRequest<any>('/me', {}, session.accessToken).then((p) => setProfile({ name: p.name ?? '', email: p.email ?? '', mobileNumber: p.mobileNumber })); }, [session]);
  if (!session) return <main className="mx-auto max-w-3xl px-5 py-12">Please log in to manage your profile.</main>;
  async function save(e: React.FormEvent) { e.preventDefault(); await apiRequest('/me', { method: 'PATCH', body: JSON.stringify({ name: profile.name, email: profile.email }) }, session!.accessToken); setMessage('Profile updated'); }
  return <main className="mx-auto max-w-3xl px-5 py-12"><h1 className="text-3xl font-semibold">Profile</h1><form onSubmit={save} className="mt-8 max-w-lg space-y-4"><Input value={profile.mobileNumber} disabled /><Input placeholder="Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /><Input placeholder="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />{message && <p className="text-sm text-primary">{message}</p>}<div className="flex gap-3"><Button>Save</Button><Button type="button" variant="outline" onClick={clear}>Log out</Button></div></form></main>;
}
