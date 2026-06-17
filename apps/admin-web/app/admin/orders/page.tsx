'use client';

import { orderStatusOptions, paymentStatusOptions } from '@aranyam/shared-types';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../../components/status-badge';
import { Select } from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';

const pageSize = 20;

export default function AdminOrders() {
  const session = useAdminSessionStore((state) => state.session);
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [mobile, setMobile] = useState('');
  const [page, setPage] = useState(1);
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set('orderStatus', status);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (mobile) params.set('mobileNumber', mobile);
    return params.toString();
  }, [status, paymentStatus, mobile]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => {
      apiRequest<any[]>(`/admin/orders${query ? `?${query}` : ''}`, {}, session.accessToken).then(setOrders);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [session, query]);

  useEffect(() => setPage(1), [query]);

  const visibleOrders = orders.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));

  return (
    <main className="admin-page">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Fulfilment</p>
      <h1 className="admin-title mt-2">Orders</h1>
      <div className="admin-card mt-7 grid gap-3 md:grid-cols-3">
        <Input value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="Search customer mobile" />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All order statuses</option>
          {orderStatusOptions.map((value) => <option key={value}>{value}</option>)}
        </Select>
        <Select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
          <option value="">All payment statuses</option>
          {paymentStatusOptions.map((value) => <option key={value}>{value}</option>)}
        </Select>
      </div>

      <div className="admin-card mt-5 overflow-x-auto p-0">
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Event</th><th>Customer</th><th>Status</th><th>Payment</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary">{order.orderNumber}</Link></td>
                <td>{order.event?.eventName || order.packageName}<span className="block text-xs text-muted-foreground">{order.event?.eventDate ? new Date(order.event.eventDate).toLocaleDateString('en-IN') : ''}</span></td>
                <td>{order.user?.name || order.user?.mobileNumber}<span className="block text-xs text-muted-foreground">{order.user?.mobileNumber}</span></td>
                <td><StatusBadge value={order.orderStatus} /></td>
                <td><StatusBadge value={order.paymentStatus} /></td>
                <td className="text-right font-semibold">₹{order.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="p-10 text-center text-muted-foreground">No orders match these filters.</p>}
      </div>
      {orders.length > pageSize && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <button className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span>
          <button className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      )}
    </main>
  );
}
