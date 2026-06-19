import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '../lib/query-provider';
import { CustomerShell } from '../components/customer-shell';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'The Feast Factory',
  description:
    'Plan catering events, customize menus, and place orders with The Feast Factory.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${nunitoSans.variable} font-sans antialiased`}>
        <QueryProvider>
          <CustomerShell>{children}</CustomerShell>
        </QueryProvider>
      </body>
    </html>
  );
}
