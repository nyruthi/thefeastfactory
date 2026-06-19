'use client';

import { CheckCircle, Clock3, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { apiRequest } from '../../../lib/api';
import { useSessionStore } from '../../../store/session.store';

export default function PaymentStatusPage() {
  const session = useSessionStore((state) => state.session);
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>();
  useEffect(
    () =>
      setOrderId(
        new URLSearchParams(window.location.search).get('orderId') ?? '',
      ),
    [],
  );
  useEffect(() => {
    if (!session || !orderId) return;
    let active = true;
    let attempts = 0;
    const check = async () => {
      const next = await apiRequest<any>(
        `/orders/${orderId}`,
        {},
        session.accessToken,
      );
      if (!active) return;
      setOrder(next);
      attempts += 1;
      if (next.paymentStatus === 'PENDING' && attempts < 10)
        window.setTimeout(check, 2000);
    };
    check();
    return () => {
      active = false;
    };
  }, [session, orderId]);
  const paid = order?.paymentStatus === 'PAID';
  const failed = order?.paymentStatus === 'FAILED';
  const Icon = paid ? CheckCircle : failed ? XCircle : Clock3;
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-5 py-20 text-center">
      <Icon
        className={`h-12 w-12 ${paid ? 'text-primary' : failed ? 'text-red-600' : 'text-amber-600'}`}
      />
      <h1 className="mt-5 text-3xl font-semibold">
        {paid
          ? 'Payment confirmed'
          : failed
            ? 'Payment failed'
            : 'Confirming payment'}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {paid
          ? 'Your order is confirmed.'
          : failed
            ? 'Your order is saved and payment can be retried.'
            : 'We are waiting for secure confirmation from Razorpay. This can take a few moments.'}
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href={`/orders/${orderId}`}>View order</Link>
        </Button>
        {failed && (
          <Button asChild variant="outline">
            <Link href="/checkout">Retry payment</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
