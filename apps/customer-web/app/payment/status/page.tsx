'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';

export default function PaymentStatusPage() {
  const [orderId, setOrderId] = useState('');
  useEffect(() => setOrderId(new URLSearchParams(window.location.search).get('orderId') ?? ''), []);
  return <main className="mx-auto flex max-w-xl flex-col items-center px-5 py-20 text-center"><CheckCircle className="h-12 w-12 text-primary" /><h1 className="mt-5 text-3xl font-semibold">Payment confirmed</h1><p className="mt-2 text-muted-foreground">Order {orderId} is confirmed.</p><Button asChild className="mt-8"><Link href={`/orders/${orderId}`}>View order</Link></Button></main>;
}
