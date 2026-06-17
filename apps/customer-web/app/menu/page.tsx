'use client';

import type { MenuCategory, MenuItem } from '@aranyam/shared-types';
import { Leaf, Search, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '../../components/ui/input';
import { StatePanel } from '../../components/ui/state-panel';
import { apiRequest } from '../../lib/api';
import { cn } from '../../lib/utils';

type DietaryFilter = 'all' | 'veg' | 'non-veg';

export default function PublicMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [dietary, setDietary] = useState<DietaryFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<MenuCategory[]>('/menu/categories').then(setCategories).catch((reason) => setError(reason.message));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (dietary !== 'all') params.set('isVeg', dietary === 'veg' ? 'true' : 'false');
    if (debouncedSearch) params.set('search', debouncedSearch);

    setLoading(true);
    setError('');
    apiRequest<MenuItem[]>(`/menu/items${params.size ? `?${params.toString()}` : ''}`)
      .then(setItems)
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [categoryId, dietary, debouncedSearch]);

  return (
    <main className="page-shell pb-28">
      <div className="max-w-3xl">
        <p className="eyebrow">Our food</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold">Browse every dish, anytime.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          Explore The Feast Factory menu before choosing a package. Package availability and selections are confirmed
          when you begin an order.
        </p>
      </div>

      <section className="surface-card mt-8 p-4 sm:p-5">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-11"
            placeholder="Search dishes or ingredients"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            className={cn('shrink-0 rounded-full border px-4 py-2 text-sm font-semibold', !categoryId ? 'border-primary bg-primary text-white' : 'bg-white')}
            onClick={() => setCategoryId('')}
          >
            All categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={cn('shrink-0 rounded-full border px-4 py-2 text-sm font-semibold', categoryId === category.id ? 'border-primary bg-primary text-white' : 'bg-white')}
              onClick={() => setCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ['all', 'All dishes'],
            ['veg', 'Vegetarian'],
            ['non-veg', 'Non-vegetarian'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              className={cn('rounded-full px-4 py-2 text-xs font-bold', dietary === value ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}
              onClick={() => setDietary(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {error && <StatePanel className="mt-6" tone="danger" title="Menu could not load" description={error} actionHref="/packages" actionLabel="Browse packages" />}
      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-72 animate-pulse rounded-xl bg-white/60" />)}
        </div>
      ) : items.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="surface-card overflow-hidden">
              {item.imageUrl ? (
                <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url("${item.imageUrl}")` }} role="img" aria-label={item.name} />
              ) : (
                <div className="grid h-40 place-items-center bg-gradient-to-br from-primary/10 via-accent/10 to-white text-primary">
                  <Utensils className="h-10 w-10" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{item.category?.name ?? 'Menu'}</p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold">{item.name}</h2>
                  </div>
                  <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', item.isVeg ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700')}>
                    <Leaf className="h-3 w-3" /> {item.isVeg ? 'Veg' : 'Non-veg'}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {item.description || 'A thoughtfully prepared Feast Factory favourite for your celebration.'}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-card mt-8 p-10 text-center">
          <Search className="mx-auto h-7 w-7 text-primary" />
          <h2 className="mt-4 font-serif text-2xl font-semibold">No dishes match these filters</h2>
          <p className="mt-2 text-sm text-muted-foreground">Try another category or a broader search.</p>
        </div>
      )}
    </main>
  );
}
