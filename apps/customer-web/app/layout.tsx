import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '../lib/query-provider';
import { CustomerShell } from '../components/customer-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
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
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <QueryProvider>
          <CustomerShell>{children}</CustomerShell>
        </QueryProvider>
      </body>
    </html>
  );
}
