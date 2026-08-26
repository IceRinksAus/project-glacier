"use client";

import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { eventService, GlacierEvent } from "@/services/event.service";
import {
  PosCatalogue,
  PosCompletion,
  PosParticipant,
  PosReservation,
  posService,
} from "@/services/pos.service";
import { MerchandiseSaleMode } from "./MerchandiseSaleMode";

const EVENT_KEY = "glacier_pos_event";
const SESSION_KEY = "glacier_pos_session";

function money(value: string | number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value));
}

function sessionLabel(
  session: PosCatalogue["sessions"][number],
  timezone?: string | null,
) {
  return `${session.name} · ${new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone || undefined,
  }).format(new Date(session.startDate))}`;
}

export default function PosPage() {
  const [saleMode, setSaleMode] = useState<"TICKETS" | "MERCHANDISE">(
    "TICKETS",
  );
  const [events, setEvents] = useState<GlacierEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [catalogue, setCatalogue] = useState<PosCatalogue | null>(null);
  const [participants, setParticipants] = useState<PosParticipant[]>([]);
  const [products, setProducts] = useState<
    Record<string, { quantity: number; productVariantId?: string }>
  >({});
  const [reservation, setReservation] = useState<PosReservation | null>(null);
  const [completion, setCompletion] = useState<PosCompletion | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "STANDALONE_EFTPOS"
  >("STANDALONE_EFTPOS");
  const [terminalReference, setTerminalReference] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    eventService
      .getEvents()
      .then((result) => {
        const active = result.filter((event) => event.status === "ACTIVE");
        setEvents(active);
        const saved = localStorage.getItem(EVENT_KEY);
        if (saved && active.some((event) => event.id === saved))
          setEventId(saved);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load Events.",
        ),
      );
  }, []);

  useEffect(() => {
    if (!eventId) {
      return;
    }
    posService
      .getCatalogue(eventId, sessionId || undefined)
      .then((result) => {
        setCatalogue(result);
        if (
          sessionId &&
          !result.sessions.some((session) => session.id === sessionId)
        )
          setSessionId("");
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load the POS catalogue.",
        ),
      )
      .finally(() => setIsWorking(false));
  }, [eventId, sessionId]);

  const recommendedSession = useMemo(() => {
    if (!catalogue) return null;
    const now = Date.now();
    return (
      catalogue.sessions.find(
        (session) => new Date(session.endDate).getTime() >= now,
      ) ??
      catalogue.sessions[0] ??
      null
    );
  }, [catalogue]);

  const selectedSession =
    catalogue?.sessions.find((session) => session.id === sessionId) ?? null;
  const estimatedTotal = useMemo(() => {
    if (!catalogue) return 0;
    const tickets = participants.reduce((sum, participant) => {
      const ticketType = catalogue.ticketTypes.find(
        ({ id }) => id === participant.ticketTypeId,
      );
      return sum + Number(ticketType?.price ?? 0);
    }, 0);
    const addons = catalogue.sessionProducts.reduce((sum, assignment) => {
      const selection = products[assignment.productId];
      if (!selection?.quantity) return sum;
      const variant = assignment.product.variants.find(
        ({ id }) => id === selection.productVariantId,
      );
      return (
        sum +
        Number(variant?.priceOverride ?? assignment.product.price) *
          selection.quantity
      );
    }, 0);
    return tickets + addons;
  }, [catalogue, participants, products]);

  function selectEvent(value: string) {
    setEventId(value);
    setSessionId("");
    setCatalogue(null);
    resetSale();
    if (value) localStorage.setItem(EVENT_KEY, value);
  }

  function selectSession(value: string) {
    setSessionId(value);
    resetSale();
    if (value) localStorage.setItem(SESSION_KEY, value);
  }

  function addTicket(ticketTypeId: string) {
    setParticipants((current) => [
      ...current,
      { firstName: "", lastName: "", age: 18, ticketTypeId },
    ]);
  }

  function removeTicket(index: number) {
    setParticipants((current) =>
      current.filter((_, participantIndex) => participantIndex !== index),
    );
  }

  function updateParticipant(index: number, patch: Partial<PosParticipant>) {
    setParticipants((current) =>
      current.map((participant, participantIndex) =>
        participantIndex === index ? { ...participant, ...patch } : participant,
      ),
    );
  }

  function updateProduct(
    productId: string,
    quantity: number,
    productVariantId?: string,
  ) {
    setProducts((current) => ({
      ...current,
      [productId]: { quantity: Math.max(0, quantity), productVariantId },
    }));
  }

  function resetSale() {
    setParticipants([]);
    setProducts({});
    setReservation(null);
    setCompletion(null);
    setTerminalReference("");
    setIdempotencyKey("");
    setError("");
  }

  async function reserveSale() {
    if (!eventId || !sessionId || participants.length === 0)
      return setError("Choose a Session and at least one Ticket.");
    if (participants.some((participant) => !participant.firstName.trim()))
      return setError("Enter a first name for every participant.");
    setIsWorking(true);
    setError("");
    try {
      const rules = await posService.evaluateRules(
        eventId,
        sessionId,
        participants,
      );
      if (!rules.valid) throw new Error(rules.errors.join(" "));
      const selectedProducts = { ...products };
      for (const required of rules.requiredProducts) {
        const assignment = catalogue?.sessionProducts.find(
          ({ product }) => product.slug === required.productSlug,
        );
        if (!assignment)
          throw new Error(
            `Required Product ${required.productSlug} is not available for this Session.`,
          );
        const current = selectedProducts[assignment.productId];
        selectedProducts[assignment.productId] = {
          ...current,
          quantity: Math.max(current?.quantity ?? 0, required.quantity),
        };
      }
      setProducts(selectedProducts);
      const createdCustomer = await posService.createCustomer(eventId, {
        firstName: participants[0].firstName,
        lastName: participants[0].lastName || undefined,
      });
      const createdReservation = await posService.createReservation(eventId, {
        customerId: createdCustomer.id,
        sessionId,
        participants,
        products: Object.entries(selectedProducts)
          .filter(([, selection]) => selection.quantity > 0)
          .map(([productId, selection]) => ({
            productId,
            quantity: selection.quantity,
            productVariantId: selection.productVariantId,
          })),
      });
      setReservation(createdReservation);
      setIdempotencyKey(crypto.randomUUID());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to reserve this sale.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function completeSale() {
    if (!reservation || !idempotencyKey) return;
    setIsWorking(true);
    setError("");
    try {
      const result = await posService.completePayment(
        eventId,
        reservation.booking.id,
        {
          method: paymentMethod,
          amount: Number(reservation.booking.total),
          idempotencyKey,
          standaloneReference:
            paymentMethod === "STANDALONE_EFTPOS"
              ? terminalReference || undefined
              : undefined,
        },
      );
      setCompletion(result);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to complete this sale.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <PlatformShell>
      <div className="space-y-6">
        <header>
          <p className="text-sm font-medium text-muted-foreground">
            Ticket window
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Point of Sale
          </h1>
          <p className="mt-2 text-muted-foreground">
            {saleMode === "TICKETS"
              ? "Sell walk-up Tickets and Session Products from Glacier's shared catalogue."
              : "Sell Event merchandise without creating an admission Booking or Ticket."}
          </p>
          <Link
            href="/pos/sales"
            className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Find merchandise Sales
          </Link>
        </header>

        <section
          aria-label="Sale mode"
          className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-2"
        >
          <button
            type="button"
            className={`rounded-lg border p-4 text-left ${saleMode === "TICKETS" ? "border-primary bg-primary/5" : ""}`}
            onClick={() => setSaleMode("TICKETS")}
          >
            <span className="font-semibold">Ticket Sale</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Session admission, participants and eligible Products
            </span>
          </button>
          <button
            type="button"
            className={`rounded-lg border p-4 text-left ${saleMode === "MERCHANDISE" ? "border-primary bg-primary/5" : ""}`}
            onClick={() => setSaleMode("MERCHANDISE")}
          >
            <span className="font-semibold">Merchandise Sale</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Products only — no Session, participant or Ticket
            </span>
          </button>
        </section>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section
          className={`grid gap-4 rounded-xl border bg-card p-5 shadow-sm ${saleMode === "TICKETS" ? "md:grid-cols-2" : ""}`}
        >
          <label className="space-y-2 text-sm font-medium">
            Event
            <select
              className="w-full rounded-md border bg-background px-3 py-3"
              value={eventId}
              onChange={(event) => selectEvent(event.target.value)}
            >
              <option value="">Choose an Event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
          {saleMode === "TICKETS" ? (
            <label className="space-y-2 text-sm font-medium">
              Selling Session
              <select
                className="w-full rounded-md border bg-background px-3 py-3"
                value={sessionId}
                onChange={(event) => selectSession(event.target.value)}
                disabled={!catalogue}
              >
                <option value="">Choose and retain a Session</option>
                {catalogue?.sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {sessionLabel(session, catalogue.event.timezone)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {saleMode === "TICKETS" && !sessionId && recommendedSession ? (
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-sky-50 p-4 text-sm text-sky-950">
              <span>
                Recommended current Session:{" "}
                <strong>
                  {sessionLabel(recommendedSession, catalogue?.event.timezone)}
                </strong>
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => selectSession(recommendedSession.id)}
              >
                Use recommendation
              </Button>
            </div>
          ) : null}
          {saleMode === "TICKETS" && selectedSession ? (
            <p className="md:col-span-2 rounded-lg bg-emerald-50 p-4 font-medium text-emerald-950">
              Selling Session locked:{" "}
              {sessionLabel(selectedSession, catalogue?.event.timezone)}
            </p>
          ) : null}
        </section>

        {saleMode === "TICKETS" && sessionId && catalogue && !reservation ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section className="rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="text-xl font-semibold">Tickets</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {catalogue.ticketTypes.map((ticketType) => (
                    <button
                      key={ticketType.id}
                      type="button"
                      onClick={() => addTicket(ticketType.id)}
                      className="rounded-xl border p-5 text-left transition hover:border-primary hover:bg-muted/40"
                    >
                      <span className="block text-lg font-semibold">
                        {ticketType.name}
                      </span>
                      <span className="mt-2 block text-2xl font-bold">
                        {money(ticketType.price)}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium">
                        <Plus className="size-4" /> Add Ticket
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {participants.length > 0 ? (
                <section className="rounded-xl border bg-card p-5 shadow-sm">
                  <h2 className="text-xl font-semibold">Participants</h2>
                  <div className="mt-4 space-y-3">
                    {participants.map((participant, index) => {
                      const ticketType = catalogue.ticketTypes.find(
                        ({ id }) => id === participant.ticketTypeId,
                      );
                      return (
                        <div
                          key={`${participant.ticketTypeId}-${index}`}
                          className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_100px_auto]"
                        >
                          <label className="text-sm">
                            First name
                            <input
                              className="mt-1 w-full rounded-md border px-3 py-2"
                              value={participant.firstName}
                              onChange={(event) =>
                                updateParticipant(index, {
                                  firstName: event.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="text-sm">
                            Last name
                            <input
                              className="mt-1 w-full rounded-md border px-3 py-2"
                              value={participant.lastName ?? ""}
                              onChange={(event) =>
                                updateParticipant(index, {
                                  lastName: event.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="text-sm">
                            Age
                            <input
                              className="mt-1 w-full rounded-md border px-3 py-2"
                              type="number"
                              min="0"
                              max="130"
                              value={participant.age}
                              onChange={(event) =>
                                updateParticipant(index, {
                                  age: Number(event.target.value),
                                })
                              }
                            />
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            className="self-end"
                            onClick={() => removeTicket(index)}
                          >
                            <Minus className="size-4" />
                            <span className="sr-only">
                              Remove {ticketType?.name}
                            </span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <section className="rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="text-xl font-semibold">Session Products</h2>
                <div className="mt-4 space-y-3">
                  {catalogue.sessionProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No Products are available for this Session.
                    </p>
                  ) : (
                    catalogue.sessionProducts.map(({ product }) => {
                      const selection = products[product.id] ?? { quantity: 0 };
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
                        >
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {money(product.price)}
                              {product.productGroup
                                ? ` · ${product.productGroup.name}`
                                : ""}
                            </p>
                            {product.variants.length > 0 ? (
                              <select
                                className="mt-2 rounded-md border px-3 py-2 text-sm"
                                value={selection.productVariantId ?? ""}
                                onChange={(event) =>
                                  updateProduct(
                                    product.id,
                                    selection.quantity,
                                    event.target.value || undefined,
                                  )
                                }
                              >
                                <option value="">Choose variant</option>
                                {product.variants.map((variant) => (
                                  <option key={variant.id} value={variant.id}>
                                    {variant.name}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                updateProduct(
                                  product.id,
                                  selection.quantity - 1,
                                  selection.productVariantId,
                                )
                              }
                            >
                              <Minus className="size-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {selection.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                updateProduct(
                                  product.id,
                                  selection.quantity + 1,
                                  selection.productVariantId,
                                )
                              }
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            <aside className="h-fit space-y-5 rounded-xl border bg-card p-5 shadow-sm xl:sticky xl:top-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-5" />
                <h2 className="text-xl font-semibold">Sale</h2>
              </div>
              <p className="text-3xl font-bold">{money(estimatedTotal)}</p>
              <p className="border-t pt-4 text-sm text-muted-foreground">
                No separate purchaser details are required. The first
                participant is used as the Booking lookup name.
              </p>
              <Button
                className="w-full"
                size="lg"
                disabled={isWorking || participants.length === 0}
                onClick={reserveSale}
              >
                {isWorking ? "Checking sale…" : "Review payment"}
              </Button>
            </aside>
          </div>
        ) : null}

        {saleMode === "TICKETS" && reservation && !completion ? (
          <section className="mx-auto max-w-2xl space-y-5 rounded-xl border bg-card p-6 shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground">
                Reservation {reservation.booking.bookingNumber}
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Confirm payment received
              </h2>
              <p className="mt-3 text-4xl font-bold">
                {money(reservation.booking.total)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-xl border p-5 text-left ${paymentMethod === "STANDALONE_EFTPOS" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setPaymentMethod("STANDALONE_EFTPOS")}
              >
                <CreditCard className="size-6" />
                <span className="mt-3 block font-semibold">
                  Standalone EFTPOS
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Confirm only after the terminal approves.
                </span>
              </button>
              <button
                type="button"
                className={`rounded-xl border p-5 text-left ${paymentMethod === "CASH" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setPaymentMethod("CASH")}
              >
                <Banknote className="size-6" />
                <span className="mt-3 block font-semibold">Cash</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Confirm the exact amount was received.
                </span>
              </button>
            </div>
            {paymentMethod === "STANDALONE_EFTPOS" ? (
              <label className="block text-sm font-medium">
                Terminal receipt/reference{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={terminalReference}
                  onChange={(event) => setTerminalReference(event.target.value)}
                />
              </label>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                disabled={isWorking}
                onClick={() => {
                  setReservation(null);
                  setIdempotencyKey("");
                }}
              >
                Return to basket
              </Button>
              <Button size="lg" disabled={isWorking} onClick={completeSale}>
                {isWorking
                  ? "Completing…"
                  : `Confirm ${money(reservation.booking.total)} received`}
              </Button>
            </div>
          </section>
        ) : null}

        {saleMode === "TICKETS" && completion ? (
          <section className="mx-auto max-w-2xl rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950">
            <CheckCircle2 className="size-10" />
            <h2 className="mt-4 text-2xl font-semibold">Sale complete</h2>
            <p className="mt-2">
              Booking {completion.bookingNumber} is paid and{" "}
              {completion.tickets.length}{" "}
              {completion.tickets.length === 1 ? "Ticket has" : "Tickets have"}{" "}
              been issued.
            </p>
            <div className="mt-5 space-y-2">
              {completion.tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.secureToken}`}
                  target="_blank"
                  className="block rounded-lg border border-emerald-300 bg-white p-4 font-semibold underline-offset-4 hover:underline"
                >
                  {ticket.ticketNumber} · {ticket.participant.firstName}{" "}
                  {ticket.participant.lastName}
                </Link>
              ))}
            </div>
            <Button className="mt-6" onClick={resetSale}>
              Start next sale
            </Button>
          </section>
        ) : null}

        {saleMode === "MERCHANDISE" ? (
          <MerchandiseSaleMode eventId={eventId} />
        ) : null}
      </div>
    </PlatformShell>
  );
}
