'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../../lib/api';
import { useAdminSessionStore } from '../../../../store/session.store';
export default function MenuItems() {
  const session = useAdminSessionStore((s) => s.session); const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { if (session) apiRequest<any[]>('/admin/menu/items', {}, session.accessToken).then(setRows); }, [session]);
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-semibold">Menu items</h1><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Dish</th><th>Category</th><th>Diet</th><th className="text-right">Price</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className="border-b bg-white"><td className="p-3">{r.name}</td><td>{r.category.name}</td><td>{r.isVeg ? 'Veg' : 'Non-veg'}</td><td className="text-right">₹{r.basePrice}</td></tr>)}</tbody></table></div></main>;
}
