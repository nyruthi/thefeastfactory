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
import { apiRequest } from '../lib/api';
import { cn } from '../lib/utils';
import { Footer } from './home/footer';

const navLinks = [
  { href: '/', label: 'Home', activeKey: '/', icon: Home },
  { href: '/menu', label: 'Menu', activeKey: '/menu', icon: BookOpen },
  { href: '/packages', label: 'Packages', activeKey: '/packages', icon: Package },
  { href: '/packages/meal-boxes', label: 'Meal Boxes', activeKey: '/packages/meal-boxes', icon: Package },
  { href: '/orders', label: 'Orders', activeKey: '/orders', icon: ClipboardList },
  { href: '/about', label: 'About Us', activeKey: '/about', icon: Home },
];

const mobileLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/menu', label: 'Menu', icon: BookOpen },
  { href: '/packages', label: 'Packages', icon: Package },
];

export function CustomerShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const session = useSessionStore((s) => s.session);
  const selectedItems = useOrderBuilderStore((s) => s.selectedItems);
  const cartPackage = useOrderBuilderStore((s) => s.package);
  const [mounted, setMounted] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!session) { setUnread(0); return; }
    apiRequest<{ count: number }>('/me/notifications/unread-count', {}, session.accessToken)
      .then((r) => setUnread(r.count))
      .catch(() => undefined);
  }, [session, pathname]);

  const cartCount = mounted ? selectedItems.length : 0;
  const cartActive = mounted && (Boolean(cartPackage) || pathname === '/cart');

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {/* ─── Desktop header ─── */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/logo.png"
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
            <span className="hidden sm:block">
              <span className="block text-[15px] font-extrabold leading-tight tracking-tight text-primary">
                The Feast Factory
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Bulk Catering
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0 md:flex">
            {navLinks.map(({ href, label, activeKey }) => {
              const selfMatch = activeKey === '/' ? pathname === '/' : pathname.startsWith(activeKey);
              // If a more specific nav entry also matches, this one is not active
              const moreSpecificMatch = selfMatch && navLinks.some(
                (other) =>
                  other.activeKey !== activeKey &&
                  other.activeKey.startsWith(activeKey) &&
                  pathname.startsWith(other.activeKey),
              );
              const active = selfMatch && !moreSpecificMatch;
              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'px-3.5 py-2 text-sm font-semibold transition-colors',
                    active
                      ? 'text-primary underline decoration-primary decoration-2 underline-offset-[6px]'
                      : 'text-foreground/80 hover:text-primary',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {session && (
              <Link
                href="/notifications"
                className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
                aria-label={`${unread} unread notifications`}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-accent-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`Cart — ${cartCount} items selected`}
              className={cn(
                'relative flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold transition-all',
                cartActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-card text-foreground hover:border-primary/40 hover:text-primary',
              )}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Your cart</span>
              {cartCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-accent-foreground">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Login / Profile */}
            <Link
              href={session ? '/profile' : '/login'}
              aria-label={session ? 'Profile' : 'Sign in'}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              {session ? <User className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
            </Link>
          </div>
        </div>
      </header>

      {children}

      <Footer />

      {/* ─── Mobile bottom nav ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-card/97 backdrop-blur md:hidden">
        {[
          ...mobileLinks,
          { href: '/cart', label: 'Cart', icon: ShoppingBag },
          { href: session ? '/profile' : '/login', label: session ? 'Profile' : 'Login', icon: session ? User : LogIn },
        ].map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href + label}
              href={href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
              {href === '/cart' && cartCount > 0 && (
                <span className="absolute right-[18%] top-2 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-accent-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
