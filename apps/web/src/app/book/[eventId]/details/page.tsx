"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo } from "react";

import { useBookingJourney } from "@/components/booking/BookingJourneyProvider";
import { BookingJourneyShell } from "@/components/booking/BookingJourneyShell";

export default function CustomerDetailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const {
    selectedDateKey,
    selectedSessionId,
    totalTicketQuantity,
    rulePreview,
    selectedProducts,
    customerData,
    updateCustomer,
  } = useBookingJourney();

  const requiredProductsSatisfied = useMemo(
    () => (rulePreview?.requiredProducts ?? []).every((requiredProduct) =>
      selectedProducts.some((product) =>
        product.slug === requiredProduct.productSlug &&
        product.quantity >= requiredProduct.quantity,
      ),
    ),
    [rulePreview, selectedProducts],
  );

  useEffect(() => {
    if (!selectedSessionId || totalTicketQuantity === 0 || !rulePreview?.valid || !requiredProductsSatisfied) {
      router.replace(`/book/${eventId}/${selectedSessionId ? "addons" : selectedDateKey ? "session" : "date"}`);
    }
  }, [eventId, requiredProductsSatisfied, router, rulePreview, selectedDateKey, selectedSessionId, totalTicketQuantity]);

  const complete = Boolean(
    customerData.firstName.trim() &&
    customerData.lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email.trim()),
  );

  if (!selectedSessionId || !rulePreview?.valid) return null;

  return (
    <BookingJourneyShell>
      <section className="mx-auto mt-5 max-w-3xl rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Step 6 of 9</p>
        <h1 className="mt-3 text-3xl font-bold">Your details</h1>
        <p className="mt-2 text-slate-600">We’ll use these details for the booking confirmation and important Event updates.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2"><span className="text-sm font-semibold">First name</span><input required autoComplete="given-name" value={customerData.firstName} onChange={(event) => updateCustomer("firstName", event.target.value)} className="h-11 rounded-xl border px-3" /></label>
          <label className="grid gap-2"><span className="text-sm font-semibold">Last name</span><input required autoComplete="family-name" value={customerData.lastName} onChange={(event) => updateCustomer("lastName", event.target.value)} className="h-11 rounded-xl border px-3" /></label>
          <label className="grid gap-2"><span className="text-sm font-semibold">Email</span><input required type="email" autoComplete="email" value={customerData.email} onChange={(event) => updateCustomer("email", event.target.value)} className="h-11 rounded-xl border px-3" /></label>
          <label className="grid gap-2"><span className="text-sm font-semibold">Phone <span className="font-normal text-slate-500">(optional)</span></span><input type="tel" autoComplete="tel" value={customerData.phone} onChange={(event) => updateCustomer("phone", event.target.value)} className="h-11 rounded-xl border px-3" /></label>
        </div>
        <div className="mt-8 flex justify-between border-t pt-6">
          <button type="button" onClick={() => router.push(`/book/${eventId}/addons`)} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold"><ArrowLeft className="size-4" /> Back</button>
          <button type="button" disabled={!complete} onClick={() => router.push(`/book/${eventId}/review`)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Review booking <ArrowRight className="size-4" /></button>
        </div>
      </section>
    </BookingJourneyShell>
  );
}
