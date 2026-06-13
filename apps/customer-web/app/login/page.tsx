'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState('9999999999');
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiRequest('/auth/customer/request-otp', { method: 'POST', body: JSON.stringify({ mobileNumber }) });
      sessionStorage.setItem('customerMobile', mobileNumber);
      router.push('/otp');
    } catch (e) { setError((e as Error).message); }
  }
  return <main className="mx-auto max-w-md px-5 py-16"><h1 className="text-3xl font-semibold">Customer login</h1><p className="mt-2 text-muted-foreground">Enter your mobile number to receive an OTP.</p><form onSubmit={submit} className="mt-8 space-y-4"><Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} inputMode="numeric" maxLength={10} required />{error && <p className="text-sm text-red-600">{error}</p>}<Button className="w-full">Send OTP</Button></form></main>;
}
