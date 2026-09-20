"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { customerService, CustomerListItem } from "@/services/customer.service";
import { eventService, GlacierEvent } from "@/services/event.service";

function maskedPhone(value: string | null) {
  if (!value) return "No phone";
  const digits = value.replace(/\D/g, "");
  return digits.length > 4 ? `•••• ${digits.slice(-4)}` : value;
}

interface Props { fixedEventId?: string; fixedEventName?: string; embedded?: boolean }

export function CustomersWorkspace({ fixedEventId, fixedEventName, embedded = false }: Props = {}) {
  const searchParams = useSearchParams();
  const initialEventId = fixedEventId ?? searchParams.get("eventId") ?? "";
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [events, setEvents] = useState<GlacierEvent[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState(initialEventId);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fixedEventId) return;
    void eventService.getEvents().then(setEvents);
  }, [fixedEventId]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void customerService
      .search({
        search: search || undefined,
        eventId: eventId || undefined,
        page,
        pageSize: 25,
      })
      .then((response) => {
        if (cancelled) return;
        setCustomers(response.items);
        setTotalItems(response.pagination.totalItems);
        setTotalPages(response.pagination.totalPages);
        setError("");
      })
      .catch((cause) => {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load Customers.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, page, search]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = searchInput.trim();
    if (value.length === 1) {
      setError("Enter at least 2 characters to search.");
      return;
    }
    setPage(1);
    setSearch(value);
  }

  const content = (
      <div className="space-y-6">
        <header>
          <p className="text-sm font-medium text-primary">Operations</p>
          <h1 className={`mt-1 font-semibold tracking-tight ${embedded ? "text-2xl" : "text-3xl"}`}>
            Customers
          </h1>
          <p className="mt-2 text-muted-foreground">
            {fixedEventId ? `Find Customers with authorised Bookings for ${fixedEventName ?? "this Event"}.` : "Find customers and the Bookings your role is authorised to view."}
          </p>
        </header>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <form
            onSubmit={submit}
            className="grid gap-4 lg:grid-cols-[1fr_280px_auto]"
          >
            <label className="text-sm font-medium">
              Search Customers
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, email or phone"
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
              />
            </label>
            {fixedEventId ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Event scope</span>
                <span className="mt-1 block font-semibold">{fixedEventName ?? "Selected Event"}</span>
              </div>
            ) : (
              <label className="text-sm font-medium">
                Event
                <select value={eventId} onChange={(event) => { setEventId(event.target.value); setPage(1); }} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal">
                  <option value="">All authorised Events</option>
                  {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                </select>
              </label>
            )}
            <Button type="submit" className="lg:mt-7">
              Search
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            {totalItems} {totalItems === 1 ? "Customer" : "Customers"} found
          </p>
        </section>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
        {isLoading ? (
          <p className="rounded-xl border bg-card p-6">Loading Customers...</p>
        ) : null}
        {!isLoading && !error && customers.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
            No Customers match these filters.
          </p>
        ) : null}

        {!isLoading && customers.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold">
                  {customer.firstName} {customer.lastName}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {customer.email || "No email"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {maskedPhone(customer.phone)}
                </p>
                <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium">
                    {customer.bookingCount} authorised{" "}
                    {customer.bookingCount === 1 ? "Booking" : "Bookings"}
                  </p>
                  {customer.latestBooking ? (
                    <p className="mt-1 text-muted-foreground">
                      Latest: {customer.latestBooking.event.name} ·{" "}
                      {customer.latestBooking.bookingNumber}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/customers/${customer.id}`}
                  className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  View Customer →
                </Link>
              </article>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>
  );

  return embedded ? content : <PlatformShell>{content}</PlatformShell>;
}
