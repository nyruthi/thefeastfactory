'use client';

import { CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OrderProgress } from '../../components/order-progress';
import { Button } from '../../components/ui/button';
import { AuthRequiredPanel, StatePanel } from '../../components/ui/state-panel';
import { apiRequest } from '../../lib/api';
import { useOrderBuilderStore } from '../../store/order-builder.store';
import { useSessionStore } from '../../store/session.store';
import { cn } from '../../lib/utils';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const event = useOrderBuilderStore((state) => state.event);
  const cartPackage = useOrderBuilderStore((state) => state.package);
  const selectedItems = useOrderBuilderStore((state) => state.selectedItems);
  const reset = useOrderBuilderStore((state) => state.reset);
  const [quote, setQuote] = useState<any>();
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  const payloadItems = selectedItems.map(({ categoryId, menuItemId }) => ({ categoryId, menuItemId }));

  useEffect(() => {
    if (!session || !event?.eventId || !selectedItems.length) return;
    setError('');
    apiRequest(
      '/orders/quote',
      { method: 'POST', body: JSON.stringify({ eventId: event.eventId, selectedItems: payloadItems }) },
      session.accessToken,
    )
      .then(setQuote)
      .catch((reason) => setError(reason.message));
  }, [session, event?.eventId, selectedItems]);

  async function verifyPayment(orderId: string, response: Record<string, string>) {
    await apiRequest(
      '/payments/razorpay/verify',
      {
        method: 'POST',
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      },
      session!.accessToken,
    );
    reset();
    router.push(`/payment/status?orderId=${orderId}&status=success`);
  }

  async function pay() {
    if (!session || !event) return;
    setError('');
    setPaying(true);
    try {
      const order = await apiRequest<any>(
        '/orders',
        { method: 'POST', body: JSON.stringify({ eventId: event.eventId, selectedItems: payloadItems }) },
        session.accessToken,
      );
      const gateway = await apiRequest<any>(
        `/orders/${order.id}/payments/razorpay-order`,
        { method: 'POST' },
        session.accessToken,
      );

      if (gateway.localMode) {
        await verifyPayment(order.id, {
          razorpay_order_id: gateway.id,
          razorpay_payment_id: `local_payment_${Date.now()}`,
          razorpay_signature: 'local_success',
        });
        return;
      }

      if (!window.Razorpay) throw new Error('Secure payment window is still loading. Please try again.');
      const checkout = new window.Razorpay({
        key: gateway.keyId,
        amount: gateway.amount,
        currency: gateway.currency,
        name: 'The Feast Factory',
        description: `${cartPackage?.packageName ?? 'Catering'} for ${quote.guestCount} guests`,
        order_id: gateway.id,
        prefill: {
          name: session.user.name ?? '',
          email: session.user.email ?? '',
          contact: session.user.mobileNumber,
        },
        theme: { color: '#7A1F2B' },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setError('Payment window closed. Your order is still saved and you can retry safely.');
            setPaying(false);
          },
        },
        handler: async (response: Record<string, string>) => {
          try {
            await verifyPayment(order.id, response);
          } catch (reason) {
            setError((reason as Error).message);
            setPaying(false);
          }
        },
      });
      checkout.on('payment.failed', (response) => {
        setError(response?.error?.description || 'Payment failed. You can retry without creating another order.');
        setPaying(false);
      });
      checkout.open();
    } catch (reason) {
      setError((reason as Error).message);
      setPaying(false);
    }
  }

  if (!session) {
    return (
      <AuthRequiredPanel
        title="Sign in to place your order"
        description="Your cart is saved on this device. Sign in to attach the order to your mobile number and unlock secure payment."
        returnHref="/checkout"
      />
    );
  }

  if (!event || !cartPackage || !selectedItems.length) {
    return (
      <main className="page-shell">
        <StatePanel
          icon={CheckCircle2}
          eyebrow="Checkout checklist"
          title="Your order needs a little more detail"
          description="Complete the package, event details, and menu selection before opening secure payment."
          actionHref="/cart"
          actionLabel="Return to cart"
          secondaryHref="/packages"
          secondaryLabel="Browse packages"
        />
      </main>
    );
  }

  return (
    <main className="pb-28">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* ── Header ── */}
      <div className="bg-primary">
        <div className="container-pad py-8">
          <div className="mb-6">
            <OrderProgress current={3} />
          </div>
          <p className="eyebrow text-accent">Secure checkout</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">One final review.</h1>
          <p className="mt-2 text-sm text-white/70">
            {cartPackage.isCustom
              ? 'Your quote is calculated from selected item prices and saved as an order snapshot.'
              : 'Your quote is calculated from the live package rules and saved as an order snapshot.'}
          </p>
        </div>
      </div>

      <div className="container-pad py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── Order summary ── */}
          <section>
            {quote ? (
              <div className="surface-card overflow-hidden">
                <div className="border-b border-border bg-muted/40 px-6 py-5">
                  <h2 className="text-xl font-extrabold">{quote.packageName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {quote.guestCount} guests · {event.addressLabel}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {quote.items.map((item: any) => (
                    <div key={item.menuItemId} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div>
                        <p className="font-semibold">{item.menuItemName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.categoryName}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {cartPackage.isCustom
                          ? `₹${item.itemPrice}`
                          : Number(item.adjustmentAmount) ? `+₹${item.adjustmentAmount}` : 'Included'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-80 animate-pulse rounded-2xl bg-muted" />
            )}
          </section>

          {/* ── Payment sidebar ── */}
          <aside>
            <div className="surface-card p-6 lg:sticky lg:top-24">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Payment summary</p>
              {quote && (
                <>
                  <div className="mt-5 space-y-3 text-sm">
                    {!cartPackage.isCustom && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base per plate</span>
                        <span>₹{quote.basePerPlatePrice}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {cartPackage.isCustom ? 'Selected item total per plate' : 'Premium additions'}
                      </span>
                      <span>₹{quote.totalCustomizationCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Final per plate</span>
                      <span>₹{quote.finalPerPlatePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Menu subtotal</span>
                      <span>₹{quote.subtotalAmount}</span>
                    </div>
                    <div className="surface-inset p-3">
                      <div className="flex justify-between font-semibold">
                        <span>Delivery fee</span>
                        <span>₹{quote.deliveryFee}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {quote.region?.name} kitchen · {quote.distanceKm} km · billed {quote.billableDistanceKm} km at ₹{quote.deliveryFeePerKm}/km
                      </p>
                    </div>
                  </div>

                  <div className="my-5 h-px bg-border" />

                  <div className="flex items-end justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-4xl font-extrabold text-primary">₹{quote.totalAmount}</span>
                  </div>

                  <Button className="mt-6 w-full rounded-full" onClick={pay} disabled={paying}>
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    {paying ? 'Opening payment…' : 'Pay securely'}
                  </Button>
                </>
              )}

              {error && (
                <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 font-semibold">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Payment details handled securely by Razorpay.
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Your order is confirmed only after payment verification.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
