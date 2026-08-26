"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { eventService, GlacierEvent } from "@/services/event.service";
import { RetailSaleSearchResult, posService } from "@/services/pos.service";

function money(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

export default function RetailSalesPage() {
  const [events, setEvents] = useState<GlacierEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<RetailSaleSearchResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    eventService
      .getEvents()
      .then((items) =>
        setEvents(items.filter(({ status }) => status === "ACTIVE")),
      )
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load Events.",
        ),
      );
  }, []);

  async function loadSales() {
    if (!eventId) return;
    setError("");
    try {
      setResult(await posService.searchRetailSales(eventId, search));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to load Sales.",
      );
    }
  }

  return (
    <PlatformShell>
      <div className="space-y-6">
        <header>
          <Link href="/pos" className="text-sm text-primary hover:underline">
            ← Back to POS
          </Link>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Payment investigation
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Merchandise Sales</h1>
          <p className="mt-2 text-muted-foreground">
            Find counter Sales without mixing them into admission Bookings.
          </p>
        </header>
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <section className="grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm font-medium">
            Event
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={eventId}
              onChange={(event) => {
                setEventId(event.target.value);
                setResult(null);
              }}
            >
              <option value="">Choose an Event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Sale number
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="RS-…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <Button className="self-end" disabled={!eventId} onClick={loadSales}>
            Search
          </Button>
        </section>
        {result ? (
          <section className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="p-4">Sale</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Operator</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {result.sales.map((sale) => (
                  <tr key={sale.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{sale.saleNumber}</td>
                    <td className="p-4">
                      {sale.status} · {sale.paymentStatus}
                    </td>
                    <td className="p-4">{sale._count.items}</td>
                    <td className="p-4">{sale.payments[0]?.method ?? "—"}</td>
                    <td className="p-4">{sale.completedByUser?.name ?? "—"}</td>
                    <td className="p-4 text-right font-semibold">
                      {money(sale.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.sales.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">
                No Sales found.
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </PlatformShell>
  );
}
