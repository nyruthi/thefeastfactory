'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { useSessionStore } from '../../../store/session.store';

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const session = useSessionStore((s) => s.session);
  const [order, setOrder] = useState<any>();
  useEffect(() => { if (session) apiRequest(`/orders/${orderId}`, {}, session.accessToken).then(setOrder); }, [orderId, session]);
  if (!order) return <main className="mx-auto max-w-4xl px-5 py-12">Loading order...</main>;
  return <main className="mx-auto max-w-4xl px-5 py-12 pb-24"><div className="flex justify-between"><div><h1 className="text-3xl font-semibold">{order.orderNumber}</h1><p className="mt-2 text-muted-foreground">{order.packageName} · {order.guestCount} guests</p></div><strong>{order.orderStatus}</strong></div><div className="mt-8 divide-y rounded-md border bg-white">{order.selectedItems.map((i: any) => <div key={i.id} className="flex justify-between p-4"><span>{i.menuItemName}</span><span>₹{i.adjustmentAmount}</span></div>)}</div><p className="mt-6 text-right text-2xl font-semibold">₹{order.totalAmount}</p></main>;
}
