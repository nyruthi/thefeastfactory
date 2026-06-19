'use client';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { apiRequest } from '../../../../lib/api';
import { useAdminSessionStore } from '../../../../store/session.store';
export default function Categories() {
  const session = useAdminSessionStore((s) => s.session);
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState('');
  const load = () =>
    session &&
    apiRequest<any[]>('/admin/menu/categories', {}, session.accessToken).then(
      setRows,
    );
  useEffect(() => {
    load();
  }, [session]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    await apiRequest(
      '/admin/menu/categories',
      {
        method: 'POST',
        body: JSON.stringify({ name, displayOrder: rows.length + 1 }),
      },
      session!.accessToken,
    );
    setName('');
    load();
  }
  return (
    <main className="p-5 md:p-8">
      <h1 className="text-3xl font-semibold">Menu categories</h1>
      <form onSubmit={add} className="mt-6 flex max-w-lg gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          required
        />
        <Button>Add</Button>
      </form>
      <div className="mt-6 space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex justify-between rounded-md border bg-white p-4"
          >
            <span>{r.name}</span>
            <span className="text-sm text-muted-foreground">
              {r.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
