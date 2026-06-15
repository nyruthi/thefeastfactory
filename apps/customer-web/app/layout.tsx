import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../lib/query-provider';
import { CustomerShell } from '../components/customer-shell';

export const metadata: Metadata = {
  title: 'The Feast Factory',
  description: 'Plan catering events, customize menus, and place orders with The Feast Factory.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider><CustomerShell>{children}</CustomerShell></QueryProvider>
      </body>
    </html>
  );
}
