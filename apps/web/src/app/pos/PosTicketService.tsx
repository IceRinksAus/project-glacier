"use client";

import { FormEvent, useState } from "react";
import { ScanLine, ShieldCheck, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScannerCamera } from "@/components/scanner/ScannerCamera";
import {
  PosBookingTicketLookup,
  PosTicketLookup,
  posService,
} from "@/services/pos.service";

const ticketReferencePattern =
  /^(?:PG-[A-Z0-9-]{1,80}|TKT-[A-Z0-9-]{3,80}|[a-f0-9]{64}|gt1_[a-f0-9]{32}_[A-Za-z0-9_-]{43})$/i;

function isBookingLookup(
  lookup: PosTicketLookup | PosBookingTicketLookup,
): lookup is PosBookingTicketLookup {
  return "referenceType" in lookup && lookup.referenceType === "BOOKING";
}

export function PosTicketService({ eventId }: { eventId: string }) {
  const [token, setToken] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [result, setResult] = useState<
    PosTicketLookup | PosBookingTicketLookup | null
  >(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  async function lookupCredential(rawToken: string) {
    const rawReference = rawToken.trim();
    const reference = /^(?:TKT|PG)-/i.test(rawReference)
      ? rawReference.toUpperCase()
      : rawReference;
    if (!eventId) return setError("Choose an Event before scanning a Ticket.");
    if (!ticketReferencePattern.test(reference))
      return setError(
        "Enter a Booking or Ticket number, or scan a valid Glacier Ticket code.",
      );
    setWorking(true);
    setError("");
    try {
      setResult(await posService.lookupTicket(eventId, reference));
      setActiveToken(reference);
      setToken("");
      setCameraActive(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to look up this Ticket.",
      );
    } finally {
      setWorking(false);
    }
  }

  function lookup(event: FormEvent) {
    event.preventDefault();
    void lookupCredential(token);
  }

  async function admit(reference = activeToken, bookingTicketIndex?: number) {
    if (!reference) return;
    setWorking(true);
    setError("");
    try {
      const admitted = await posService.admitTicket(eventId, reference);
      setResult((current) => {
        if (current && isBookingLookup(current) && bookingTicketIndex != null) {
          return {
            ...current,
            tickets: current.tickets.map((ticket, index) =>
              index === bookingTicketIndex ? admitted : ticket,
            ),
          };
        }
        return admitted;
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Entry was not recorded.",
      );
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    setToken("");
    setActiveToken("");
    setResult(null);
    setError("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <ScanLine className="size-7 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">Scan existing Ticket</h2>
            <p className="text-sm text-muted-foreground">
              Scan the QR code, or enter the Booking or Ticket number shown
              after sale.
            </p>
          </div>
        </div>
        <form
          onSubmit={lookup}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <label className="flex-1 text-sm font-medium">
            Booking number, Ticket number or QR code
            <input
              autoFocus
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="mt-2 h-14 w-full rounded-xl border px-4 font-mono"
              placeholder="PG-…, TKT-… or scan QR code"
            />
          </label>
          <Button
            type="submit"
            className="h-14 self-end px-8"
            disabled={working}
          >
            {working ? "Checking…" : "Look up Ticket"}
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => setCameraActive((current) => !current)}
        >
          {cameraActive ? "Close camera" : "Use camera"}
        </Button>
        {cameraActive ? (
          <div className="mt-4 max-w-xl">
            <ScannerCamera
              active
              onDetected={(detectedToken) =>
                void lookupCredential(detectedToken)
              }
            />
          </div>
        ) : null}
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          Lookup is read-only. It never consumes a Ticket or grants entry.
        </div>
        {error ? (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        ) : null}
      </section>

      <aside className="rounded-2xl border bg-card p-6 shadow-lg">
        {!result ? (
          <div className="text-center text-muted-foreground">
            <ScanLine className="mx-auto size-10" />
            <p className="mt-3 font-medium">Ready for Ticket lookup</p>
          </div>
        ) : isBookingLookup(result) ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Booking lookup
              </p>
              <h3 className="text-xl font-semibold">{result.bookingNumber}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.tickets.length} Ticket
                {result.tickets.length === 1 ? "" : "s"}
              </p>
            </div>
            {result.tickets.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                No Tickets were found for this Booking and Event.
              </p>
            ) : (
              result.tickets.map((ticket, index) => (
                <article
                  key={ticket.ticketNumber ?? index}
                  className="rounded-xl border p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {ticket.result.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 font-semibold">
                    {ticket.ticketType || "Ticket"}
                  </p>
                  {ticket.ticketNumber ? (
                    <p className="mt-1 text-sm">{ticket.ticketNumber}</p>
                  ) : null}
                  {ticket.participantName ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.participantName}
                    </p>
                  ) : null}
                  {ticket.result === "READY_TO_ADMIT" && ticket.ticketNumber ? (
                    <Button
                      className="mt-3 w-full"
                      disabled={working}
                      onClick={() => void admit(ticket.ticketNumber, index)}
                    >
                      Confirm and admit this Ticket
                    </Button>
                  ) : null}
                </article>
              ))
            )}
            <Button variant="outline" className="w-full" onClick={reset}>
              Look up another Booking or Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {result.result === "READY_TO_ADMIT" ||
              result.result === "ENTRY_GRANTED" ? (
                <ShieldCheck className="size-7 text-emerald-600" />
              ) : (
                <TriangleAlert className="size-7 text-amber-600" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {result.result.replaceAll("_", " ")}
                </p>
                <h3 className="text-xl font-semibold">
                  {result.ticketType || "Ticket"}
                </h3>
              </div>
            </div>
            {result.ticketNumber ? (
              <p>
                <strong>Ticket:</strong> {result.ticketNumber}
              </p>
            ) : null}
            {result.participantName ? (
              <p>
                <strong>Guest:</strong> {result.participantName}
              </p>
            ) : null}
            {result.sessionName ? (
              <p>
                <strong>Session:</strong> {result.sessionName}
              </p>
            ) : null}
            {result.result === "READY_TO_ADMIT" ? (
              <Button
                className="h-14 w-full"
                disabled={working}
                onClick={() => void admit()}
              >
                Confirm and admit this Ticket
              </Button>
            ) : null}
            <Button variant="outline" className="w-full" onClick={reset}>
              Scan next Ticket
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}
