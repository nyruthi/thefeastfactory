'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useSessionStore } from '../../store/session.store';

export default function OrdersPage() {
  const session = useSessionStore((s) => s.session);
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { if (session) apiRequest<any[]>('/orders', {}, session.accessToken).then(setOrders); }, [session]);
  if (!session) return <main className="mx-auto max-w-5xl px-5 py-12">Please log in to view orders.</main>;
  return <main className="mx-auto max-w-5xl px-5 py-12 pb-24"><h1 className="text-3xl font-semibold">Your orders</h1><div className="mt-8 space-y-3">{orders.map((o) => <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between rounded-md border bg-white p-4"><div><strong>{o.orderNumber}</strong><p className="text-sm text-muted-foreground">{o.packageName} · {o.guestCount} guests</p></div><div className="text-right"><p>{o.orderStatus}</p><strong>₹{o.totalAmount}</strong></div></Link>)}</div></main>;
}
