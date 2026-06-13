'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { apiRequest } from '../../lib/api';
import { useOrderBuilderStore } from '../../store/order-builder.store';
import { useSessionStore } from '../../store/session.store';

export default function CheckoutPage() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const eventId = useOrderBuilderStore((s) => s.eventId);
  const selectedItems = useOrderBuilderStore((s) => s.selectedItems);
  const reset = useOrderBuilderStore((s) => s.reset);
  const [quote, setQuote] = useState<any>();
  const [error, setError] = useState('');
  useEffect(() => { if (session && eventId) apiRequest('/orders/quote', { method: 'POST', body: JSON.stringify({ eventId, selectedItems }) }, session.accessToken).then(setQuote).catch((e) => setError(e.message)); }, [session, eventId, selectedItems]);
  async function pay() {
    try {
      const order = await apiRequest<any>('/orders', { method: 'POST', body: JSON.stringify({ eventId, selectedItems }) }, session!.accessToken);
      const gateway = await apiRequest<any>(`/orders/${order.id}/payments/razorpay-order`, { method: 'POST' }, session!.accessToken);
      if (gateway.localMode) {
        await apiRequest('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify({ razorpayOrderId: gateway.id, razorpayPaymentId: `local_payment_${Date.now()}`, razorpaySignature: 'local_success' }) }, session!.accessToken);
        reset(); router.push(`/payment/status?orderId=${order.id}&status=success`);
      }
    } catch (e) { setError((e as Error).message); }
  }
  return <main className="mx-auto max-w-3xl px-5 py-12">{quote ? <><h1 className="text-3xl font-semibold">Order summary</h1><div className="mt-8 divide-y rounded-md border bg-white">{quote.items.map((i: any) => <div key={i.menuItemId} className="flex justify-between p-4"><span>{i.menuItemName}</span><span>{Number(i.adjustmentAmount) ? `+₹${i.adjustmentAmount}` : 'Included'}</span></div>)}</div><dl className="mt-6 grid grid-cols-2 gap-3 text-sm"><dt>Base per plate</dt><dd className="text-right">₹{quote.basePerPlatePrice}</dd><dt>Customization</dt><dd className="text-right">₹{quote.totalCustomizationCharges}</dd><dt className="font-semibold">Total for {quote.guestCount} guests</dt><dd className="text-right text-xl font-semibold">₹{quote.totalAmount}</dd></dl>{error && <p className="mt-4 text-red-600">{error}</p>}<Button className="mt-8 w-full" onClick={pay}>Pay and confirm</Button></> : <p>{error || 'Calculating trusted quote...'}</p>}</main>;
}
