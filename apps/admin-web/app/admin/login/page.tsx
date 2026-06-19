'use client';

import type { AdminSession } from '@aranyam/shared-types';
import { AlertCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';

export default function AdminLogin() {
  const router = useRouter();
  const setSession = useAdminSessionStore((state) => state.setSession);
  const [email, setEmail] = useState('admin@thefeastfactory.local');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const session = await apiRequest<AdminSession>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(session);
      router.push('/admin/dashboard');
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-8 px-5 py-12 lg:grid-cols-[1fr_420px] lg:items-center">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Operations access
        </p>
        <h1 className="mt-3 font-serif text-5xl font-semibold">
          Run catering fulfilment from one dashboard.
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
          Manage orders, payments, package rules, menu availability, and event
          queues with protected staff access.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {['Role-based access', 'Payment ledger', 'Fulfilment queue'].map(
            (item) => (
              <div key={item} className="admin-card">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">{item}</p>
              </div>
            ),
          )}
        </div>
      </section>

      <form onSubmit={submit} className="admin-card p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <h2 className="mt-5 font-serif text-3xl font-semibold">Admin login</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use your staff credentials to continue.
        </p>

        <div className="mt-7 space-y-4">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error && (
            <div
              role="alert"
              className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button className="w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>
    </main>
  );
}
