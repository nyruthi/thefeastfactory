import { Clock, MessageCircle, ShieldCheck, Users } from 'lucide-react';

const pillars = [
  { Icon: Users, label: 'Minimum 10 Guests', sub: 'Per order' },
  { Icon: Clock, label: '48-Hour Lead Time', sub: 'For all orders' },
  { Icon: ShieldCheck, label: 'Transparent Pricing', sub: 'No hidden charges' },
  { Icon: MessageCircle, label: 'Dedicated Support', sub: "We're here to help" },
];

export function TrustIndicators() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-border text-muted-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
