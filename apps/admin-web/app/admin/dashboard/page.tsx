'use client';
import { AlertTriangle, CalendarDays, CreditCard, IndianRupee, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';
import { StatusBadge } from '../../../components/status-badge';

export default function Dashboard() {
  const session = useAdminSessionStore((state) => state.session);
  const [data, setData] = useState<any>();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiRequest('/admin/reports/revenue', {}, session.accessToken),
      apiRequest('/admin/reports/orders', {}, session.accessToken),
      apiRequest('/admin/reports/payments', {}, session.accessToken),
      apiRequest('/admin/operations/queue', {}, session.accessToken),
    ])
      .then(([revenue, orders, payments, queue]) => setData({ revenue, orders, payments, queue }))
      .catch((reason) => setError((reason as Error).message));
  }, [session]);
  if (!session) return <main className="admin-page">Sign in to continue.</main>;
  if (error) return <main className="admin-page text-red-700">{error}</main>;
  if (!data) return <main className="admin-page">Loading operations overview...</main>;
  return (
    <main className="admin-page">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Today&apos;s command center</p>
        <h1 className="admin-title mt-2">Operations dashboard</h1>
        <p className="mt-2 text-muted-foreground">Revenue, upcoming events, payment health, and action queues in one view.</p>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={IndianRupee} label="Net revenue" value={`₹${data.revenue.netRevenue ?? '0.00'}`} />
        <Metric icon={ShoppingBag} label="Total orders" value={data.orders.total ?? 0} />
        <Metric icon={CreditCard} label="Payments" value={data.payments.total ?? 0} />
        <Metric icon={AlertTriangle} label="Pending refunds" value={data.queue.pendingRefunds.length} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section className="admin-card">
          <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Upcoming events</h2><CalendarDays className="h-5 w-5 text-primary" /></div>
          <div className="mt-4 space-y-3">
            {data.queue.upcomingEvents.slice(0, 7).map((event: any) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/55 p-4">
                <div><p className="font-semibold">{event.eventName || 'Catering event'}</p><p className="text-sm text-muted-foreground">{new Date(event.eventDate).toLocaleDateString('en-IN')} · {event.address.city} · {event.guestCount} guests</p></div>
                {event.orders[0] && <StatusBadge value={event.orders[0].orderStatus} />}
              </div>
            ))}
            {!data.queue.upcomingEvents.length && <p className="py-8 text-center text-muted-foreground">No events in the next seven days.</p>}
          </div>
        </section>
        <section className="admin-card">
          <h2 className="text-xl font-semibold">Order status</h2>
          <div className="mt-4 space-y-3">
            {data.orders.byStatus.map((row: any) => (
              <div key={row.orderStatus} className="flex items-center justify-between rounded-xl border p-3">
                <StatusBadge value={row.orderStatus} /><strong>{row._count}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof IndianRupee; label: string; value: string | number }) {
  return <div className="admin-card"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="h-5 w-5 text-primary" /></div><p className="mt-4 text-3xl font-semibold">{value}</p></div>;
}
