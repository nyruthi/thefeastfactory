'use client';

import type { CustomerSession } from '@aranyam/shared-types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../../lib/api';
import { useSessionStore } from '../../store/session.store';

export default function OtpPage() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const mobileNumber = sessionStorage.getItem('customerMobile') ?? '';
      const session = await apiRequest<CustomerSession>('/auth/customer/verify-otp', { method: 'POST', body: JSON.stringify({ mobileNumber, otp }) });
      setSession(session);
      router.push('/packages');
    } catch (e) { setError((e as Error).message); }
  }
  return <main className="mx-auto max-w-md px-5 py-16"><h1 className="text-3xl font-semibold">Verify OTP</h1><p className="mt-2 text-muted-foreground">For local development, use the OTP printed by the API.</p><form onSubmit={submit} className="mt-8 space-y-4"><Input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={6} required />{error && <p className="text-sm text-red-600">{error}</p>}<Button className="w-full">Verify and continue</Button></form></main>;
}
