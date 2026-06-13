'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { apiRequest } from '../../../../lib/api';
import { useAdminSessionStore } from '../../../../store/session.store';
export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>(); const session = useAdminSessionStore((s) => s.session); const [order, setOrder] = useState<any>(); const [status, setStatus] = useState('IN_PROGRESS');
  const load = () => session && apiRequest(`/admin/orders/${orderId}`, {}, session.accessToken).then(setOrder); useEffect(() => { load(); }, [session, orderId]);
  async function update() { await apiRequest(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes: 'Updated from admin portal' }) }, session!.accessToken); load(); }
  if (!order) return <main className="p-8">Loading order...</main>;
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-semibold">{order.orderNumber}</h1><p className="mt-2 text-muted-foreground">{order.user.mobileNumber} · {order.packageName} · ₹{order.totalAmount}</p><div className="mt-6 flex gap-3"><select className="h-10 rounded-md border bg-white px-3" value={status} onChange={(e) => setStatus(e.target.value)}>{['IN_PROGRESS','READY_FOR_DELIVERY','DELIVERED','CANCELLED'].map((s) => <option key={s}>{s}</option>)}</select><Button onClick={update}>Update status</Button></div><div className="mt-8 divide-y rounded-md border bg-white">{order.selectedItems.map((i: any) => <div className="flex justify-between p-4" key={i.id}><span>{i.menuItemName}</span><span>₹{i.adjustmentAmount}</span></div>)}</div></main>;
}
