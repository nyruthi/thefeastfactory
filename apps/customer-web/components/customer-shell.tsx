'use client';

import {
  Bell,
  BookOpen,
  ClipboardList,
  Home,
  LogIn,
  Package,
  ShoppingBag,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useOrderBuilderStore } from '../store/order-builder.store';
import { useSessionStore } from '../store/session.store';
import { cn } from '../lib/utils';
import { apiRequest } from '../lib/api';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/menu', label: 'Menu', icon: BookOpen },
  { href: '/packages', label: 'Packages', icon: Package },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
];

export function CustomerShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const session = useSessionStore((state) => state.session);
  const selectedItems = useOrderBuilderStore((state) => state.selectedItems);
  const cartPackage = useOrderBuilderStore((state) => state.package);
  const [mounted, setMounted] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!session) {
      setUnread(0);
      return;
    }
    apiRequest<{ count: number }>(
      '/me/notifications/unread-count',
      {},
      session.accessToken,
    )
      .then((result) => setUnread(result.count))
      .catch(() => undefined);
  }, [session, pathname]);

  const cartCount = mounted ? selectedItems.length : 0;
  const hasCart = mounted && Boolean(cartPackage);

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              F
            </span>
            <span>
              <span className="block font-serif text-xl font-semibold leading-none text-primary">
                The Feast Factory
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Celebrations, served
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border bg-white/80 p-1 md:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {session && (
              <Link
                href="/notifications"
                className="relative grid h-10 w-10 place-items-center rounded-full border bg-white"
                aria-label={`${unread} unread notifications`}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold">
                    {unread}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/cart"
              className={cn(
                'relative flex h-10 items-center gap-2 rounded-full border bg-white px-3 text-sm font-semibold transition hover:border-primary/40',
                pathname === '/cart' && 'border-primary text-primary',
              )}
              aria-label={`Cart with ${cartCount} selected items`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">
                {hasCart ? 'Your cart' : 'Cart'}
              </span>
              {cartCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] text-accent-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href={session ? '/profile' : '/login'}
              className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white"
              aria-label={session ? 'Profile' : 'Login'}
            >
              {session ? (
                <User className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {children}

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t bg-white/95 px-2 pb-safe backdrop-blur md:hidden">
        {[
          ...links.slice(0, 3),
          { href: '/cart', label: 'Cart', icon: ShoppingBag },
          {
            href: session ? '/profile' : '/login',
            label: session ? 'Profile' : 'Login',
            icon: session ? User : LogIn,
          },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
              pathname === href ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
            {href === '/cart' && cartCount > 0 && (
              <span className="absolute right-[24%] top-2 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] text-accent-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
