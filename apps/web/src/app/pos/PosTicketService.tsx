"use client";

import { FormEvent, useState } from "react";
import { ScanLine, ShieldCheck, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PosTicketLookup, posService } from "@/services/pos.service";

const credentialPattern = /^(?:[a-f0-9]{64}|gt1_[a-f0-9]{32}_[A-Za-z0-9_-]{43})$/;

export function PosTicketService({ eventId }: { eventId: string }) {
  const [token, setToken] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [result, setResult] = useState<PosTicketLookup | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function lookup(event: FormEvent) {
    event.preventDefault();
    const credential = token.trim().toLowerCase();
    if (!eventId) return setError("Choose an Event before scanning a Ticket.");
    if (!credentialPattern.test(credential))
      return setError("Enter or scan a valid Glacier Ticket code.");
    setWorking(true);
    setError("");
    try {
      setResult(await posService.lookupTicket(eventId, credential));
      setActiveToken(credential);
      setToken("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to look up this Ticket.");
    } finally {
      setWorking(false);
    }
  }

  async function admit() {
    if (!activeToken) return;
    setWorking(true);
    setError("");
    try {
      setResult(await posService.admitTicket(eventId, activeToken));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Entry was not recorded.");
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
              Camera and USB/Bluetooth scanners may enter the signed code here.
            </p>
          </div>
        </div>
        <form onSubmit={lookup} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1 text-sm font-medium">
            Ticket code
            <input
              autoFocus
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="mt-2 h-14 w-full rounded-xl border px-4 font-mono"
              placeholder="Scan or enter Ticket code"
            />
          </label>
          <Button type="submit" className="h-14 self-end px-8" disabled={working}>
            {working ? "Checking…" : "Look up Ticket"}
          </Button>
        </form>
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          Lookup is read-only. It never consumes a Ticket or grants entry.
        </div>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </section>

      <aside className="rounded-2xl border bg-card p-6 shadow-lg">
        {!result ? (
          <div className="text-center text-muted-foreground">
            <ScanLine className="mx-auto size-10" />
            <p className="mt-3 font-medium">Ready for Ticket lookup</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {result.result === "READY_TO_ADMIT" || result.result === "ENTRY_GRANTED" ? (
                <ShieldCheck className="size-7 text-emerald-600" />
              ) : (
                <TriangleAlert className="size-7 text-amber-600" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {result.result.replaceAll("_", " ")}
                </p>
                <h3 className="text-xl font-semibold">{result.ticketType || "Ticket"}</h3>
              </div>
            </div>
            {result.ticketNumber ? <p><strong>Ticket:</strong> {result.ticketNumber}</p> : null}
            {result.participantName ? <p><strong>Guest:</strong> {result.participantName}</p> : null}
            {result.sessionName ? <p><strong>Session:</strong> {result.sessionName}</p> : null}
            {result.result === "READY_TO_ADMIT" ? (
              <Button className="h-14 w-full" disabled={working} onClick={() => void admit()}>
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
