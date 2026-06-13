'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';
export default function Payments() {
  const session = useAdminSessionStore((s) => s.session); const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { if (session) apiRequest<any[]>('/admin/payments', {}, session.accessToken).then(setRows); }, [session]);
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-semibold">Payments</h1><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Order</th><th>Status</th><th>Gateway</th><th className="text-right">Amount</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className="border-b bg-white"><td className="p-3">{r.order.orderNumber}</td><td>{r.paymentStatus}</td><td>{r.razorpayPaymentId || r.razorpayOrderId}</td><td className="text-right">₹{r.amount}</td></tr>)}</tbody></table></div></main>;
}
