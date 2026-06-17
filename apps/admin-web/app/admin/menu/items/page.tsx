'use client';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Switch from '@mui/material/Switch';
import { ImagePlus, Pencil, Plus, Save, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { MenuCategory, MenuItem } from '@aranyam/shared-types';
import { StatusBadge } from '../../../../components/status-badge';
import { Button } from '../../../../components/ui/button';
import { Field, Select, Textarea } from '../../../../components/ui/form';
import { Input } from '../../../../components/ui/input';
import { apiBaseUrl, apiRequest } from '../../../../lib/api';
import { useAdminSessionStore } from '../../../../store/session.store';

type MenuItemWithCategory = MenuItem & { category: MenuCategory };

type MenuForm = {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: string;
  isVeg: boolean;
  isActive: boolean;
  imageUrl: string;
};

const emptyForm: MenuForm = {
  categoryId: '',
  name: '',
  description: '',
  basePrice: '',
  isVeg: true,
  isActive: true,
  imageUrl: '',
};

export default function MenuItems() {
  const session = useAdminSessionStore((state) => state.session);
  const [rows, setRows] = useState<MenuItemWithCategory[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<MenuForm>(emptyForm);

  async function load() {
    if (!session) return;
    const [items, categoryRows] = await Promise.all([
      apiRequest<MenuItemWithCategory[]>('/admin/menu/items', {}, session.accessToken),
      apiRequest<MenuCategory[]>('/admin/menu/categories', {}, session.accessToken),
    ]);
    setRows(items);
    setCategories(categoryRows);
  }

  useEffect(() => {
    load().catch((reason) => setError((reason as Error).message));
  }, [session]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !needle || `${row.name} ${row.description ?? ''} ${row.category.name}`.toLowerCase().includes(needle);
      const matchesCategory = !categoryFilter || row.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [rows, search, categoryFilter]);

  const activeCategories = categories.filter((category) => category.isActive);

  function openCreate() {
    setError('');
    setMessage('');
    setForm({ ...emptyForm, categoryId: activeCategories[0]?.id ?? categories[0]?.id ?? '' });
    setEditorOpen(true);
  }

  function openEdit(item: MenuItemWithCategory) {
    setError('');
    setMessage('');
    setForm({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description ?? '',
      basePrice: item.basePrice,
      isVeg: item.isVeg,
      isActive: item.isActive,
      imageUrl: item.imageUrl ?? '',
    });
    setEditorOpen(true);
  }

  async function upload(file?: File) {
    if (!file || !session) return;
    setMessage(`Uploading ${file.name}...`);
    const data = new FormData();
    data.append('file', file);
    const result = await apiRequest<{ url: string }>('/admin/uploads/menu-images', { method: 'POST', body: data }, session.accessToken);
    const imageUrl = result.url.startsWith('/') ? `${apiBaseUrl}${result.url}` : result.url;
    setForm((current) => ({ ...current, imageUrl }));
    setMessage('Image uploaded. Save the item to apply it.');
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        basePrice: form.basePrice,
        isVeg: form.isVeg,
        isActive: form.isActive,
        imageUrl: form.imageUrl.trim() || undefined,
      };
      if (form.id) {
        await apiRequest(`/admin/menu/items/${form.id}`, { method: 'PATCH', body: JSON.stringify(payload) }, session.accessToken);
        setMessage(`${payload.name} updated.`);
      } else {
        await apiRequest('/admin/menu/items', { method: 'POST', body: JSON.stringify(payload) }, session.accessToken);
        setMessage(`${payload.name} created.`);
      }
      setEditorOpen(false);
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: MenuItemWithCategory) {
    if (!session || !window.confirm(`Remove ${item.name} from the active menu?`)) return;
    setError('');
    await apiRequest(`/admin/menu/items/${item.id}`, { method: 'DELETE' }, session.accessToken);
    setMessage(`${item.name} removed from active menu.`);
    await load();
  }

  if (!session) return <main className="admin-page">Sign in to manage the menu.</main>;

  return (
    <main className="admin-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Catalogue</p>
          <h1 className="admin-title mt-2">Menu item manager</h1>
          <p className="mt-2 text-muted-foreground">Create dishes, upload real menu images, and keep live prices synced to the database.</p>
        </div>
        <Button onClick={openCreate} disabled={!categories.length}>
          <Plus className="mr-2 h-4 w-4" />
          New item
        </Button>
      </div>

      <section className="admin-card mt-7 grid gap-3 lg:grid-cols-[1fr_260px]">
        <div className="flex items-center gap-3 rounded-xl border bg-white px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dishes, categories, descriptions" className="border-0 shadow-none" />
        </div>
        <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </Select>
      </section>

      {message && <p className="mt-3 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">{message}</p>}
      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="admin-card overflow-hidden p-0">
            <div className="aspect-[16/9] bg-muted">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="text-sm text-muted-foreground">{item.category.name} · {item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}</p>
                </div>
                <StatusBadge value={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              {item.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <strong className="text-xl">₹{item.basePrice}</strong>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" onClick={() => remove(item)} aria-label={`Remove ${item.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!filtered.length && <div className="admin-card mt-5 text-center text-muted-foreground">No menu items match the current filters.</div>}

      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullWidth maxWidth="md">
        <DialogTitle className="flex items-center justify-between">
          {form.id ? 'Edit menu item' : 'Create menu item'}
          <button type="button" onClick={() => setEditorOpen(false)} className="rounded-full p-2 hover:bg-muted" aria-label="Close editor">
            <X className="h-5 w-5" />
          </button>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={save} className="grid gap-6 py-2 lg:grid-cols-[280px_1fr]">
            <div>
              <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt={form.name || 'Menu item'} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <ImagePlus className="h-10 w-10" />
                  </div>
                )}
              </div>
              <label className="mt-3 flex h-11 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold hover:border-primary">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload image
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files?.[0]).catch((reason) => setError((reason as Error).message))} />
              </label>
              <Field label="Image URL" optional className="mt-4">
                <Input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." />
              </Field>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Dish name">
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={150} />
                </Field>
                <Field label="Category">
                  <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>
                    <option value="" disabled>Select category</option>
                    {categories.map((category) => <option value={category.id} key={category.id}>{category.name}{category.isActive ? '' : ' (inactive)'}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Base price">
                  <Input value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} required inputMode="decimal" placeholder="120.00" pattern="^\\d+(\\.\\d{1,2})?$" />
                </Field>
                <Field label="Food type">
                  <RadioGroup row value={form.isVeg ? 'veg' : 'nonveg'} onChange={(event) => setForm({ ...form, isVeg: event.target.value === 'veg' })}>
                    <FormControlLabel value="veg" control={<Radio color="success" />} label="Vegetarian" />
                    <FormControlLabel value="nonveg" control={<Radio color="error" />} label="Non-veg" />
                  </RadioGroup>
                </Field>
              </div>
              <Field label="Description" optional>
                <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={1000} placeholder="Customer-facing dish details, ingredients, allergens, or service notes" />
              </Field>
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />}
                label={form.isActive ? 'Visible to customers' : 'Hidden from customers'}
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save item'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
