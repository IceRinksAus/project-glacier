"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FlexibleTicketRequestCustomerPanel } from "@/components/flexible-ticket/FlexibleTicketRequestCustomerPanel";

export default function PublicBookingAccessPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [publicAccessToken, setPublicAccessToken] = useState<string | null>(
    null,
  );
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      "access",
    );
    if (value && /^[a-f0-9]{64}$/.test(value)) {
      setPublicAccessToken(value);
    } else {
      setInvalid(true);
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">
          Glacier secure booking access
        </p>
        <h1 className="mt-2 text-3xl font-bold">Manage your booking</h1>
        <p className="mt-3 text-slate-600">
          This private link provides access to your Flexible Ticket requests. Do
          not share it publicly.
        </p>
        {invalid ? (
          <p role="alert" className="mt-8 rounded-2xl border bg-white p-6">
            This secure booking link is incomplete or invalid. Use the original
            confirmation link or contact the Event organiser.
          </p>
        ) : null}
        {publicAccessToken ? (
          <FlexibleTicketRequestCustomerPanel
            bookingId={bookingId}
            publicAccessToken={publicAccessToken}
          />
        ) : null}
      </div>
    </main>
  );
}
