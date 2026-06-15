'use client';
import { ImagePlus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../../../components/status-badge';
import { Input } from '../../../../components/ui/input';
import { apiBaseUrl, apiRequest } from '../../../../lib/api';
import { useAdminSessionStore } from '../../../../store/session.store';

export default function MenuItems() {
  const session = useAdminSessionStore((state) => state.session);
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const load = () => session && apiRequest<any[]>('/admin/menu/items', {}, session.accessToken).then(setRows);
  useEffect(() => { load(); }, [session]);
  const filtered = useMemo(() => rows.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  async function upload(item: any, file?: File) {
    if (!file || !session) return;
    setMessage(`Uploading ${item.name}...`);
    const form = new FormData(); form.append('file', file);
    const result = await apiRequest<{ url: string }>('/admin/uploads/menu-images', { method: 'POST', body: form }, session.accessToken);
    const imageUrl = result.url.startsWith('/') ? `${apiBaseUrl}${result.url}` : result.url;
    await apiRequest(`/admin/menu/items/${item.id}`, { method: 'PATCH', body: JSON.stringify({ imageUrl }) }, session.accessToken);
    setMessage(`${item.name} image updated.`); await load();
  }
  return <main className="admin-page"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Catalogue</p><h1 className="admin-title mt-2">Menu items</h1><div className="admin-card mt-7 flex items-center gap-3"><Search className="h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dishes" className="border-0 shadow-none" /></div>{message && <p className="mt-3 text-sm text-primary">{message}</p>}<div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <article key={item.id} className="admin-card overflow-hidden p-0"><div className="aspect-[16/9] bg-muted">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><ImagePlus className="h-8 w-8" /></div>}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{item.name}</h2><p className="text-sm text-muted-foreground">{item.category.name} · {item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}</p></div><StatusBadge value={item.isActive ? 'ACTIVE' : 'INACTIVE'} /></div><div className="mt-4 flex items-center justify-between"><strong>₹{item.basePrice}</strong><label className="cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold hover:border-primary"><input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(item, event.target.files?.[0])} />Upload image</label></div></div></article>)}</div></main>;
}
