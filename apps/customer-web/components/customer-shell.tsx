'use client';

import { ClipboardList, Home, LogIn, MapPin, Package, User } from 'lucide-react';
import Link from 'next/link';
import { useSessionStore } from '../store/session.store';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/packages', label: 'Packages', icon: Package },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/addresses', label: 'Addresses', icon: MapPin },
  { href: '/profile', label: 'Profile', icon: User },
];

export function CustomerShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = useSessionStore((state) => state.session);
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-semibold text-primary">Aranyam Catering</Link>
          <nav className="hidden items-center gap-5 md:flex">
            {links.map(({ href, label }) => <Link key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>)}
          </nav>
          <Link href={session ? '/profile' : '/login'} aria-label={session ? 'Profile' : 'Login'}>
            {session ? <User className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
          </Link>
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-white md:hidden">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
            <Icon className="h-5 w-5" />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
