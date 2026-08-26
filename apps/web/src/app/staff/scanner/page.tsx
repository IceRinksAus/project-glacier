"use client";

import {
  ArrowLeft,
  CheckCircle2,
  LogOut,
  Search,
  ShieldCheck,
  TicketCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ScannerCamera } from "@/components/scanner/ScannerCamera";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { clearAuthSession } from "@/lib/auth";

type ScannerMode = "GATE_ENTRY" | "TICKET_LOOKUP";
type ScannerResult =
  | "READY_TO_ADMIT"
  | "ENTRY_GRANTED"
  | "ALREADY_SCANNED"
  | "CANCELLED"
  | "NOT_YET_VALID"
  | "ENTRY_WINDOW_CLOSED"
  | "INVALID_FOR_EVENT"
  | "INVALID";

interface ScannerEvent {
  id: string;
  name: string;
  venueName: string | null;
  timezone: string | null;
  entryOpensMinutesBeforeStart: number;
  entryClosesMinutesAfterEnd: number;
}

interface TicketResult {
  result: ScannerResult;
  ticketNumber?: string;
  ticketType?: string;
  participantName?: string;
  eventName?: string;
  sessionName?: string | null;
  sessionStart?: string;
  sessionEnd?: string;
  entryOpensAt?: string;
  entryClosesAt?: string;
  issuedAt?: string;
  status?: string;
  checkedInAt?: string | null;
  replacementTicketNumber?: string | null;
}

const EVENT_KEY = "glacier_scanner_event";
const MODE_KEY = "glacier_scanner_mode";

const resultPresentation: Record<
  ScannerResult,
  { title: string; message: string; tone: string; Icon: typeof CheckCircle2 }
> = {
  READY_TO_ADMIT: {
    title: "Ready to admit",
    message: "This Ticket is active and inside its entry window.",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-950",
    Icon: ShieldCheck,
  },
  ENTRY_GRANTED: {
    title: "Entry granted",
    message: "The Ticket has been processed successfully.",
    tone: "border-emerald-500 bg-emerald-100 text-emerald-950",
    Icon: CheckCircle2,
  },
  ALREADY_SCANNED: {
    title: "Already scanned",
    message: "This Ticket has already been used for entry.",
    tone: "border-amber-400 bg-amber-50 text-amber-950",
    Icon: TriangleAlert,
  },
  CANCELLED: {
    title: "Cancelled Ticket",
    message: "Entry cannot be granted for this Ticket.",
    tone: "border-red-400 bg-red-50 text-red-950",
    Icon: XCircle,
  },
  NOT_YET_VALID: {
    title: "Too early",
    message: "The Ticket entry window has not opened yet.",
    tone: "border-sky-400 bg-sky-50 text-sky-950",
    Icon: TriangleAlert,
  },
  ENTRY_WINDOW_CLOSED: {
    title: "Entry window closed",
    message: "The configured entry window has ended.",
    tone: "border-red-400 bg-red-50 text-red-950",
    Icon: XCircle,
  },
  INVALID_FOR_EVENT: {
    title: "Invalid for this Event",
    message: "This Ticket cannot be used or disclosed for the selected Event.",
    tone: "border-red-400 bg-red-50 text-red-950",
    Icon: XCircle,
  },
  INVALID: {
    title: "Ticket not recognised",
    message: "Check the Ticket and try again.",
    tone: "border-red-400 bg-red-50 text-red-950",
    Icon: XCircle,
  },
};

function formatDate(value?: string, timezone?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone || undefined,
  }).format(new Date(value));
}

export default function StaffScannerPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ScannerEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [mode, setMode] = useState<ScannerMode>("GATE_ENTRY");
  const [result, setResult] = useState<TicketResult | null>(null);
  const [activeToken, setActiveToken] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [confirmLookupProcess, setConfirmLookupProcess] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId),
    [eventId, events],
  );

  useEffect(() => {
    api
      .get<ScannerEvent[]>("/staff/scanner/events")
      .then((availableEvents) => {
        setEvents(availableEvents);
        const savedEvent = localStorage.getItem(EVENT_KEY);
        const savedMode = localStorage.getItem(MODE_KEY) as ScannerMode | null;
        const initialEvent = availableEvents.some(({ id }) => id === savedEvent)
          ? savedEvent!
          : (availableEvents[0]?.id ?? "");
        setEventId(initialEvent);
        if (savedMode === "GATE_ENTRY" || savedMode === "TICKET_LOOKUP") {
          setMode(savedMode);
        }
      })
      .catch((loadError) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Events.",
        ),
      );
  }, []);

  function selectEvent(value: string) {
    setEventId(value);
    localStorage.setItem(EVENT_KEY, value);
    resetScan();
  }

  function selectMode(value: ScannerMode) {
    setMode(value);
    localStorage.setItem(MODE_KEY, value);
    resetScan();
  }

  function resetScan() {
    setResult(null);
    setActiveToken("");
    setManualToken("");
    setConfirmLookupProcess(false);
    setError("");
  }

  const lookup = useCallback(
    async (rawToken: string) => {
      const token = rawToken.trim().toLowerCase();
      if (!eventId || isWorking || result) return;
      if (!/^[a-f0-9]{64}$/.test(token)) {
        setError("Enter or scan a valid Glacier Ticket code.");
        return;
      }
      setIsWorking(true);
      setError("");
      try {
        const response = await api.post<TicketResult>(
          `/staff/scanner/events/${eventId}/${mode === "GATE_ENTRY" ? "admit" : "validate"}`,
          { token, mode },
        );
        setActiveToken(token);
        setResult(response);
      } catch (lookupError) {
        setError(
          lookupError instanceof Error
            ? lookupError.message
            : "Unable to verify this Ticket.",
        );
      } finally {
        setIsWorking(false);
      }
    },
    [eventId, isWorking, mode, result],
  );

  async function processTicket() {
    if (!eventId || !activeToken || isWorking) return;
    setIsWorking(true);
    setError("");
    try {
      const response = await api.post<TicketResult>(
        `/staff/scanner/events/${eventId}/admit`,
        { token: activeToken, mode },
      );
      setResult(response);
      setConfirmLookupProcess(false);
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "Unable to process this Ticket. Entry has not been granted.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  function submitManual(event: FormEvent) {
    event.preventDefault();
    void lookup(manualToken);
  }

  function signOut() {
    clearAuthSession();
    router.push("/login");
  }

  const presentation = result ? resultPresentation[result.result] : null;
  const eligible = result?.result === "READY_TO_ADMIT";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Glacier Staff
            </p>
            <h1 className="text-lg font-bold">Ticket Scanner</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <label htmlFor="scanner-event" className="text-sm font-bold">
              Active Event
            </label>
            <select
              id="scanner-event"
              value={eventId}
              onChange={(event) => selectEvent(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border bg-white px-3 font-medium"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            {selectedEvent ? (
              <div className="mt-3 text-sm text-slate-600">
                <p>{selectedEvent.venueName || "Venue not specified"}</p>
                <p className="mt-1">
                  Opens {selectedEvent.entryOpensMinutesBeforeStart} min before
                  · closes {selectedEvent.entryClosesMinutesAfterEnd} min after
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border bg-white p-2 shadow-sm">
            {(["GATE_ENTRY", "TICKET_LOOKUP"] as ScannerMode[]).map((value) => (
              <button
                key={value}
                onClick={() => selectMode(value)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${mode === value ? "bg-slate-950 text-white" : "hover:bg-slate-100"}`}
              >
                {value === "GATE_ENTRY" ? (
                  <TicketCheck className="size-5" />
                ) : (
                  <Search className="size-5" />
                )}
                <span>
                  <span className="block font-bold">
                    {value === "GATE_ENTRY" ? "Gate Entry" : "Ticket Lookup"}
                  </span>
                  <span
                    className={`block text-xs ${mode === value ? "text-slate-300" : "text-slate-500"}`}
                  >
                    {value === "GATE_ENTRY"
                      ? "Automatic admission"
                      : "Detailed POS view"}
                  </span>
                </span>
              </button>
            ))}
          </section>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-500">
                {mode === "GATE_ENTRY"
                  ? "GATE ENTRY MODE"
                  : "TICKET LOOKUP MODE"}
              </p>
              <h2 className="text-2xl font-bold">
                {result ? "Ticket result" : "Ready to scan"}
              </h2>
            </div>
            {result ? (
              <Button variant="outline" onClick={resetScan}>
                <ArrowLeft className="size-4" /> Scan next
              </Button>
            ) : null}
          </div>

          {!result ? (
            <div className="space-y-4">
              <ScannerCamera
                active={Boolean(eventId) && !isWorking}
                onDetected={(token) => void lookup(token)}
              />
              <form
                onSubmit={submitManual}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <label htmlFor="manual-ticket" className="text-sm font-bold">
                  Manual or hardware scanner entry
                </label>
                {mode === "GATE_ENTRY" ? (
                  <p className="mt-1 text-sm text-slate-600">
                    A valid scan processes entry automatically.
                  </p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <input
                    id="manual-ticket"
                    value={manualToken}
                    onChange={(event) => setManualToken(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      void lookup(event.currentTarget.value);
                    }}
                    placeholder="64-character Ticket code"
                    autoComplete="off"
                    className="h-12 min-w-0 flex-1 rounded-xl border px-3 font-mono text-sm"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isWorking || !eventId}
                  >
                    {mode === "GATE_ENTRY" ? "Scan ticket" : "Look up"}
                  </Button>
                </div>
              </form>
            </div>
          ) : presentation ? (
            <div
              className={`rounded-3xl border-2 p-5 shadow-sm sm:p-7 ${presentation.tone}`}
            >
              <div className="flex items-start gap-4">
                <presentation.Icon className="mt-1 size-10 shrink-0" />
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tight">
                    {result.result === "CANCELLED" &&
                    result.replacementTicketNumber
                      ? "Replaced Ticket"
                      : presentation.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium">
                    {result.result === "CANCELLED" &&
                    result.replacementTicketNumber
                      ? `Entry denied. Use replacement Ticket ${result.replacementTicketNumber}.`
                      : presentation.message}
                  </p>
                </div>
              </div>

              {result.ticketNumber ? (
                <dl
                  className={`mt-6 grid gap-4 rounded-2xl bg-white/75 p-4 ${mode === "TICKET_LOOKUP" ? "sm:grid-cols-2" : ""}`}
                >
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">
                      Participant
                    </dt>
                    <dd className="mt-1 text-xl font-bold">
                      {result.participantName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">
                      Ticket
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {result.ticketNumber} · {result.ticketType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">
                      Session
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {result.sessionName || "Event admission"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">
                      Session time
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {formatDate(result.sessionStart, selectedEvent?.timezone)}
                    </dd>
                  </div>
                  {mode === "TICKET_LOOKUP" ? (
                    <>
                      <div>
                        <dt className="text-xs font-bold uppercase text-slate-500">
                          Entry window
                        </dt>
                        <dd className="mt-1 font-semibold">
                          {formatDate(
                            result.entryOpensAt,
                            selectedEvent?.timezone,
                          )}{" "}
                          –{" "}
                          {formatDate(
                            result.entryClosesAt,
                            selectedEvent?.timezone,
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase text-slate-500">
                          Current status
                        </dt>
                        <dd className="mt-1 font-semibold">{result.status}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase text-slate-500">
                          Issued
                        </dt>
                        <dd className="mt-1 font-semibold">
                          {formatDate(result.issuedAt, selectedEvent?.timezone)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase text-slate-500">
                          Previous entry
                        </dt>
                        <dd className="mt-1 font-semibold">
                          {result.checkedInAt
                            ? formatDate(
                                result.checkedInAt,
                                selectedEvent?.timezone,
                              )
                            : "Not processed"}
                        </dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              ) : null}

              {error ? (
                <p className="mt-4 rounded-xl bg-white p-3 font-semibold text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {eligible &&
                mode === "TICKET_LOOKUP" &&
                !confirmLookupProcess ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="min-h-14 flex-1 text-lg"
                    onClick={() => setConfirmLookupProcess(true)}
                  >
                    Process ticket
                  </Button>
                ) : null}
                {eligible &&
                mode === "TICKET_LOOKUP" &&
                confirmLookupProcess ? (
                  <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 sm:flex-row sm:items-center">
                    <p className="flex-1 text-sm font-bold">
                      Confirm entry for {result.participantName}?
                    </p>
                    <Button
                      onClick={() => void processTicket()}
                      disabled={isWorking}
                    >
                      {isWorking ? "Processing..." : "Confirm entry"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmLookupProcess(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : null}
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-14"
                  onClick={resetScan}
                >
                  {result.result === "ENTRY_GRANTED"
                    ? "Scan next"
                    : "Close without processing"}
                </Button>
              </div>
            </div>
          ) : null}

          {error && !result ? (
            <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 font-semibold text-red-800">
              {error}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
