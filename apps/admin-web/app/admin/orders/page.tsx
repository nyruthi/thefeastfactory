'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';
export default function AdminOrders() {
  const session = useAdminSessionStore((s) => s.session); const [orders, setOrders] = useState<any[]>([]); const [status, setStatus] = useState('');
  useEffect(() => { if (session) apiRequest<any[]>(`/admin/orders${status ? `?orderStatus=${status}` : ''}`, {}, session.accessToken).then(setOrders); }, [session, status]);
  return <main className="p-5 md:p-8"><div className="flex items-center justify-between"><h1 className="text-3xl font-semibold">Orders</h1><select className="h-10 rounded-md border bg-white px-3" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{['PENDING_PAYMENT','CONFIRMED','IN_PROGRESS','READY_FOR_DELIVERY','DELIVERED','CANCELLED'].map((s) => <option key={s}>{s}</option>)}</select></div><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Order</th><th>Customer</th><th>Status</th><th>Payment</th><th className="text-right">Amount</th></tr></thead><tbody>{orders.map((o) => <tr key={o.id} className="border-b bg-white"><td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium text-primary">{o.orderNumber}</Link></td><td>{o.user?.mobileNumber}</td><td>{o.orderStatus}</td><td>{o.paymentStatus}</td><td className="text-right">₹{o.totalAmount}</td></tr>)}</tbody></table></div></main>;
}
