import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../lib/query-provider';
import { AdminShell } from '../components/admin-shell';

export const metadata: Metadata = {
  title: 'The Feast Factory Admin',
  description: 'Operations dashboard for The Feast Factory catering orders.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider><AdminShell>{children}</AdminShell></QueryProvider>
      </body>
    </html>
  );
}
