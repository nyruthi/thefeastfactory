import Link from 'next/link';
import {
  Briefcase,
  CalendarDays,
  ChefHat,
  Clock,
  CreditCard,
  Home,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';

/* ─── data ─────────────────────────────────────────────────────────── */

const ORDER_TYPES = [
  {
    Icon: Package,
    iconBg: 'hsl(352 59% 30%)',
    btnBg: 'hsl(352 59% 30%)',
    cardBg: 'linear-gradient(135deg, hsl(352 40% 96%), hsl(352 40% 92%))',
    title: 'Meal Boxes',
    desc: 'One box per person with 3, 5 or 8 items.',
    cta: 'Explore Meal Boxes',
    href: '/packages/meal-boxes',
    img: '/order-mealbox.png',
  },
  {
    Icon: CalendarDays,
    iconBg: 'hsl(41 56% 48%)',
    btnBg: 'hsl(41 56% 48%)',
    cardBg: 'linear-gradient(135deg, hsl(41 50% 96%), hsl(41 45% 90%))',
    title: 'Occasion Packages',
    desc: 'Pre-designed menus for every occasion.',
    cta: 'View Occasion Packages',
    href: '/packages',
    img: '/order-occasion.png',
  },
  {
    Icon: ChefHat,
    iconBg: 'hsl(80 30% 38%)',
    btnBg: 'hsl(80 30% 38%)',
    cardBg: 'linear-gradient(135deg, hsl(80 25% 95%), hsl(80 22% 90%))',
    title: 'Build Your Own Menu',
    desc: 'Pick your favourite dishes and create your own menu.',
    cta: 'Build Your Menu',
    href: '/menu',
    img: '/order-build.png',
  },
];

const PACKAGES = [
  {
    tag: 'Most Popular' as string | null,
    Icon: Home,
    iconColor: '#7A1F2B',
    title: 'Farm House Celebration',
    serves: 'Serves 20 – 200 people',
    price: 599,
    href: '/packages',
    img: '/pkg-farmhouse.png',
  },
  {
    tag: null as string | null,
    Icon: Sparkles,
    iconColor: '#C89B3C',
    title: 'Puja Package',
    serves: 'Serves 20 – 500 people',
    price: 499,
    href: '/packages',
    img: '/pkg-puja.png',
  },
  {
    tag: null as string | null,
    Icon: Users,
    iconColor: '#4A6DA7',
    title: 'Community Gathering',
    serves: 'Serves 50 – 1,000 people',
    price: 449,
    href: '/packages',
    img: '/pkg-community.png',
  },
  {
    tag: null as string | null,
    Icon: Briefcase,
    iconColor: '#3A3A3A',
    title: 'Corporate Party',
    serves: 'Serves 20 – 1,000 people',
    price: 649,
    href: '/packages',
    img: '/pkg-corporate.png',
  },
];

const TRUST_ITEMS = [
  { Icon: Users,         title: 'Minimum 10 Guests',  desc: 'Per order' },
  { Icon: Clock,         title: '48-Hour Lead Time',   desc: 'For all orders' },
  { Icon: CreditCard,    title: 'Transparent Pricing', desc: 'No hidden charges' },
  { Icon: MessageCircle, title: 'Dedicated Support',   desc: "We're here to help" },
];

/* ─── page ──────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main style={{ background: '#FAF8F5' }}>
      <style>{`
        .hero-section { background: hsl(352 59% 18%); overflow: hidden; }
        .hero-inner {
          max-width: 1280px; margin: 0 auto; padding: 56px 32px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 36px;
          align-items: center; min-height: 320px;
        }
        .hero-heading { font-size: 58px; font-weight: 800; line-height: 1.05; letter-spacing: -0.04em; color: #fff; margin: 0 0 18px; }
        .hero-subtext { font-size: 18px; line-height: 1.5; color: hsl(0 0% 90%); margin: 0 0 28px; max-width: 440px; }
        .hero-image img { width: 100%; height: auto; display: block; border-radius: 14px; box-shadow: 0 18px 44px rgba(0,0,0,0.3); }
        .home-section { max-width: 1280px; margin: 0 auto; padding: 56px 32px; }
        .section-title-row { display: flex; align-items: center; justify-content: center; gap: 18px; margin-bottom: 36px; }
        .section-title { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: hsl(0 0% 12%); margin: 0; white-space: nowrap; }
        .order-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .pkg-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
        .trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 900px) {
          .order-grid { grid-template-columns: 1fr; }
          .pkg-grid { grid-template-columns: repeat(2, 1fr); }
          .trust-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hero-inner { grid-template-columns: 1fr; padding: 40px 20px 48px; min-height: 0; }
          .hero-image { display: none; }
          .hero-heading { font-size: 38px !important; letter-spacing: -0.03em !important; margin-bottom: 14px !important; }
          .hero-subtext { font-size: 15px !important; margin-bottom: 20px !important; }
          .home-section { padding: 40px 16px; }
          .section-title { font-size: 22px !important; white-space: normal !important; text-align: center; }
          .section-title-row { gap: 12px; }
        }
        @media (max-width: 480px) {
          .pkg-grid { grid-template-columns: 1fr; }
          .trust-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-heading { font-size: 32px !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════
          SECTION 1 · HERO
      ════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-inner">

          {/* Left — text + trust badges */}
          <div>
            <h1 className="hero-heading">
              Premium food for<br />
              every <span style={{ color: 'hsl(41 56% 56%)' }}>occasion</span>.
            </h1>
            <p className="hero-subtext">
              Bulk catering for 20 to 1,000 people. Corporate lunches, parties, celebrations &amp; more.
            </p>

            {/* Trust badges — square icons, no pill container */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { Icon: Users,       top: '20 – 1,000', bottom: 'People' },
                { Icon: ShieldCheck, top: 'On-time',    bottom: 'Delivery' },
                { Icon: Truck,       top: 'Hygienic',   bottom: '& Safe' },
              ].map(({ Icon, top, bottom }) => (
                <div key={top} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: 'hsl(352 59% 30%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon style={{ width: 22, height: 22, color: '#fff' }} />
                  </div>
                  <div style={{ lineHeight: 1.15 }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: 16 }}>{top}</div>
                    <div style={{ color: 'hsl(0 0% 78%)', fontSize: 14 }}>{bottom}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — photo (hidden on mobile) */}
          <div className="hero-image">
            <img src="/Hero.png" alt="Bulk catering trays with custom menu options" />
          </div>

        </div>
      </section>


      {/* ════════════════════════════════════════
          SECTION 2 · ORDERING OPTIONS
      ════════════════════════════════════════ */}
      <section className="home-section">

        <div className="section-title-row">
          <div style={{ width: 64, height: 1.5, background: '#C89B3C', opacity: 0.55, borderRadius: 2 }} />
          <h2 className="section-title">
            Choose how you want to order
          </h2>
          <div style={{ width: 64, height: 1.5, background: '#C89B3C', opacity: 0.55, borderRadius: 2 }} />
        </div>

        <div className="order-grid">
          {ORDER_TYPES.map(({ Icon, iconBg, btnBg, cardBg, title, desc, cta, href, img }) => (
            <div
              key={title}
              className="hover:-translate-y-1 hover:shadow-lg transition-all duration-[250ms]"
              style={{
                display: 'flex',
                background: cardBg,
                border: '1px solid hsl(35 22% 88%)',
                borderRadius: 16, overflow: 'hidden',
              }}
            >
              {/* Left: text content */}
              <div style={{ padding: '26px 4px 26px 26px', flex: '1.1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <Icon style={{ width: 22, height: 22, color: '#fff' }} />
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: 'hsl(0 0% 12%)', margin: '0 0 8px' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'hsl(0 0% 38%)', lineHeight: 1.45, margin: 0 }}>{desc}</p>
                </div>
                <Link href={href} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                  background: btnBg, color: '#fff',
                  borderRadius: 999, padding: '11px 18px',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  marginTop: 20,
                }}>
                  {cta} →
                </Link>
              </div>

              {/* Right: food photo */}
              <div style={{ flex: '0.9', overflow: 'hidden', minHeight: 220, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </div>
          ))}
        </div>
      </section>


      {/* ════════════════════════════════════════
          SECTION 3 · POPULAR OCCASION PACKAGES
      ════════════════════════════════════════ */}
      <section className="home-section" style={{ paddingTop: 0 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1B1B1B', margin: 0 }}>
            Popular Occasion Packages
          </h2>
          <Link href="/packages" style={{ fontSize: 14, fontWeight: 700, color: '#7A1F2B', textDecoration: 'none' }}>
            View all packages →
          </Link>
        </div>

        <div className="pkg-grid">
          {PACKAGES.map(({ tag, Icon, iconColor, title, serves, price, href, img }) => (
            <div key={title} style={{
              background: '#fff', borderRadius: 18,
              overflow: 'hidden',
              border: '1px solid #E7E1D9',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              height: 340, display: 'flex', flexDirection: 'column',
            }}>
              {/* Image */}
              <div style={{ position: 'relative', height: 180, overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={img} alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {tag && (
                  <span style={{
                    position: 'absolute', top: 12, left: 12,
                    background: '#7A1F2B', color: '#fff',
                    fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    padding: '4px 10px', borderRadius: 999,
                  }}>
                    {tag}
                  </span>
                )}
                {/* Icon circle at image / content boundary */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 16,
                  transform: 'translateY(50%)',
                  width: 40, height: 40, borderRadius: 999,
                  background: '#fff', border: '2px solid #E7E1D9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                }}>
                  <Icon style={{ width: 18, height: 18, color: iconColor }} />
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '28px 16px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B1B1B', margin: '0 0 4px' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{serves}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: '#7A1F2B' }}>
                      ₹{price}
                    </span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>/ person</span>
                  </div>
                  <Link href={href} style={{ fontSize: 12, fontWeight: 700, color: '#7A1F2B', textDecoration: 'none' }}>
                    View details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ════════════════════════════════════════
          SECTION 4 · TRUST STRIP
      ════════════════════════════════════════ */}
      <section className="home-section" style={{ paddingTop: 0, paddingBottom: 72 }}>
        <div style={{
          background: 'linear-gradient(180deg, hsl(41 45% 95%), hsl(39 44% 97%))',
          border: '1px solid hsl(35 22% 88%)',
          borderRadius: 16, padding: '22px 12px',
        }} className="trust-grid">
          {TRUST_ITEMS.map(({ Icon, title, desc }, i) => (
            <div key={title} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '8px 24px',
              borderLeft: i === 0 ? 'none' : '1px solid hsl(35 22% 86%)',
            }}>
              <div style={{ color: 'hsl(352 59% 30%)', flexShrink: 0 }}>
                <Icon style={{ width: 20, height: 20 }} />
              </div>
              <div style={{ lineHeight: 1.25 }}>
                <p style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: 'hsl(0 0% 15%)', margin: 0 }}>{title}</p>
                <p style={{ fontSize: 13, color: 'hsl(0 0% 48%)', margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
