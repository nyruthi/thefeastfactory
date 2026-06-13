import { CalendarDays, ClipboardList, IndianRupee, Utensils } from 'lucide-react';
import { Button } from '../components/ui/button';

const steps = [
  { label: 'Plan event', icon: CalendarDays },
  { label: 'Choose package', icon: ClipboardList },
  { label: 'Customize menu', icon: Utensils },
  { label: 'Pay online', icon: IndianRupee },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 py-10">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Aranyam Catering</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
            Event catering orders, from package selection to payment.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            A mobile-first ordering flow for events, package menus, customization charges, and order tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button>Start order</Button>
            <Button variant="secondary">View packages</Button>
          </div>
        </div>
        <div className="mt-12 grid gap-3 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.label} className="rounded-md border bg-white p-4 shadow-sm">
              <step.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">{step.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
