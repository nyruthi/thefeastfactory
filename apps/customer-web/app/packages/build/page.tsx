'use client';

import { ArrowRight, Minus, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '../../../lib/utils';

/* ─── Dish catalogue (matches design canvas data) ─── */
const DISHES = [
  { id: 'vs1', name: 'Crispy Corn',          price: 180, veg: true,  cat: 'veg-starters' },
  { id: 'vs2', name: 'Paneer Tikka',         price: 220, veg: true,  cat: 'veg-starters' },
  { id: 'vs3', name: 'Veg Manchurian',       price: 190, veg: true,  cat: 'veg-starters' },
  { id: 'vs4', name: 'Hara Bhara Kebab',     price: 210, veg: true,  cat: 'veg-starters' },
  { id: 'vs5', name: 'Cheesy Corn Balls',    price: 200, veg: true,  cat: 'veg-starters' },
  { id: 'nv1', name: 'Chicken Tikka',        price: 260, veg: false, cat: 'non-veg-starters' },
  { id: 'nv2', name: 'Chilli Chicken',       price: 240, veg: false, cat: 'non-veg-starters' },
  { id: 'nv3', name: 'Fish Amritsari',       price: 290, veg: false, cat: 'non-veg-starters' },
  { id: 'nv4', name: 'Mutton Seekh Kebab',   price: 320, veg: false, cat: 'non-veg-starters' },
  { id: 'mc1', name: 'Paneer Butter Masala', price: 250, veg: true,  cat: 'main-course' },
  { id: 'mc2', name: 'Dal Makhani',          price: 200, veg: true,  cat: 'main-course' },
  { id: 'mc3', name: 'Veg Kofta Curry',      price: 230, veg: true,  cat: 'main-course' },
  { id: 'mc4', name: 'Chicken Curry',        price: 280, veg: false, cat: 'main-course' },
  { id: 'mc5', name: 'Mutton Rogan Josh',    price: 340, veg: false, cat: 'main-course' },
  { id: 'rb1', name: 'Jeera Rice',           price: 120, veg: true,  cat: 'rice-bread' },
  { id: 'rb2', name: 'Veg Biryani',          price: 220, veg: true,  cat: 'rice-bread' },
  { id: 'rb3', name: 'Steamed Rice',         price: 110, veg: true,  cat: 'rice-bread' },
  { id: 'rb4', name: 'Butter Naan',          price:  40, veg: true,  cat: 'rice-bread' },
  { id: 'rb5', name: 'Tandoori Roti',        price:  25, veg: true,  cat: 'rice-bread' },
  { id: 'ds1', name: 'Gulab Jamun',          price: 120, veg: true,  cat: 'dessert' },
  { id: 'ds2', name: 'Rasmalai',             price: 150, veg: true,  cat: 'dessert' },
  { id: 'ds3', name: 'Gajar Halwa',          price: 140, veg: true,  cat: 'dessert' },
  { id: 'ds4', name: 'Vanilla Ice Cream',    price: 100, veg: true,  cat: 'dessert' },
  { id: 'bv1', name: 'Fresh Lime Juice',     price:  60, veg: true,  cat: 'beverage' },
  { id: 'bv2', name: 'Masala Chaas',         price:  50, veg: true,  cat: 'beverage' },
  { id: 'bv3', name: 'Soft Drinks',          price:  40, veg: true,  cat: 'beverage' },
  { id: 'bv4', name: 'Mango Lassi',          price:  80, veg: true,  cat: 'beverage' },
] as const;

type DishId = typeof DISHES[number]['id'];

const DISH_MAP = Object.fromEntries(DISHES.map((d) => [d.id, d])) as Record<DishId, typeof DISHES[number]>;

const CATS = [
  { id: 'veg-starters',     label: 'Veg Starters' },
  { id: 'non-veg-starters', label: 'Non-Veg Starters' },
  { id: 'main-course',      label: 'Main Course' },
  { id: 'rice-bread',       label: 'Rice & Bread' },
  { id: 'dessert',          label: 'Dessert' },
  { id: 'beverage',         label: 'Beverage' },
] as const;

/* ─── Veg dot indicator ─── */
function VegDot({ veg }: { veg: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex', width: 13, height: 13, flexShrink: 0,
        border: `1.5px solid ${veg ? 'hsl(140 50% 38%)' : 'hsl(352 70% 45%)'}`,
        borderRadius: 3, alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: veg ? 'hsl(140 50% 38%)' : 'hsl(352 70% 45%)' }} />
    </span>
  );
}

/* ─── Oval table canvas ─── */
function BanquetTable({ order }: { order: DishId[] }) {
  const slots = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const a = (-90 + i * 30) * Math.PI / 180;
      const x = 50 + 40 * Math.cos(a);
      const y = 50 + 31 * Math.sin(a);
      const sc = 0.82 + ((Math.sin(a) + 1) / 2) * 0.42;
      const z  = 10 + Math.round((Math.sin(a) + 1) * 9);
      return { x, y, sc, z };
    });
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 400 }}>
      {/* oval table surface */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '72%', height: '62%', borderRadius: '50%',
        background: 'radial-gradient(ellipse at 50% 32%, hsl(33 40% 64%), hsl(30 42% 48%) 58%, hsl(27 44% 35%))',
        boxShadow: '0 32px 54px rgba(0,0,0,0.45), inset 0 -12px 34px rgba(0,0,0,0.28), inset 0 8px 22px rgba(255,255,255,0.14)',
        zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.3em', color: 'hsla(28,50%,22%,0.5)', marginBottom: 2 }}>— THE —</div>
          <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 26, letterSpacing: '0.03em', color: 'hsla(28,52%,24%,0.62)', textShadow: '0 1px 0 hsla(40,60%,82%,0.45)' }}>FEAST FACTORY</div>
          <div style={{ fontSize: 9, letterSpacing: '0.28em', fontWeight: 700, color: 'hsla(28,50%,22%,0.5)', marginTop: 4 }}>GREAT FOOD · LASTING IMPRESSIONS</div>
        </div>
      </div>

      {/* 12 chafing dish slots */}
      {slots.map((slot, i) => {
        const id = order[i];
        const dish = id ? DISH_MAP[id] : null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${slot.x}%`, top: `${slot.y}%`,
              width: 116, height: 90,
              transform: `translate(-50%,-50%) scale(${slot.sc})`,
              transformOrigin: 'center center',
              zIndex: slot.z,
            }}
          >
            {/* handles */}
            <span style={{ position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)', width: 13, height: 9, borderRadius: 6, background: 'linear-gradient(180deg,#ecc873,#a9791f)', zIndex: 0 }} />
            <span style={{ position: 'absolute', right: -7, top: '50%', transform: 'translateY(-50%)', width: 13, height: 9, borderRadius: 6, background: 'linear-gradient(180deg,#ecc873,#a9791f)', zIndex: 0 }} />
            {/* chafing dish body */}
            <div style={{ position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(150deg,#efcd7d,#c79433 55%,#9c6f1f)', borderRadius: 11, padding: 6, boxShadow: '0 9px 16px rgba(0,0,0,0.4)', zIndex: 1 }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 7, overflow: 'hidden', background: 'linear-gradient(160deg,#fbfdfe 0%,#d2d8de 42%,#9aa1a9 100%)', boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.55), inset 0 -5px 11px rgba(0,0,0,0.3)' }}>
                {dish ? (
                  <>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('/${dish.cat === 'veg-starters' || dish.cat === 'non-veg-starters' ? 'order-build' : dish.cat === 'rice-bread' ? 'tray-3' : dish.cat === 'dessert' ? 'tray-5' : dish.cat === 'beverage' ? 'tray-8' : 'pkg-farmhouse'}.png')`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)' }} />
                    <div style={{ position: 'absolute', left: '50%', bottom: 7, transform: 'translateX(-50%)', zIndex: 6, background: 'rgba(255,255,255,0.96)', borderRadius: 999, padding: '2px 10px', fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(0 0% 18%)', whiteSpace: 'nowrap', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                      {dish.name}
                    </div>
                  </>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'hsl(0 0% 40%)' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid hsl(0 0% 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus style={{ width: 13, height: 13 }} strokeWidth={2.4} />
                    </span>
                    <span style={{ fontFamily: "'Zilla Slab', serif", fontStyle: 'italic', fontSize: 12, color: 'hsl(0 0% 38%)' }}>Add Item</span>
                  </div>
                )}
              </div>
            </div>
            {/* legs */}
            <span style={{ position: 'absolute', left: '20%', bottom: -5, width: 8, height: 7, borderRadius: '0 0 3px 3px', background: '#a9791f', zIndex: 0 }} />
            <span style={{ position: 'absolute', right: '20%', bottom: -5, width: 8, height: 7, borderRadius: '0 0 3px 3px', background: '#a9791f', zIndex: 0 }} />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Page ─── */
export default function BuildPackagePage() {
  const [cat, setCat]       = useState<string>('veg-starters');
  const [search, setSearch] = useState('');
  const [order, setOrder]   = useState<DishId[]>([]);

  const visible = useMemo(() =>
    DISHES.filter((d) => d.cat === cat && (!search || d.name.toLowerCase().includes(search.toLowerCase()))),
    [cat, search],
  );

  function add(id: DishId) {
    if (order.length >= 12) return;
    if (!order.includes(id)) setOrder((o) => [...o, id]);
  }
  function remove(id: DishId) { setOrder((o) => o.filter((x) => x !== id)); }
  function clear() { setOrder([]); }

  const addedIds = new Set(order);
  const vegCount    = order.filter((id) => DISH_MAP[id]?.veg).length;
  const nonVegCount = order.length - vegCount;
  const subtotal    = order.reduce((s, id) => s + (DISH_MAP[id]?.price ?? 0), 0);

  return (
    <main className="pb-16">

      {/* ── Sub-toolbar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid hsl(35 22% 87%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Event Type', value: 'Wedding' },
              { label: 'Event Date', value: '20 Mar 2025' },
              { label: 'Guests',     value: '150' },
            ].map((item, i) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: i > 0 ? 24 : 0 }}>
                {i > 0 && <span style={{ height: 38, width: 1, background: 'hsl(35 22% 88%)', marginRight: 24 }} />}
                <div>
                  <div style={{ fontSize: 12, color: 'hsl(0 0% 48%)', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 17, color: 'hsl(0 0% 16%)' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ background: '#fff', color: 'hsl(352 59% 30%)', border: '1px solid hsl(352 59% 30%)', borderRadius: 10, padding: '10px 20px', fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              Save Package
            </button>
            <button style={{ background: '#fff', color: 'hsl(41 56% 40%)', border: '1px solid hsl(41 56% 52%)', borderRadius: 10, padding: '10px 20px', fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              View Summary
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'hsl(352 59% 30%)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              Proceed <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 44px', display: 'grid', gridTemplateColumns: '340px 1fr', gap: 28, alignItems: 'start' }}>

        {/* ── LEFT: dish browser ── */}
        <div style={{ background: '#fff', border: '1px solid hsl(35 22% 88%)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 110px)', position: 'sticky', top: 80 }}>

          {/* tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid hsl(35 22% 90%)' }}>
            {['Menu', 'Packages'].map((tab) => (
              <button key={tab} style={{ flex: 1, padding: 14, border: 'none', background: '#fff', cursor: 'pointer', fontFamily: "'Nunito Sans', sans-serif", fontWeight: tab === 'Menu' ? 800 : 600, fontSize: 15, color: tab === 'Menu' ? 'hsl(352 59% 30%)' : 'hsl(0 0% 45%)', borderBottom: tab === 'Menu' ? '2px solid hsl(352 59% 30%)' : '2px solid transparent' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* search */}
          <div style={{ padding: '14px 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'hsl(37 28% 95%)', border: '1px solid hsl(35 22% 88%)', borderRadius: 10, padding: '10px 13px' }}>
              <Search style={{ width: 17, height: 17, color: 'hsl(0 0% 50%)', flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for dishes..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, color: 'hsl(0 0% 20%)', width: '100%' }}
              />
            </div>
          </div>

          {/* category pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px' }}>
            {CATS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                style={{
                  whiteSpace: 'nowrap', cursor: 'pointer',
                  fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: '0.02em',
                  padding: '7px 13px', borderRadius: 999, border: 'none',
                  background: cat === c.id ? 'hsl(352 59% 30%)' : 'hsl(37 28% 93%)',
                  color: cat === c.id ? '#fff' : 'hsl(0 0% 38%)',
                }}
              >
                {c.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* dish list */}
          <div style={{ overflowY: 'auto', padding: '0 8px 8px', flex: 1 }}>
            {visible.map((dish) => {
              const added = addedIds.has(dish.id);
              return (
                <div key={dish.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 8px', borderBottom: '1px solid hsl(35 22% 93%)' }}>
                  {/* thumb */}
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: 'hsl(37 28% 93%)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {dish.veg ? '🥗' : '🍗'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'hsl(0 0% 14%)', lineHeight: 1.2, marginBottom: 5 }}>{dish.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <VegDot veg={dish.veg} />
                      <span style={{ fontSize: 12, color: 'hsl(0 0% 45%)', fontWeight: 600 }}>{dish.veg ? 'Veg' : 'Non-Veg'}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'hsl(0 0% 25%)' }}>₹{dish.price} / Plate</div>
                  </div>
                  <button
                    onClick={() => added ? remove(dish.id) : add(dish.id)}
                    style={{
                      background: added ? 'hsl(352 59% 30%)' : '#fff',
                      color: added ? '#fff' : 'hsl(352 59% 30%)',
                      border: '1px solid hsl(352 59% 30%)',
                      borderRadius: 8, padding: '7px 16px',
                      fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {added ? 'Added ✓' : 'Add'}
                  </button>
                </div>
              );
            })}
            {visible.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'hsl(0 0% 55%)', fontSize: 14 }}>
                No dishes found
              </div>
            )}
          </div>

          {/* footer */}
          <div style={{ borderTop: '1px solid hsl(35 22% 90%)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'hsl(0 0% 45%)' }}>Can't find what you want?</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: 'hsl(41 56% 40%)', border: '1px solid hsl(41 56% 52%)', borderRadius: 9, padding: '8px 14px', fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Plus style={{ width: 14, height: 14 }} /> Request a Dish
            </button>
          </div>
        </div>

        {/* ── RIGHT: build area ── */}
        <div>
          <h2 style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 30, color: 'hsl(0 0% 12%)', margin: '0 0 6px' }}>Build Your Own Package</h2>
          <p style={{ fontSize: 15, color: 'hsl(0 0% 45%)', margin: '0 0 18px' }}>Choose your favourite dishes and customize a menu that fits your occasion.</p>

          {/* banquet table canvas */}
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid hsl(35 22% 86%)', backgroundImage: "linear-gradient(180deg,rgba(40,20,10,0.32),rgba(40,20,10,0.5)),url('/order-occasion.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {order.length > 0 && (
              <button
                onClick={clear}
                style={{ position: 'absolute', top: 14, right: 14, zIndex: 40, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.92)', color: 'hsl(352 59% 32%)', border: 'none', borderRadius: 8, padding: '7px 13px', fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                <Trash2 style={{ width: 14, height: 14 }} /> Clear All
              </button>
            )}
            <BanquetTable order={order} />
          </div>

          {/* summary bar */}
          <div style={{ marginTop: 18, background: '#fff', border: '1px solid hsl(35 22% 88%)', borderRadius: 14, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'ITEMS',         value: order.length,   color: 'hsl(0 0% 14%)' },
                { label: 'VEG ITEMS',     value: vegCount,       color: 'hsl(140 45% 34%)' },
                { label: 'NON-VEG ITEMS', value: nonVegCount,    color: 'hsl(352 59% 38%)' },
              ].map((stat, i) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  {i > 0 && <span style={{ height: 38, width: 1, background: 'hsl(35 22% 88%)' }} />}
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.04em', color: 'hsl(0 0% 48%)', fontWeight: 700 }}>{stat.label}</div>
                    <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 24, color: stat.color }}>{stat.value}</div>
                  </div>
                </div>
              ))}
              <span style={{ height: 38, width: 1, background: 'hsl(35 22% 88%)' }} />
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.04em', color: 'hsl(0 0% 48%)', fontWeight: 700 }}>ESTIMATED COST</div>
                <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 24, color: 'hsl(352 59% 30%)' }}>
                  {subtotal > 0 ? `₹${subtotal.toLocaleString('en-IN')}` : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'hsl(0 0% 55%)' }}>Excluding Taxes</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button style={{ background: '#fff', color: 'hsl(352 59% 30%)', border: '1px solid hsl(352 59% 30%)', borderRadius: 10, padding: '12px 20px', fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                View Summary
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'hsl(352 59% 30%)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 22px', fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                <ShoppingBag style={{ width: 16, height: 16 }} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom features ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 0' }}>
        <div style={{ background: 'linear-gradient(180deg,hsl(41 45% 95%),hsl(39 44% 97%))', border: '1px solid hsl(35 22% 88%)', borderRadius: 16, padding: '24px 10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { title: 'Fully Customizable',   sub: 'Choose any dishes you love' },
            { title: 'Hygienic & Safe',       sub: 'Prepared with premium ingredients' },
            { title: 'On-time Delivery',      sub: 'Punctual delivery for every event' },
            { title: 'Transparent Pricing',   sub: 'No hidden charges, 100% transparent' },
          ].map((f, i) => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 22px', borderLeft: i === 0 ? 'none' : '1px solid hsl(35 22% 88%)' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'hsl(352 40% 94%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'hsl(352 59% 32%)', fontSize: 22 }}>
                {['✦', '🌿', '⏱', '✓'][i]}
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'hsl(0 0% 15%)' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'hsl(0 0% 48%)' }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}
