"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import {
  BookingListItem,
  bookingOperationsService,
} from "@/services/booking-operations.service";
import { eventService, GlacierEvent } from "@/services/event.service";
import { Session, sessionService } from "@/services/session.service";

function money(value: string | number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value));
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [events, setEvents] = useState<GlacierEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    eventService.getEvents().then((response) => {
      if (!cancelled) setEvents(response);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    sessionService.getSessions(eventId).then((response) => {
      if (!cancelled) setSessions(response);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;
    const [sortBy, sortDirection] = sort.split(":") as [
      "createdAt" | "sessionStart" | "customerName" | "total",
      "asc" | "desc",
    ];

    bookingOperationsService
      .search({
        search: search || undefined,
        eventId: eventId || undefined,
        sessionId: sessionId || undefined,
        bookingStatus: bookingStatus || undefined,
        paymentStatus: paymentStatus || undefined,
        sortBy,
        sortDirection,
        page,
        pageSize: 25,
      })
      .then((response) => {
        if (!cancelled) {
          setBookings(response.items);
          setTotalItems(response.pagination.totalItems);
          setTotalPages(response.pagination.totalPages);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load bookings.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingStatus, eventId, page, paymentStatus, search, sessionId, sort]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setIsLoading(true);
  }

  function changeEvent(nextEventId: string) {
    setEventId(nextEventId);
    setSessionId("");
    setSessions([]);
    setPage(1);
    setIsLoading(true);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setEventId("");
    setSessionId("");
    setSessions([]);
    setBookingStatus("");
    setPaymentStatus("");
    setSort("createdAt:desc");
    setPage(1);
    setIsLoading(true);
  }

  return (
    <PlatformShell>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Operations</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bookings</h1>
          <p className="mt-2 text-muted-foreground">
            Find customer bookings, payment state and ticket issuance.
          </p>
        </div>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
            <label className="flex-1 text-sm font-medium">
              Search bookings
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, email or Booking number"
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
              />
            </label>
            <Button type="submit" className="sm:mt-7">Search</Button>
          </form>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <label className="text-sm font-medium">
              Event
              <select
                value={eventId}
                onChange={(event) => changeEvent(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Session
              <select
                value={sessionId}
                disabled={!eventId}
                onChange={(event) => {
                  setSessionId(event.target.value);
                  setPage(1);
                  setIsLoading(true);
                }}
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal disabled:opacity-50"
              >
                <option value="">All Sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {new Date(session.startDate).toLocaleString("en-AU")} · {session.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Booking state
              <select
                value={bookingStatus}
                onChange={(event) => {
                  setBookingStatus(event.target.value);
                  setPage(1);
                  setIsLoading(true);
                }}
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
              >
                <option value="">All states</option>
                {["PENDING", "RESERVED", "CONFIRMED", "CANCELLED", "EXPIRED"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Payment state
              <select
                value={paymentStatus}
                onChange={(event) => {
                  setPaymentStatus(event.target.value);
                  setPage(1);
                  setIsLoading(true);
                }}
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
              >
                <option value="">All states</option>
                {["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Sort
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                  setIsLoading(true);
                }}
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
              >
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="sessionStart:asc">Session time</option>
                <option value="customerName:asc">Customer name</option>
                <option value="total:desc">Highest total</option>
                <option value="total:asc">Lowest total</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "Booking" : "Bookings"} found
            </p>
            <Button type="button" variant="ghost" onClick={clearFilters}>Clear filters</Button>
          </div>
        </section>

        {isLoading ? <div className="rounded-xl border bg-card p-6">Loading bookings...</div> : null}
        {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{error}</div> : null}
        {!isLoading && !error && bookings.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No bookings match these filters.</div>
        ) : null}

        {!isLoading && !error && bookings.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    {["Booking", "Source", "Customer", "Session", "Event", "Booking state", "Payment", "Total"].map((heading) => (
                      <th key={heading} className={`px-5 py-3 font-medium ${heading === "Total" ? "text-right" : ""}`}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/30">
                      <td className="px-5 py-4">
                        <Link href={`/bookings/${booking.id}`} className="font-semibold underline-offset-4 hover:underline">{booking.bookingNumber}</Link>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(booking.createdAt).toLocaleString("en-AU")}</p>
                      </td>
                      <td className="px-5 py-4">{booking.source === "WALK_UP" ? "Walk-up" : "Online"}</td>
                      <td className="px-5 py-4">
                        {booking.customer.firstName} {booking.customer.lastName}
                        <p className="mt-1 text-xs text-muted-foreground">{booking.customer.email ?? "No email recorded"}</p>
                      </td>
                      <td className="px-5 py-4">{booking.session?.name ?? "—"}</td>
                      <td className="px-5 py-4">{booking.event.name}</td>
                      <td className="px-5 py-4">{booking.status}</td>
                      <td className="px-5 py-4">{booking.paymentStatus}</td>
                      <td className="px-5 py-4 text-right font-medium">{money(booking.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && totalPages > 1 ? (
          <nav className="flex items-center justify-between" aria-label="Booking result pages">
            <Button variant="outline" disabled={page <= 1} onClick={() => {
              setPage((current) => current - 1);
              setIsLoading(true);
            }}>Previous</Button>
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => {
              setPage((current) => current + 1);
              setIsLoading(true);
            }}>Next</Button>
          </nav>
        ) : null}
      </div>
    </PlatformShell>
  );
}
