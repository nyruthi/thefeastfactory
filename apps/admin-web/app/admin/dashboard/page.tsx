'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';
export default function Dashboard() {
  const session = useAdminSessionStore((s) => s.session); const [revenue, setRevenue] = useState<any>(); const [orders, setOrders] = useState<any>();
  useEffect(() => { if (session) Promise.all([apiRequest('/admin/reports/revenue', {}, session.accessToken), apiRequest('/admin/reports/orders', {}, session.accessToken)]).then(([r, o]) => { setRevenue(r); setOrders(o); }); }, [session]);
  if (!session) return <main className="p-8">Sign in at /admin/login.</main>;
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-semibold">Dashboard</h1><div className="mt-6 grid gap-4 md:grid-cols-3"><Metric label="Gross revenue" value={`₹${revenue?.grossRevenue ?? '0.00'}`} /><Metric label="Net revenue" value={`₹${revenue?.netRevenue ?? '0.00'}`} /><Metric label="Total orders" value={orders?.total ?? 0} /></div><section className="mt-8"><h2 className="text-xl font-semibold">Order status</h2><div className="mt-3 grid gap-3 md:grid-cols-4">{orders?.byStatus?.map((r: any) => <Metric key={r.orderStatus} label={r.orderStatus} value={r._count} />)}</div></section></main>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-md border bg-white p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
