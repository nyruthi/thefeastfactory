'use client';
import type { AdminSession } from '@aranyam/shared-types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';
export default function AdminLogin() {
  const router = useRouter(); const setSession = useAdminSessionStore((s) => s.setSession);
  const [email, setEmail] = useState('admin@aranyam.local'); const [password, setPassword] = useState('Admin@12345'); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) { e.preventDefault(); try { const session = await apiRequest<AdminSession>('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setSession(session); router.push('/admin/dashboard'); } catch (e) { setError((e as Error).message); } }
  return <main className="mx-auto max-w-md px-5 py-16"><h1 className="text-3xl font-semibold">Admin login</h1><form onSubmit={submit} className="mt-8 space-y-4"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />{error && <p className="text-red-600">{error}</p>}<Button className="w-full">Sign in</Button></form></main>;
}
