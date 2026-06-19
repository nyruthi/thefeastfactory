'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { useAdminSessionStore } from '../../../store/session.store';
export default function Reports() {
  const session = useAdminSessionStore((s) => s.session);
  const [data, setData] = useState<any>({});
  useEffect(() => {
    if (session)
      Promise.all([
        apiRequest('/admin/reports/revenue', {}, session.accessToken),
        apiRequest('/admin/reports/orders', {}, session.accessToken),
        apiRequest('/admin/reports/payments', {}, session.accessToken),
      ]).then(([revenue, orders, payments]) =>
        setData({ revenue, orders, payments }),
      );
  }, [session]);
  return (
    <main className="p-5 md:p-8">
      <h1 className="text-3xl font-semibold">Reports</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Report
          label="Gross revenue"
          value={`₹${data.revenue?.grossRevenue ?? '0.00'}`}
        />
        <Report label="Orders" value={data.orders?.total ?? 0} />
        <Report label="Payments" value={data.payments?.total ?? 0} />
      </div>
      <h2 className="mt-10 text-xl font-semibold">Popular dishes</h2>
      <div className="mt-3 space-y-2">
        {data.orders?.popularItems?.map((i: any) => (
          <div
            key={i.menuItemName}
            className="flex justify-between rounded-md border bg-white p-3"
          >
            <span>{i.menuItemName}</span>
            <strong>{i._count}</strong>
          </div>
        ))}
      </div>
    </main>
  );
}
function Report({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
