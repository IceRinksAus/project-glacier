"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { ReservationCountdown } from "@/components/booking/ReservationCountdown";
import { PaymentStep } from "@/components/booking/PaymentStep";

import {
  PublicBookingResponse,
  PublicEvent,
  PublicRulePreviewResponse,
  PublicSession,
  PublicTicketType,
  publicBookingService,
} from "@/services/public-booking.service";

import {
  AddOnsStep,
  SelectedBookingProduct,
} from "@/components/booking/AddOnsStep";

interface PublicBookingPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

interface ParticipantFormData {
  firstName: string;
  lastName: string;
  age: string;
}

interface ParticipantSlot {
  key: string;
  ticketTypeId: string;
  ticketTypeName: string;
  participantNumber: number;
}

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function PublicBookingPage({ params }: PublicBookingPageProps) {
  const { eventId } = use(params);

  const [event, setEvent] = useState<PublicEvent | null>(null);

  const [sessions, setSessions] = useState<PublicSession[]>([]);

  const [ticketTypes, setTicketTypes] = useState<PublicTicketType[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const [ticketQuantities, setTicketQuantities] = useState<
    Record<string, number>
  >({});

  const [participantData, setParticipantData] = useState<
    Record<string, ParticipantFormData>
  >({});

  const [customerData, setCustomerData] = useState<CustomerFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [selectedProducts, setSelectedProducts] = useState<
    SelectedBookingProduct[]
  >([]);

  const [productSubtotal, setProductSubtotal] = useState(0);

  const [rulePreview, setRulePreview] =
    useState<PublicRulePreviewResponse | null>(null);

  const [isEvaluatingRules, setIsEvaluatingRules] = useState(false);

  const [ruleEvaluationError, setRuleEvaluationError] = useState<string | null>(
    null,
  );

  const [reservation, setReservation] = useState<PublicBookingResponse | null>(
    null,
  );

  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBookingPage() {
      try {
        setIsLoading(true);
        setError(null);

        const [eventResult, sessionsResult, ticketTypesResult] =
          await Promise.all([
            publicBookingService.getEvent(eventId),
            publicBookingService.getSessions(eventId),
            publicBookingService.getTicketTypes(eventId),
          ]);

        if (!isMounted) {
          return;
        }

        setEvent(eventResult);
        setSessions(sessionsResult);
        setTicketTypes(ticketTypesResult);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load this event.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadBookingPage();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

  const totalTicketQuantity = useMemo(
    () =>
      Object.values(ticketQuantities).reduce(
        (total, quantity) => total + quantity,
        0,
      ),
    [ticketQuantities],
  );

  const ticketSubtotal = useMemo(
    () =>
      ticketTypes.reduce(
        (total, ticketType) =>
          total + ticketType.price * (ticketQuantities[ticketType.id] ?? 0),
        0,
      ),
    [ticketQuantities, ticketTypes],
  );

  const participantSlots = useMemo<ParticipantSlot[]>(() => {
    const slots: ParticipantSlot[] = [];

    for (const ticketType of ticketTypes) {
      const quantity = ticketQuantities[ticketType.id] ?? 0;

      for (let index = 0; index < quantity; index += 1) {
        slots.push({
          key: `${ticketType.id}-${index}`,
          ticketTypeId: ticketType.id,
          ticketTypeName: ticketType.name,
          participantNumber: index + 1,
        });
      }
    }

    return slots;
  }, [ticketQuantities, ticketTypes]);

  const participantsComplete = useMemo(() => {
    if (participantSlots.length === 0) {
      return false;
    }

    return participantSlots.every((slot) => {
      const participant = participantData[slot.key];

      if (!participant) {
        return false;
      }

      const firstName = participant.firstName.trim();

      const age = Number(participant.age);

      return (
        firstName.length > 0 &&
        participant.age.trim().length > 0 &&
        Number.isInteger(age) &&
        age >= 0
      );
    });
  }, [participantData, participantSlots]);

  useEffect(() => {
    let isCurrent = true;

    if (reservation) {
      const reset = window.setTimeout(() => {
        if (!isCurrent) return;
        setIsEvaluatingRules(false);
        setRuleEvaluationError(null);
      }, 0);
      return () => {
        isCurrent = false;
        window.clearTimeout(reset);
      };
    }

    if (!selectedSession || !participantsComplete) {
      const reset = window.setTimeout(() => {
        if (!isCurrent) return;
        setRulePreview(null);
        setIsEvaluatingRules(false);
        setRuleEvaluationError(null);
      }, 0);
      return () => {
        isCurrent = false;
        window.clearTimeout(reset);
      };
    }

    const sessionId = selectedSession.id;

    async function evaluateBookingRules() {
      try {
        setIsEvaluatingRules(true);
        setRuleEvaluationError(null);

        const participants = participantSlots.map((slot) => {
          const participant = participantData[slot.key];

          return {
            firstName: participant.firstName.trim(),
            ...(participant.lastName.trim()
              ? {
                  lastName: participant.lastName.trim(),
                }
              : {}),
            age: Number(participant.age),
            ticketTypeId: slot.ticketTypeId,
          };
        });

        const result = await publicBookingService.evaluateRules(eventId, {
          sessionId,
          flexibleBooking: false,
          participants,
        });

        if (!isCurrent) {
          return;
        }

        setRulePreview(result);
      } catch (evaluationError) {
        if (!isCurrent) {
          return;
        }

        setRulePreview(null);
        setRuleEvaluationError(
          evaluationError instanceof Error
            ? evaluationError.message
            : "Unable to check booking requirements.",
        );
      } finally {
        if (isCurrent) {
          setIsEvaluatingRules(false);
        }
      }
    }

    void evaluateBookingRules();

    return () => {
      isCurrent = false;
    };
  }, [
    eventId,
    participantData,
    participantSlots,
    participantsComplete,
    reservation,
    selectedSession,
  ]);

  const customerComplete = useMemo(() => {
    const firstName = customerData.firstName.trim();

    const lastName = customerData.lastName.trim();

    const email = customerData.email.trim();

    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    return firstName.length > 0 && lastName.length > 0 && emailLooksValid;
  }, [customerData]);

  const selectedTicketSummary = useMemo(
    () =>
      ticketTypes
        .map((ticketType) => ({
          ticketType,
          quantity: ticketQuantities[ticketType.id] ?? 0,
        }))
        .filter(({ quantity }) => quantity > 0),
    [ticketQuantities, ticketTypes],
  );

  const requiredProducts = useMemo(
    () => rulePreview?.requiredProducts ?? [],
    [rulePreview],
  );

  const requiredProductsSatisfied = useMemo(
    () =>
      requiredProducts.every((requiredProduct) => {
        const selectedProduct = selectedProducts.find(
          (product) => product.slug === requiredProduct.productSlug,
        );

        return (selectedProduct?.quantity ?? 0) >= requiredProduct.quantity;
      }),
    [requiredProducts, selectedProducts],
  );

  const bookingRequirementsReady = Boolean(
    participantsComplete &&
    rulePreview &&
    rulePreview.valid &&
    rulePreview.errors.length === 0 &&
    !isEvaluatingRules &&
    !ruleEvaluationError &&
    requiredProductsSatisfied,
  );

  function updateSelectedProducts(
    products: SelectedBookingProduct[],
    subtotal: number,
  ) {
    setSelectedProducts(products);
    setProductSubtotal(subtotal);
  }

  function updateTicketQuantity(ticketTypeId: string, change: number) {
    if (reservation) {
      return;
    }

    setTicketQuantities((currentQuantities) => {
      const currentQuantity = currentQuantities[ticketTypeId] ?? 0;

      const nextQuantity = Math.max(0, currentQuantity + change);

      return {
        ...currentQuantities,
        [ticketTypeId]: nextQuantity,
      };
    });

    setSubmissionError(null);
  }

  function updateParticipant(
    key: string,
    field: "firstName" | "lastName" | "age",
    value: string,
  ) {
    if (reservation) {
      return;
    }

    setParticipantData((currentData) => ({
      ...currentData,
      [key]: {
        firstName: currentData[key]?.firstName ?? "",
        lastName: currentData[key]?.lastName ?? "",
        age: currentData[key]?.age ?? "",
        [field]: value,
      },
    }));

    setSubmissionError(null);
  }

  function updateCustomer(field: keyof CustomerFormData, value: string) {
    if (reservation) {
      return;
    }

    setCustomerData((currentData) => ({
      ...currentData,
      [field]: value,
    }));

    setSubmissionError(null);
  }

  function selectSession(sessionId: string) {
    if (reservation || selectedSessionId === sessionId) {
      return;
    }

    setSelectedSessionId(sessionId);

    setTicketQuantities({});
    setParticipantData({});
    setSelectedProducts([]);
    setProductSubtotal(0);
    setRulePreview(null);
    setRuleEvaluationError(null);
    setSubmissionError(null);
  }

  async function createReservation() {
    if (
      !selectedSession ||
      !participantsComplete ||
      !customerComplete ||
      totalTicketQuantity === 0 ||
      !bookingRequirementsReady ||
      isSubmitting ||
      reservation
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmissionError(null);

      const customer = await publicBookingService.createCustomer({
        firstName: customerData.firstName.trim(),
        lastName: customerData.lastName.trim(),
        email: customerData.email.trim(),
        ...(customerData.phone.trim()
          ? {
              phone: customerData.phone.trim(),
            }
          : {}),
      });

      const participants = participantSlots.map((slot) => {
        const participant = participantData[slot.key];

        return {
          firstName: participant.firstName.trim(),
          ...(participant.lastName.trim()
            ? {
                lastName: participant.lastName.trim(),
              }
            : {}),
          age: Number(participant.age),
          ticketTypeId: slot.ticketTypeId,
        };
      });

      const bookingResult = await publicBookingService.createBooking({
        customerId: customer.id,
        eventId,
        sessionId: selectedSession.id,
        flexibleBooking: false,
        participants,
        products: selectedProducts.map((product) => ({
          productId: product.productId,
          ...(product.productVariantId
            ? { productVariantId: product.productVariantId }
            : {}),
          quantity: product.quantity,
        })),
      });

      setReservation(bookingResult);
    } catch (submitError) {
      setSubmissionError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create your reservation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        {isLoading ? (
          <div className="rounded-xl border bg-card p-8">
            <p className="text-sm text-muted-foreground">Loading event...</p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8">
            <h1 className="text-xl font-semibold">Event unavailable</h1>

            <p className="mt-2 text-sm text-destructive">{error}</p>
          </div>
        ) : null}

        {!isLoading && !error && event ? (
          <>
            <header className="rounded-2xl border bg-card p-8 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Book tickets
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                {event.name}
              </h1>

              {event.description ? (
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                  {event.description}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border px-3 py-1.5">
                  {new Date(event.startDate).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>

                <span className="rounded-full border px-3 py-1.5">to</span>

                <span className="rounded-full border px-3 py-1.5">
                  {new Date(event.endDate).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </header>

            <section className="rounded-2xl border bg-card p-8">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Step 1
                </p>

                <h2 className="text-2xl font-semibold">Choose your session</h2>

                <p className="text-muted-foreground">
                  Select the session you would like to attend.
                </p>
              </div>

              {sessions.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed p-6">
                  <p className="text-sm text-muted-foreground">
                    There are currently no sessions available for online
                    booking.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-3">
                  {sessions.map((session) => {
                    const isSelected = selectedSessionId === session.id;

                    return (
                      <button
                        key={session.id}
                        type="button"
                        disabled={Boolean(reservation)}
                        onClick={() => selectSession(session.id)}
                        className={[
                          "flex w-full flex-col gap-3 rounded-xl border p-5 text-left transition",
                          isSelected
                            ? "border-foreground bg-muted"
                            : "bg-background hover:bg-muted/50",
                          reservation ? "cursor-default" : "",
                        ].join(" ")}
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div>
                            <p className="font-semibold">
                              {formatDate(session.startDate)}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {session.name}
                            </p>
                          </div>

                          <div className="text-sm font-medium">
                            {formatTime(session.startDate)}
                            {" – "}
                            {formatTime(session.endDate)}
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="text-sm font-medium">Selected</div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {selectedSession ? (
              <section className="rounded-2xl border bg-card p-8">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Step 2
                  </p>

                  <h2 className="text-2xl font-semibold">
                    Choose your tickets
                  </h2>

                  <p className="text-muted-foreground">
                    Select the number of tickets required for this session.
                  </p>
                </div>

                <div className="mt-5 rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Selected session</p>

                  <p className="mt-1 font-semibold">
                    {formatDate(selectedSession.startDate)}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatTime(selectedSession.startDate)}
                    {" – "}
                    {formatTime(selectedSession.endDate)}
                  </p>
                </div>

                {ticketTypes.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-6">
                    <p className="text-sm text-muted-foreground">
                      There are currently no tickets available for online
                      booking.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-3">
                    {ticketTypes.map((ticketType) => {
                      const quantity = ticketQuantities[ticketType.id] ?? 0;

                      return (
                        <div
                          key={ticketType.id}
                          className="flex flex-col gap-4 rounded-xl border bg-background p-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-semibold">
                                {ticketType.name}
                              </h3>

                              <span className="text-sm font-medium">
                                {formatCurrency(ticketType.price)}
                              </span>
                            </div>

                            {ticketType.description ? (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {ticketType.description}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              disabled={quantity === 0 || Boolean(reservation)}
                              onClick={() =>
                                updateTicketQuantity(ticketType.id, -1)
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-medium disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              −
                            </button>

                            <span className="min-w-8 text-center text-lg font-semibold">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              disabled={Boolean(reservation)}
                              onClick={() =>
                                updateTicketQuantity(ticketType.id, 1)
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-medium disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {totalTicketQuantity > 0 ? (
                  <div className="mt-6 flex flex-col gap-4 rounded-xl border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {totalTicketQuantity}{" "}
                        {totalTicketQuantity === 1 ? "ticket" : "tickets"}{" "}
                        selected
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm text-muted-foreground">
                        Ticket subtotal
                      </p>

                      <p className="text-2xl font-semibold">
                        {formatCurrency(ticketSubtotal)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {selectedSession && totalTicketQuantity > 0 ? (
              <section className="rounded-2xl border bg-card p-8">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Step 3
                  </p>

                  <h2 className="text-2xl font-semibold">
                    Participant details
                  </h2>

                  <p className="text-muted-foreground">
                    Enter the details for each person attending this session.
                  </p>
                </div>

                <div className="mt-6 grid gap-5">
                  {participantSlots.map((slot) => {
                    const participant = participantData[slot.key] ?? {
                      firstName: "",
                      lastName: "",
                      age: "",
                    };

                    return (
                      <div
                        key={slot.key}
                        className="rounded-xl border bg-background p-5"
                      >
                        <h3 className="font-semibold">
                          {slot.ticketTypeName} participant{" "}
                          {slot.participantNumber}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          This participant will use the {slot.ticketTypeName}{" "}
                          ticket.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <label className="grid gap-2">
                            <span className="text-sm font-medium">
                              First name
                            </span>

                            <input
                              type="text"
                              disabled={Boolean(reservation)}
                              value={participant.firstName}
                              onChange={(inputEvent) =>
                                updateParticipant(
                                  slot.key,
                                  "firstName",
                                  inputEvent.target.value,
                                )
                              }
                              className="h-11 rounded-lg border bg-background px-3 outline-none disabled:opacity-60"
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-sm font-medium">
                              Last name
                            </span>

                            <input
                              type="text"
                              disabled={Boolean(reservation)}
                              value={participant.lastName}
                              onChange={(inputEvent) =>
                                updateParticipant(
                                  slot.key,
                                  "lastName",
                                  inputEvent.target.value,
                                )
                              }
                              className="h-11 rounded-lg border bg-background px-3 outline-none disabled:opacity-60"
                            />
                          </label>

                          <label className="grid gap-2 sm:max-w-xs">
                            <span className="text-sm font-medium">Age</span>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              disabled={Boolean(reservation)}
                              value={participant.age}
                              onChange={(inputEvent) =>
                                updateParticipant(
                                  slot.key,
                                  "age",
                                  inputEvent.target.value,
                                )
                              }
                              className="h-11 rounded-lg border bg-background px-3 outline-none disabled:opacity-60"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-xl border bg-muted/30 p-5">
                  <p className="font-medium">
                    {participantsComplete
                      ? "Participant details complete"
                      : "Participant details required"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {participantsComplete
                      ? `All ${totalTicketQuantity} participant ${
                          totalTicketQuantity === 1
                            ? "record is"
                            : "records are"
                        } ready.`
                      : "Enter a first name and valid age for every selected ticket."}
                  </p>
                </div>

                {participantsComplete && isEvaluatingRules ? (
                  <div className="mt-4 rounded-xl border p-5">
                    <p className="font-medium">
                      Checking booking requirements...
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      We are checking the event rules for these participants.
                    </p>
                  </div>
                ) : null}

                {participantsComplete && ruleEvaluationError ? (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                    <p className="font-medium text-destructive">
                      Unable to check booking requirements
                    </p>

                    <p className="mt-1 text-sm text-destructive">
                      {ruleEvaluationError}
                    </p>
                  </div>
                ) : null}

                {participantsComplete &&
                rulePreview &&
                !isEvaluatingRules &&
                !ruleEvaluationError ? (
                  <div className="mt-4 rounded-xl border bg-muted/30 p-5">
                    <p className="font-medium">Booking requirements checked</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {requiredProducts.length > 0
                        ? `${requiredProducts.reduce(
                            (total, product) => total + product.quantity,
                            0,
                          )} required add-on ${
                            requiredProducts.reduce(
                              (total, product) => total + product.quantity,
                              0,
                            ) === 1
                              ? "item has"
                              : "items have"
                          } been identified and applied in Step 4.`
                        : "No required add-ons apply to these participants."}
                    </p>
                  </div>
                ) : null}

                {rulePreview && rulePreview.errors.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                    <p className="font-medium text-destructive">
                      Booking requirements not satisfied
                    </p>

                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
                      {rulePreview.errors.map((ruleError, index) => (
                        <li key={`${ruleError}-${index}`}>{ruleError}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            {selectedSession &&
            totalTicketQuantity > 0 &&
            participantsComplete &&
            rulePreview &&
            rulePreview.valid &&
            rulePreview.errors.length === 0 &&
            !isEvaluatingRules &&
            !ruleEvaluationError ? (
              <AddOnsStep
                sessionId={selectedSession.id}
                requiredProducts={requiredProducts}
                disabled={Boolean(reservation)}
                onChange={updateSelectedProducts}
              />
            ) : null}

            {selectedSession &&
            totalTicketQuantity > 0 &&
            participantsComplete &&
            rulePreview &&
            rulePreview.valid &&
            rulePreview.errors.length === 0 &&
            !isEvaluatingRules &&
            !ruleEvaluationError ? (
              <section className="rounded-2xl border bg-card p-8">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Step 5
                  </p>

                  <h2 className="text-2xl font-semibold">Your details</h2>

                  <p className="text-muted-foreground">
                    Enter the contact details for this booking.
                  </p>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">First name</span>

                    <input
                      type="text"
                      disabled={Boolean(reservation)}
                      value={customerData.firstName}
                      onChange={(inputEvent) =>
                        updateCustomer("firstName", inputEvent.target.value)
                      }
                      className="h-11 rounded-lg border bg-background px-3 outline-none disabled:opacity-60"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Last name</span>

                    <input
                      type="text"
                      disabled={Boolean(reservation)}
                      value={customerData.lastName}
                      onChange={(inputEvent) =>
                        updateCustomer("lastName", inputEvent.target.value)
                      }
                      className="h-11 rounded-lg border bg-background px-3 outline-none disabled:opacity-60"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Email</span>

                    <input
                      type="email"
                      disabled={Boolean(reservation)}
                      value={customerData.email}
                      onChange={(inputEvent) =>
                        updateCustomer("email", inputEvent.target.value)
                      }
                      className="h-11 rounded-lg border bg-background px-3 outline-none disabled:opacity-60"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">
                      Phone{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </span>

                    <input
                      type="tel"
                      disabled={Boolean(reservation)}
                      value={customerData.phone}
                      onChange={(inputEvent) =>
                        updateCustomer("phone", inputEvent.target.value)
                      }
                      className="h-11 rounded-lg border bg-background px-3 outline-none disabled:opacity-60"
                    />
                  </label>
                </div>

                <div className="mt-6 rounded-xl border bg-muted/30 p-5">
                  <p className="font-medium">
                    {customerComplete
                      ? "Customer details complete"
                      : "Customer details required"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {customerComplete
                      ? "Your booking contact details are ready."
                      : "Enter your first name, last name and a valid email address."}
                  </p>
                </div>
              </section>
            ) : null}

            {selectedSession && participantsComplete && customerComplete ? (
              <section className="rounded-2xl border bg-card p-8">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Step 6
                  </p>

                  <h2 className="text-2xl font-semibold">Review & reserve</h2>

                  <p className="text-muted-foreground">
                    Review your booking before creating the reservation.
                  </p>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-xl border p-5">
                    <p className="text-sm text-muted-foreground">Session</p>

                    <p className="mt-1 font-semibold">
                      {formatDate(selectedSession.startDate)}
                    </p>

                    <p className="mt-1 text-sm">
                      {formatTime(selectedSession.startDate)}
                      {" – "}
                      {formatTime(selectedSession.endDate)}
                    </p>
                  </div>

                  <div className="rounded-xl border p-5">
                    <p className="text-sm text-muted-foreground">Tickets</p>

                    <div className="mt-3 grid gap-2">
                      {selectedTicketSummary.map(({ ticketType, quantity }) => (
                        <div
                          key={ticketType.id}
                          className="flex items-center justify-between gap-4"
                        >
                          <span>
                            {quantity} × {ticketType.name}
                          </span>

                          <span className="font-medium">
                            {formatCurrency(ticketType.price * quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border p-5">
                    <p className="text-sm text-muted-foreground">Add-ons</p>

                    {selectedProducts.length > 0 ? (
                      <div className="mt-3 grid gap-2">
                        {selectedProducts.map((product) => (
                          <div
                            key={product.productId}
                            className="flex items-center justify-between gap-4"
                          >
                            <span>
                              {product.quantity} × {product.name}
                            </span>

                            <span className="font-medium">
                              {formatCurrency(product.price * product.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm">No add-ons selected.</p>
                    )}
                  </div>

                  <div className="rounded-xl border p-5">
                    <p className="text-sm text-muted-foreground">
                      Participants
                    </p>

                    <div className="mt-3 grid gap-2">
                      {participantSlots.map((slot) => {
                        const participant = participantData[slot.key];

                        return (
                          <div
                            key={slot.key}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span>
                              {participant.firstName} {participant.lastName}
                            </span>

                            <span className="text-sm text-muted-foreground">
                              {slot.ticketTypeName}, age {participant.age}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border p-5">
                    <p className="text-sm text-muted-foreground">
                      Booking contact
                    </p>

                    <p className="mt-2 font-medium">
                      {customerData.firstName} {customerData.lastName}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {customerData.email}
                    </p>

                    {customerData.phone.trim() ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {customerData.phone}
                      </p>
                    ) : null}
                  </div>
                </div>

                {!bookingRequirementsReady ? (
                  <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                    <p className="font-medium text-destructive">
                      Booking requirements still need attention
                    </p>

                    <p className="mt-1 text-sm text-destructive">
                      {isEvaluatingRules
                        ? "Booking requirements are still being checked."
                        : ruleEvaluationError
                          ? ruleEvaluationError
                          : !rulePreview
                            ? "Booking requirements have not been checked yet."
                            : !rulePreview.valid ||
                                rulePreview.errors.length > 0
                              ? "One or more event rules prevent this reservation from being created."
                              : !requiredProductsSatisfied
                                ? "One or more required add-ons are missing or below the required quantity."
                                : "Please review the booking requirements before continuing."}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-4 rounded-xl border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Reservation total
                    </p>

                    <p className="text-3xl font-semibold">
                      {formatCurrency(ticketSubtotal + productSubtotal)}
                    </p>
                  </div>

                  {!reservation ? (
                    <button
                      type="button"
                      disabled={isSubmitting || !bookingRequirementsReady}
                      onClick={() => void createReservation()}
                      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "Creating reservation..."
                        : "Reserve tickets"}
                    </button>
                  ) : null}
                </div>

                {submissionError ? (
                  <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                    <p className="font-medium text-destructive">
                      Unable to create reservation
                    </p>

                    <p className="mt-2 text-sm text-destructive">
                      {submissionError}
                    </p>
                  </div>
                ) : null}

                {reservation ? (
                  <div className="mt-6 rounded-2xl border bg-background p-6">
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {paymentReference
                        ? "Booking confirmed"
                        : "Reservation created"}
                    </p>

                    <h3 className="mt-2 text-2xl font-semibold">
                      {reservation.booking.bookingNumber}
                    </h3>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>

                        <p className="mt-1 font-semibold">
                          {paymentReference
                            ? "CONFIRMED"
                            : reservation.booking.status}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Payment</p>

                        <p className="mt-1 font-semibold">
                          {paymentReference
                            ? "PAID"
                            : reservation.booking.paymentStatus}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>

                        <p className="mt-1 font-semibold">
                          {formatCurrency(reservation.booking.total)}
                        </p>
                      </div>
                    </div>

                    {!paymentReference && reservation.booking.reservedUntil ? (
                      <div className="mt-5">
                        <ReservationCountdown
                          reservedUntil={reservation.booking.reservedUntil}
                        />
                      </div>
                    ) : null}

                    {reservation.ruleEvaluation.warnings.length > 0 ? (
                      <div className="mt-5 rounded-xl border p-4">
                        <p className="font-medium">Booking information</p>

                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {reservation.ruleEvaluation.warnings.map(
                            (warning, index) => (
                              <li key={`${warning}-${index}`}>{warning}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    ) : null}

                    {!paymentReference ? (
                      <PaymentStep
                        reservation={reservation}
                        onPaymentSubmitted={() => {
                          setPaymentReference("PENDING_WEBHOOK");
                        }}
                      />
                    ) : (
                      <div className="mt-6 rounded-2xl border bg-background p-6">
                        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                          Payment confirmed
                        </p>

                        <h4 className="mt-2 text-xl font-semibold">
                          Your booking is confirmed
                        </h4>

                        <p className="mt-2 text-sm text-muted-foreground">
                          Payment has been received and your tickets have been
                          issued.
                        </p>

                        <div className="mt-4 rounded-xl border p-4">
                          <p className="text-sm text-muted-foreground">
                            Payment reference
                          </p>

                          <p className="mt-1 break-all font-mono text-sm font-medium">
                            {paymentReference}
                          </p>
                        </div>

                        {event.waiverPublicSlug ? (
                          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
                            <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
                              Get ready for your session
                            </p>
                            <h4 className="mt-2 text-lg font-semibold text-slate-950">
                              Complete the Event waiver
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              Each adult skater should complete their own waiver
                              before going onto the ice. A responsible adult may
                              include children in their care.
                            </p>
                            <Link
                              href={`/waivers/${event.waiverPublicSlug}`}
                              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-900 focus:outline-none focus:ring-4 focus:ring-sky-200"
                            >
                              Complete waiver now
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
