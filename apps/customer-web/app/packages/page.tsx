'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

/* ─── Package card data ─── */
const PKG_CARDS = [
  {
    name: 'Pooja Package',
    desc: 'Ideal for religious ceremonies, poojas, housewarmings and traditional functions.',
    serves: '20 – 500 Guests',
    image: '/pkg-puja.png',
    href: '/packages/puja',
    isBuild: false,
    includes: [
      'Traditional Menu',
      'Sweets',
      'Main Course',
      'Rice & Bread',
      'Dessert',
    ],
  },
  {
    name: 'Farm House Celebration',
    desc: 'Perfect for birthdays, weekend parties, family get-togethers and casual celebrations.',
    serves: '20 – 200 Guests',
    image: '/pkg-farmhouse.png',
    href: '/packages/farmhouse',
    isBuild: false,
    includes: [
      '2 Starters',
      '2 Main Courses',
      'Rice & Bread',
      'Dessert',
      'Beverage',
    ],
  },
  {
    name: 'Corporate Gathering',
    desc: 'Ideal for team lunches, annual events, client meets and office celebrations.',
    serves: '20 – 1,000 Guests',
    image: '/pkg-corporate.png',
    href: '/packages/corporate',
    isBuild: false,
    includes: [
      'Premium Starters',
      'Main Course',
      'Rice & Bread',
      'Dessert',
      'Beverage',
    ],
  },
  {
    name: 'Build Your Own Package',
    desc: 'Pick your favourite dishes and create a custom menu that fits your needs perfectly.',
    serves: null,
    image: '/order-build.png',
    href: '/packages/build',
    isBuild: true,
    includes: [
      'Choose any items',
      'Customise portions',
      'Add / remove items',
      'Perfect for any occasion',
    ],
  },
] as const;

/* ─── Compare table ─── */
const COMPARE_COLS = [
  { label: 'POOJA PACKAGE', color: 'hsl(352 59% 38%)' },
  { label: 'FARM HOUSE CELEBRATION', color: 'hsl(38 52% 42%)' },
  { label: 'CORPORATE GATHERING', color: 'hsl(0 0% 28%)' },
  { label: 'BUILD YOUR OWN', color: 'hsl(0 0% 28%)' },
];

type Cell = { type: 'check' } | { type: 'dash' } | { type: 'text'; value: string } | { type: 'custom' };

const COMPARE_ROWS: { label: string; cells: Cell[]; highlight?: boolean }[] = [
  { label: 'Starters',     cells: [{ type: 'text', value: '1' }, { type: 'text', value: '2' }, { type: 'text', value: '2' }, { type: 'custom' }] },
  { label: 'Main Course',  cells: [{ type: 'text', value: '2' }, { type: 'text', value: '2' }, { type: 'text', value: '2' }, { type: 'custom' }] },
  { label: 'Rice & Bread', cells: [{ type: 'check' }, { type: 'check' }, { type: 'check' }, { type: 'custom' }] },
  { label: 'Dessert',      cells: [{ type: 'check' }, { type: 'check' }, { type: 'check' }, { type: 'custom' }] },
  { label: 'Beverage',     cells: [{ type: 'dash' },  { type: 'check' }, { type: 'check' }, { type: 'custom' }] },
  { label: 'Serves',       cells: [
    { type: 'text', value: '20 – 500' },
    { type: 'text', value: '20 – 200' },
    { type: 'text', value: '20 – 1000' },
    { type: 'text', value: '20 – 1000' },
  ], highlight: true },
];

function CellValue({ cell }: { cell: Cell }) {
  if (cell.type === 'check') return <Check className="mx-auto h-[18px] w-[18px] text-emerald-600" strokeWidth={2.6} />;
  if (cell.type === 'dash')  return <span className="text-base text-muted-foreground">—</span>;
  if (cell.type === 'custom') return <span className="text-sm font-bold text-primary">Custom</span>;
  return <span className="text-sm font-bold text-foreground">{cell.value}</span>;
}

/* ─── Bottom features ─── */
const BOTTOM_FEATURES = [
  { title: 'Expertly Curated Menus',       sub: 'Crafted by culinary experts' },
  { title: 'On-time Delivery',              sub: 'Punctual delivery for every event' },
  { title: 'No Hidden Charges',            sub: '100% transparent pricing' },
  { title: 'Hygienic & Safe Preparation',  sub: 'Made with premium ingredients' },
];

/* ─── Hero features ─── */
const HERO_FEATURES = [
  'Fully Customizable Menus',
  'Transparent Pricing',
  'Serves 20 – 1000 Guests',
  'Fresh & Hygienic Preparation',
];

export default function PackagesPage() {
  return (
    <main className="pb-20">

      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      <section
        style={{ background: 'hsl(352 59% 18%)', position: 'relative', overflow: 'hidden' }}
      >
        {/* background image */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: "url('/order-occasion.png')",
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
        {/* gradient overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, hsl(352 59% 18%) 8%, hsla(352,59%,18%,0.55) 42%, transparent 72%)',
          }}
        />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 32px', position: 'relative', zIndex: 2 }}>
          <h1
            style={{
              fontFamily: "'Zilla Slab', serif",
              fontWeight: 700, fontSize: 'clamp(36px, 5vw, 56px)',
              lineHeight: 1.05, margin: '0 0 14px', color: '#fff', letterSpacing: '-0.01em',
            }}
          >
            Occasion{' '}
            <span style={{ color: 'hsl(41 56% 56%)' }}>Packages</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.5, color: 'hsl(0 0% 90%)', margin: '0 0 32px', maxWidth: 460 }}>
            Curated menus designed for every celebration.
          </p>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {HERO_FEATURES.map((label) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Check style={{ width: 18, height: 18, color: 'hsl(41 56% 60%)', flexShrink: 0 }} strokeWidth={2.8} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ CHOOSE PACKAGE ══════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '50px 32px 8px' }}>
        {/* section heading */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 34 }}>
          <span style={{ width: 42, height: 2, background: 'hsl(35 25% 78%)', flexShrink: 0 }} />
          <h2 style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 'clamp(22px,3vw,30px)', color: 'hsl(0 0% 12%)', margin: 0, textAlign: 'center' }}>
            Choose the perfect package for your occasion
          </h2>
          <span style={{ width: 42, height: 2, background: 'hsl(35 25% 78%)', flexShrink: 0 }} />
        </div>

        {/* 4-column card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22 }}>
          {PKG_CARDS.map((pkg) => (
            <div
              key={pkg.name}
              style={{
                background: '#fff',
                border: '1px solid hsl(35 22% 88%)',
                borderRadius: 14,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* image */}
              <div style={{ position: 'relative', height: 175 }}>
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* icon badge */}
                <div
                  style={{
                    position: 'absolute', left: 18, bottom: -22,
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'hsl(352 59% 30%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.22)',
                  }}
                >
                  <span style={{ color: '#fff', fontSize: 22 }}>
                    {pkg.isBuild ? '✦' : '✿'}
                  </span>
                </div>
              </div>

              {/* body */}
              <div style={{ padding: '32px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 22, margin: '0 0 10px', color: 'hsl(0 0% 12%)', lineHeight: 1.15 }}>
                  {pkg.name}
                </h3>
                <p style={{ fontSize: 14, color: 'hsl(0 0% 42%)', lineHeight: 1.5, margin: '0 0 16px' }}>
                  {pkg.desc}
                </p>

                {pkg.serves && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'hsl(0 0% 30%)', marginBottom: 4 }}>Serves</div>
                    <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 19, color: 'hsl(352 59% 35%)' }}>
                      {pkg.serves}
                    </div>
                  </div>
                )}

                {!pkg.isBuild && (
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'hsl(0 0% 30%)', marginBottom: 13 }}>Includes:</div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
                  {pkg.includes.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Check
                        style={{ width: 16, height: 16, flexShrink: 0, color: pkg.isBuild ? 'hsl(140 50% 38%)' : 'hsl(352 59% 38%)' }}
                        strokeWidth={2.6}
                      />
                      <span style={{ fontSize: 14, color: 'hsl(0 0% 26%)' }}>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={pkg.href}
                  style={{
                    marginTop: 'auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%',
                    background: pkg.isBuild ? 'hsl(352 59% 30%)' : '#fff',
                    color: pkg.isBuild ? '#fff' : 'hsl(352 59% 30%)',
                    border: '1px solid hsl(352 59% 30%)',
                    borderRadius: 10, padding: '13px',
                    fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 15,
                    textDecoration: 'none',
                  }}
                >
                  {pkg.isBuild ? 'Build Your Package' : 'View Package'}
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════ COMPARE TABLE ══════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 28 }}>
          <span style={{ width: 42, height: 2, background: 'hsl(41 56% 55%)', flexShrink: 0 }} />
          <h2 style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 28, color: 'hsl(0 0% 12%)', margin: 0 }}>
            Compare Packages
          </h2>
          <span style={{ width: 42, height: 2, background: 'hsl(41 56% 55%)', flexShrink: 0 }} />
        </div>

        <div style={{ background: '#fff', border: '1px solid hsl(35 22% 88%)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'hsl(37 30% 95%)' }}>
                  <th style={{ textAlign: 'left', padding: '17px 22px', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', color: 'hsl(0 0% 30%)', width: '22%' }}>
                    INCLUDES
                  </th>
                  {COMPARE_COLS.map((col) => (
                    <th
                      key={col.label}
                      style={{ textAlign: 'center', padding: '17px 14px', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.3, color: col.color }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label} style={{ background: row.highlight ? 'hsl(37 30% 96%)' : '#fff' }}>
                    <td style={{ padding: '15px 22px', fontSize: 14, fontWeight: 700, color: 'hsl(0 0% 25%)', borderTop: '1px solid hsl(35 22% 91%)' }}>
                      {row.label}
                    </td>
                    {row.cells.map((cell, i) => (
                      <td key={i} style={{ textAlign: 'center', padding: '15px 14px', borderTop: '1px solid hsl(35 22% 91%)' }}>
                        <CellValue cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ BOTTOM FEATURES ══════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 32px 0' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, hsl(41 45% 95%), hsl(39 44% 97%))',
            border: '1px solid hsl(35 22% 88%)',
            borderRadius: 16, padding: '26px 14px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          {BOTTOM_FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px',
                borderLeft: i > 0 ? '1px solid hsl(35 22% 86%)' : 'none',
              }}
            >
              <div
                style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: 'hsl(352 40% 94%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: 'hsl(352 59% 30%)',
                  fontSize: 24,
                }}
              >
                {['🍽', '⏱', '✓', '🌿'][i]}
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'hsl(0 0% 15%)' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'hsl(0 0% 48%)' }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
