'use client';

import { ArrowLeftRight, ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { MenuItem, PackageConfiguration, PackageSummary } from '@aranyam/shared-types';

type PkgItem = PackageConfiguration['categoryRules'][number]['items'][number];

/* ─── Package card data ─── */
interface PkgCard {
  name: string;
  desc: string;
  serves: string | null;
  image: string;
  href: string;
  isBuild: boolean;
  includes: string[];
}

const PKG_CARDS: PkgCard[] = [
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
];

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

/* ─── Veg / Non-veg dot indicator ─── */
function VegDot({ isVeg }: { isVeg: boolean }) {
  const color = isVeg ? 'hsl(140 50% 38%)' : 'hsl(0 70% 45%)';
  return (
    <span style={{
      width: 12, height: 12, borderRadius: 3, flexShrink: 0,
      border: `2px solid ${color}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'block' }} />
    </span>
  );
}

export default function PackagesPage() {
  const [summaries, setSummaries] = useState<PackageSummary[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, PackageConfiguration>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [swappedItems, setSwappedItems] = useState<Record<string, PkgItem>>({});
  const [swapOpen, setSwapOpen] = useState<string | null>(null);
  const [swapAlts, setSwapAlts] = useState<Record<string, MenuItem[]>>({});
  const [swapLoading, setSwapLoading] = useState(false);

  useEffect(() => {
    fetch('/api/packages')
      .then((r) => r.json())
      .then((data: PackageSummary[]) => setSummaries(data))
      .catch(() => {});
  }, []);

  // Map cards to API packages by position, not by name.
  // FIXED_PACKAGE entries (in displayOrder) map to the 3 occasion cards;
  // the single CUSTOM_PACKAGE maps to the "Build Your Own" card.
  const fixedPkgs = summaries.filter((s) => s.type === 'FIXED_PACKAGE');
  const customPkg = summaries.find((s) => s.type === 'CUSTOM_PACKAGE');

  function getApiPkg(pkg: PkgCard): PackageSummary | undefined {
    if (pkg.isBuild) return customPkg;
    const idx = PKG_CARDS.filter((c) => !c.isBuild).indexOf(pkg);
    return fixedPkgs[idx];
  }

  async function toggleDetails(apiPkg: PackageSummary) {
    if (expandedId === apiPkg.id) {
      setExpandedId(null);
      setSwapOpen(null);
      return;
    }
    setExpandedId(apiPkg.id);
    if (configs[apiPkg.id] || !apiPkg.activeVersion) return;

    setLoadingId(apiPkg.id);
    try {
      const res = await fetch(`/api/package-versions/${apiPkg.activeVersion.id}/configuration`);
      if (res.ok) {
        const config: PackageConfiguration = await res.json();
        setConfigs((prev) => ({ ...prev, [apiPkg.id]: config }));
      }
    } finally {
      setLoadingId(null);
    }
  }

  function getDisplayItems(rule: PackageConfiguration['categoryRules'][number], pkgId: string): PkgItem[] {
    const count = Math.min(rule.maxSelections, rule.items.length);
    return Array.from({ length: count }, (_, i) => swappedItems[`${pkgId}:${rule.id}:${i}`] ?? rule.items[i]!);
  }

  function getDisplayedIds(rule: PackageConfiguration['categoryRules'][number], pkgId: string): Set<string> {
    return new Set(getDisplayItems(rule, pkgId).map((i) => i.id));
  }

  async function openSwap(swapKey: string, categoryId: string, displayedIds: Set<string>) {
    if (swapOpen === swapKey) { setSwapOpen(null); return; }
    setSwapOpen(swapKey);
    if (swapAlts[categoryId]) return;
    setSwapLoading(true);
    try {
      const res = await fetch(`/api/menu/items?categoryId=${categoryId}`);
      if (res.ok) {
        const items: MenuItem[] = await res.json();
        setSwapAlts((prev) => ({ ...prev, [categoryId]: items }));
      }
    } finally {
      setSwapLoading(false);
    }
  }

  function handleSwap(pkgId: string, ruleId: string, position: number, alt: MenuItem) {
    const asItem: PkgItem = {
      ...alt,
      isSwappable: true,
      basePrice: '0.00',
      boxPrice: '0.00',
      generalPrice: '0.00',
      itemPrice: '0.00',
      includedValue: '0.00',
      adjustmentAmount: '0.00',
    };
    setSwappedItems((prev) => ({ ...prev, [`${pkgId}:${ruleId}:${position}`]: asItem }));
    setSwapOpen(null);
  }

  return (
    <main className="pb-20">

      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      <section
        style={{ background: 'hsl(352 59% 18%)', position: 'relative', overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: "url('/order-occasion.png')",
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 34 }}>
          <span style={{ width: 42, height: 2, background: 'hsl(35 25% 78%)', flexShrink: 0 }} />
          <h2 style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 'clamp(22px,3vw,30px)', color: 'hsl(0 0% 12%)', margin: 0, textAlign: 'center' }}>
            Choose the perfect package for your occasion
          </h2>
          <span style={{ width: 42, height: 2, background: 'hsl(35 25% 78%)', flexShrink: 0 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22 }}>
          {PKG_CARDS.map((pkg) => {
            const apiPkg = getApiPkg(pkg);
            const isExpanded = !!(apiPkg && expandedId === apiPkg.id);
            const isLoading = !!(apiPkg && loadingId === apiPkg.id);
            const config = apiPkg ? configs[apiPkg.id] : undefined;
            const canExpand = !!(apiPkg?.activeVersion);

            return (
              <div
                key={pkg.name}
                style={{
                  border: '1px solid hsl(35 22% 88%)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* image */}
                <div style={{ position: 'relative', height: 175, flexShrink: 0 }}>
                  <img
                    src={pkg.image}
                    alt={pkg.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
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
                <div style={{ padding: '32px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1, background: '#fff' }}>
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

                  {/* CTA */}
                  {pkg.isBuild ? (
                    <Link
                      href={pkg.href}
                      style={{
                        marginTop: 'auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%',
                        background: 'hsl(352 59% 30%)',
                        color: '#fff',
                        border: '1px solid hsl(352 59% 30%)',
                        borderRadius: 10, padding: '13px',
                        fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 15,
                        textDecoration: 'none',
                      }}
                    >
                      Build Your Package
                      <ArrowRight style={{ width: 15, height: 15 }} />
                    </Link>
                  ) : (
                    <button
                      onClick={() => canExpand && toggleDetails(apiPkg!)}
                      disabled={!canExpand}
                      style={{
                        marginTop: 'auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%',
                        background: isExpanded ? 'hsl(352 59% 30%)' : '#fff',
                        color: isExpanded ? '#fff' : 'hsl(352 59% 30%)',
                        border: '1px solid hsl(352 59% 30%)',
                        borderRadius: 10, padding: '13px',
                        fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 15,
                        cursor: canExpand ? 'pointer' : 'default',
                        opacity: canExpand ? 1 : 0.5,
                      }}
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                      {isExpanded
                        ? <ChevronUp style={{ width: 15, height: 15 }} />
                        : <ChevronDown style={{ width: 15, height: 15 }} />}
                    </button>
                  )}
                </div>

                {/* ── Expanded details panel ── */}
                {isExpanded && (
                  <div style={{ background: 'hsl(37 30% 97%)', borderTop: '1px solid hsl(35 22% 88%)', padding: '20px' }}>
                    {isLoading ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'hsl(0 0% 48%)', fontSize: 14 }}>
                        Loading package details…
                      </div>
                    ) : config ? (
                      <>
                        <div style={{
                          fontSize: 11, fontWeight: 800, letterSpacing: '0.07em',
                          color: 'hsl(0 0% 38%)', textTransform: 'uppercase', marginBottom: 14,
                        }}>
                          {config.isCustom ? 'Full Menu' : config.categoryRules[0]?.isMandatory ? 'Included Items' : 'Menu Highlights'}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {config.categoryRules.flatMap((rule) => {
                            const displayItems = getDisplayItems(rule, apiPkg!.id);
                            return displayItems.map((item, idx) => {
                              const swapKey = `${apiPkg!.id}:${rule.id}:${idx}`;
                              const isSwapOpen = swapOpen === swapKey;
                              const displayedIds = item.isSwappable ? getDisplayedIds(rule, apiPkg!.id) : new Set<string>();
                              const alternatives = item.isSwappable
                                ? (swapAlts[rule.category.id] ?? []).filter((a) => !displayedIds.has(a.id))
                                : [];

                              return (
                                <div key={swapKey}>
                                  <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: '#fff', borderRadius: 7, padding: '5px 9px',
                                    border: `1px solid ${isSwapOpen ? 'hsl(352 59% 72%)' : 'hsl(35 22% 90%)'}`,
                                    transition: 'border-color 0.15s',
                                  }}>
                                    <VegDot isVeg={item.isVeg} />
                                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'hsl(0 0% 16%)', lineHeight: 1.3 }}>
                                      {item.name}
                                    </span>
                                    {item.isSwappable && (
                                      <button
                                        onClick={() => openSwap(swapKey, rule.category.id, displayedIds)}
                                        style={{
                                          display: 'inline-flex', alignItems: 'center', gap: 4,
                                          fontSize: 11, fontWeight: 700,
                                          color: isSwapOpen ? '#fff' : 'hsl(352 59% 30%)',
                                          background: isSwapOpen ? 'hsl(352 59% 30%)' : 'transparent',
                                          border: '1px solid hsl(352 59% 60%)',
                                          borderRadius: 6, padding: '3px 8px',
                                          cursor: 'pointer', flexShrink: 0,
                                        }}
                                      >
                                        <ArrowLeftRight style={{ width: 10, height: 10 }} />
                                        Swap
                                      </button>
                                    )}
                                  </div>

                                  {isSwapOpen && (
                                    <div style={{
                                      marginTop: 3,
                                      background: '#fff',
                                      border: '1px solid hsl(352 59% 80%)',
                                      borderRadius: 8, padding: '8px',
                                      boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
                                    }}>
                                      <div style={{
                                        fontSize: 11, fontWeight: 700, color: 'hsl(0 0% 44%)',
                                        marginBottom: 6, padding: '0 4px',
                                      }}>
                                        Swap with:
                                      </div>
                                      {swapLoading ? (
                                        <div style={{ fontSize: 12, color: 'hsl(0 0% 52%)', padding: '6px 4px' }}>Loading…</div>
                                      ) : alternatives.length === 0 ? (
                                        <div style={{ fontSize: 12, color: 'hsl(0 0% 52%)', padding: '6px 4px' }}>No other options available</div>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                          {alternatives.map((alt) => (
                                            <button
                                              key={alt.id}
                                              onClick={() => handleSwap(apiPkg!.id, rule.id, idx, alt)}
                                              style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '7px 10px', borderRadius: 6, width: '100%',
                                                border: 'none', background: 'transparent',
                                                cursor: 'pointer', textAlign: 'left',
                                              }}
                                              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(352 59% 97%)')}
                                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                              <VegDot isVeg={alt.isVeg} />
                                              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'hsl(0 0% 18%)' }}>
                                                {alt.name}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })}
                        </div>

                        {/* Footer: pricing + choose CTA */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          flexWrap: 'wrap', gap: 10,
                          marginTop: 16, paddingTop: 14,
                          borderTop: '1px solid hsl(35 22% 88%)',
                        }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'hsl(0 0% 48%)', fontWeight: 600 }}>Starting from</div>
                            <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 800, fontSize: 18, color: 'hsl(352 59% 30%)' }}>
                              ₹{config.basePricePerPlate}
                              <span style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'hsl(0 0% 48%)' }}> /person</span>
                            </div>
                          </div>
                          <Link
                            href={`/packages/${config.packageId}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: 'hsl(352 59% 30%)', color: '#fff',
                              borderRadius: 8, padding: '9px 16px',
                              fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 13,
                              textDecoration: 'none',
                            }}
                          >
                            Choose Package
                            <ArrowRight style={{ width: 13, height: 13 }} />
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: 'hsl(0 0% 48%)', fontSize: 14 }}>
                        Details unavailable.{' '}
                        <Link href={pkg.href} style={{ color: 'hsl(352 59% 30%)', fontWeight: 700 }}>
                          View package →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
