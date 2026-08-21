"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo } from "react";

import { AddOnsStep } from "@/components/booking/AddOnsStep";
import { useBookingJourney } from "@/components/booking/BookingJourneyProvider";
import { BookingJourneyShell } from "@/components/booking/BookingJourneyShell";

export default function AddOnsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const {
    selectedSessionId,
    totalTicketQuantity,
    rulePreview,
    selectedProducts,
    updateSelectedProducts,
  } = useBookingJourney();

  useEffect(() => {
    if (!selectedSessionId || totalTicketQuantity === 0 || !rulePreview?.valid) {
      router.replace(`/book/${eventId}/${selectedSessionId ? "participants" : "session"}`);
    }
  }, [eventId, router, rulePreview, selectedSessionId, totalTicketQuantity]);

  const requiredProducts = rulePreview?.requiredProducts ?? [];
  const requiredProductsSatisfied = useMemo(
    () => requiredProducts.every((requiredProduct) =>
      selectedProducts.some((product) =>
        product.slug === requiredProduct.productSlug &&
        product.quantity >= requiredProduct.quantity,
      ),
    ),
    [requiredProducts, selectedProducts],
  );

  if (!selectedSessionId || !rulePreview?.valid) return null;

  return (
    <BookingJourneyShell>
      <div className="mx-auto mt-5 max-w-3xl">
        <AddOnsStep
          sessionId={selectedSessionId}
          requiredProducts={requiredProducts}
          initialProducts={selectedProducts}
          onChange={updateSelectedProducts}
        />
        <section className="mt-5 rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
          <div className="flex justify-end">
            <div className="flex gap-3">
              <button type="button" onClick={() => router.push(`/book/${eventId}/participants`)} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold"><ArrowLeft className="size-4" /> Back</button>
              <button type="button" disabled={!requiredProductsSatisfied} onClick={() => router.push(`/book/${eventId}/details`)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Continue <ArrowRight className="size-4" /></button>
            </div>
          </div>
        </section>
      </div>
    </BookingJourneyShell>
  );
}
