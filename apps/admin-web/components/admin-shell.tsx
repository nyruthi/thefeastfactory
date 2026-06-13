'use client';
import { BarChart3, ClipboardList, CreditCard, LogIn, Package, Settings, Utensils } from 'lucide-react';
import Link from 'next/link';
import { useAdminSessionStore } from '../store/session.store';
const links = [
  ['Dashboard', '/admin/dashboard', BarChart3], ['Orders', '/admin/orders', ClipboardList], ['Menu', '/admin/menu/categories', Utensils],
  ['Packages', '/admin/packages', Package], ['Payments', '/admin/payments', CreditCard], ['Reports', '/admin/reports', BarChart3], ['Settings', '/admin/settings', Settings],
] as const;
export function AdminShell({ children }: { children: React.ReactNode }) {
  const session = useAdminSessionStore((s) => s.session);
  return <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]"><aside className="hidden border-r bg-white p-4 md:block"><Link href="/admin/dashboard" className="text-lg font-semibold text-primary">Aranyam Admin</Link><nav className="mt-8 space-y-1">{links.map(([label, href, Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Icon className="h-4 w-4" />{label}</Link>)}</nav></aside><div><header className="flex h-16 items-center justify-between border-b bg-white px-5"><span className="font-medium md:hidden">Aranyam Admin</span><span className="ml-auto flex items-center gap-2 text-sm">{session?.admin.name ?? 'Not signed in'}<LogIn className="h-4 w-4" /></span></header>{children}</div></div>;
}
