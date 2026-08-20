"use client";

import { FormEvent, useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  getAuthRoleSnapshot,
  getServerAuthRoleSnapshot,
  subscribeAuthSession,
} from "@/lib/auth";
import {
  TicketType,
  ticketTypeService,
} from "@/services/ticket-type.service";

interface TicketTypesWorkspaceProps {
  eventId: string;
  onReturnToReadiness: () => void;
}

function formatPrice(price: string | number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(price));
}

export function TicketTypesWorkspace({
  eventId,
  onReturnToReadiness,
}: TicketTypesWorkspaceProps) {
  const role = useSyncExternalStore(
    subscribeAuthSession,
    getAuthRoleSnapshot,
    getServerAuthRoleSnapshot,
  );
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");

  const loadTicketTypes = useCallback(async () => {
    try {
      const result = await ticketTypeService.findForEvent(eventId);
      setTicketTypes(result);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Ticket Types.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    ticketTypeService
      .findForEvent(eventId)
      .then((result) => {
        setTicketTypes(result);
        setError("");
      })
      .catch((loadError) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Ticket Types.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [eventId]);

  async function createTicketType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const parsedPrice = Number(price);
    const parsedCapacity = Number(capacity);

    if (
      !cleanName ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      !Number.isInteger(parsedCapacity) ||
      parsedCapacity < 0
    ) {
      setError(
        "Enter a name, a non-negative price and a whole non-negative capacity.",
      );
      setSavedMessage("");
      return;
    }

    setIsSaving(true);
    setError("");
    setSavedMessage("");

    try {
      await ticketTypeService.create({
        eventId,
        name: cleanName,
        ...(description.trim() ? { description: description.trim() } : {}),
        price: parsedPrice,
        capacity: parsedCapacity,
        active: true,
      });
      setName("");
      setDescription("");
      setPrice("");
      setCapacity("");
      setSavedMessage(
        "Active Ticket Type created. Event readiness will update automatically.",
      );
      await loadTicketTypes();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create the Ticket Type.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-xl border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Admission catalogue
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Ticket Types
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Ticket Types define the admission options customers can book for this
          Event. At least one active Ticket Type is required before activation.
        </p>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Loading Ticket Types...
          </p>
        ) : ticketTypes.length ? (
          <div className="mt-6 space-y-3">
            {ticketTypes.map((ticketType) => (
              <article key={ticketType.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{ticketType.name}</h3>
                    {ticketType.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ticketType.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {ticketType.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Price</dt>
                    <dd className="mt-1 font-semibold">
                      {formatPrice(ticketType.price)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Capacity</dt>
                    <dd className="mt-1 font-semibold">
                      {ticketType.capacity}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-dashed p-5">
            <p className="font-medium">No Ticket Types yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create the first admission option for this Event.
            </p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={onReturnToReadiness}
        >
          Return to Event readiness
        </Button>
      </section>

      <section className="rounded-xl border bg-card p-6">
        {role === "OWNER" ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">
              Event setup
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Create a Ticket Type
            </h2>
            <form onSubmit={createTicketType} className="mt-6 space-y-5">
              <label className="block text-sm font-medium">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={200}
                  className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Description <span className="font-normal">(optional)</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Price (AUD)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    required
                    className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Capacity
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={capacity}
                    onChange={(event) => setCapacity(event.target.value)}
                    required
                    className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
                  />
                </label>
              </div>

              {error ? (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              ) : null}
              {savedMessage ? (
                <p role="status" className="text-sm font-medium text-emerald-700">
                  {savedMessage}
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? "Creating..." : "Create active Ticket Type"}
              </Button>
            </form>
          </>
        ) : (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Read-only access
            </p>
            <h2 className="mt-2 text-xl font-semibold">Ticket Type setup</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Event owners can create Ticket Types. You can review the current
              admission catalogue.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
