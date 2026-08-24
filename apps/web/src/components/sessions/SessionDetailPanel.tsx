"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  SessionDetail,
  sessionService,
} from "@/services/session.service";

import { EditSessionForm } from "./EditSessionForm";

interface SessionDetailPanelProps {
  sessionId: string | null;
  eventTimezone: string | null;
  onClose: () => void;
  onSessionChanged: () => Promise<void>;
}

function getTimeZone(
  eventTimezone: string | null,
) {
  return eventTimezone ?? "UTC";
}

function formatDate(
  value: string,
  timeZone: string,
) {
  return new Date(
    value,
  ).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone,
  });
}

function formatTime(
  value: string,
  timeZone: string,
) {
  return new Date(
    value,
  ).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

export function SessionDetailPanel({
  sessionId,
  eventTimezone,
  onClose,
  onSessionChanged,
}: SessionDetailPanelProps) {
  const [session, setSession] =
    useState<SessionDetail | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [isEditing, setIsEditing] =
    useState(false);

  const [
    isConfirmingCancellation,
    setIsConfirmingCancellation,
  ] = useState(false);

  const [
    isCancelling,
    setIsCancelling,
  ] = useState(false);

  const [
    cancellationError,
    setCancellationError,
  ] = useState("");

  const [
    isConfirmingDeletion,
    setIsConfirmingDeletion,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    deletionError,
    setDeletionError,
  ] = useState("");

  useEffect(() => {
    if (!sessionId) {
      const reset = window.setTimeout(() => {
        setSession(null);
        setError("");
        setIsEditing(false);

        setIsConfirmingCancellation(
          false,
        );

        setCancellationError("");

        setIsConfirmingDeletion(
          false,
        );

        setDeletionError("");
      }, 0);

      return () => window.clearTimeout(reset);
    }

    const currentSessionId =
      sessionId;

    let cancelled = false;

    async function loadSession() {
      try {
        setIsLoading(true);
        setError("");

        setCancellationError("");
        setDeletionError("");

        setIsConfirmingCancellation(
          false,
        );

        setIsConfirmingDeletion(
          false,
        );

        const data =
          await sessionService.getSession(
            currentSessionId,
          );

        if (!cancelled) {
          setSession(data);
          setIsEditing(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load session",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const timeZone = getTimeZone(
    session?.event.timezone ??
      eventTimezone,
  );

  const bookedQuantity =
    useMemo(() => {
      if (!session) {
        return 0;
      }

      return session.bookings
        .filter((booking) =>
          [
            "RESERVED",
            "CONFIRMED",
          ].includes(
            booking.status,
          ),
        )
        .reduce(
          (total, booking) =>
            total +
            booking.items.reduce(
              (
                itemTotal,
                item,
              ) =>
                itemTotal +
                item.quantity,
              0,
            ),
          0,
        );
    }, [session]);

  const availableCapacity =
    session
      ? Math.max(
          session.capacity -
            bookedQuantity,
          0,
        )
      : 0;

  const hasBookings =
    (session?.bookings.length ?? 0) >
    0;

  const canDelete =
    session !== null &&
    !hasBookings;

  async function handleCancellation() {
    if (!session) {
      return;
    }

    try {
      setIsCancelling(true);

      setCancellationError("");

      await sessionService.cancelSession(
        session.id,
      );

      await onSessionChanged();

      const refreshedSession =
        await sessionService.getSession(
          session.id,
        );

      setSession(
        refreshedSession,
      );

      setIsConfirmingCancellation(
        false,
      );
    } catch (cancelError) {
      setCancellationError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unable to cancel session",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleDeletion() {
    if (!session || !canDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeletionError("");

      await sessionService.deleteSession(
        session.id,
      );

      await onSessionChanged();

      onClose();
    } catch (deleteError) {
      setDeletionError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete session",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (!sessionId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close session details"
        onClick={onClose}
      />

      <aside className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b p-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {isEditing
                ? "Edit session"
                : "Session details"}
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {session?.name ??
                "Loading session..."}
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close session details"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="rounded-xl border bg-card p-6">
              Loading session...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {!isLoading &&
          !error &&
          session &&
          isEditing ? (
            <EditSessionForm
              session={session}
              eventTimezone={
                eventTimezone
              }
              onCancel={() =>
                setIsEditing(false)
              }
              onSaved={async (
                updatedSession,
              ) => {
                setSession(
                  updatedSession,
                );

                await onSessionChanged();

                const refreshedSession =
                  await sessionService.getSession(
                    session.id,
                  );

                setSession(
                  refreshedSession,
                );

                setIsEditing(false);
              }}
            />
          ) : null}

          {!isLoading &&
          !error &&
          session &&
          !isEditing ? (
            <div className="space-y-6">
              <section className="rounded-xl border bg-card p-5">
                <p className="text-sm text-muted-foreground">
                  Date
                </p>

                <p className="mt-1 font-semibold">
                  {formatDate(
                    session.startDate,
                    timeZone,
                  )}
                </p>

                <p className="mt-4 text-sm text-muted-foreground">
                  Time
                </p>

                <p className="mt-1 font-semibold">
                  {formatTime(
                    session.startDate,
                    timeZone,
                  )}{" "}
                  –{" "}
                  {formatTime(
                    session.endDate,
                    timeZone,
                  )}
                </p>
              </section>

              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-5">
                  <p className="text-sm text-muted-foreground">
                    Capacity
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {session.capacity}
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <p className="text-sm text-muted-foreground">
                    Booked
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {bookedQuantity}
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <p className="text-sm text-muted-foreground">
                    Available
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {
                      availableCapacity
                    }
                  </p>
                </div>
              </section>

              <section className="rounded-xl border bg-card p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Status
                    </p>

                    <p className="mt-1 font-semibold">
                      {session.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Schedule exception
                    </p>

                    <p className="mt-1 font-semibold">
                      {session.scheduleExceptionType ??
                        "NONE"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">
                  Schedule origin
                </h3>

                {session.operationalScheduleId ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        Operational schedule
                      </p>

                      <p className="mt-1 break-all font-medium">
                        {
                          session.operationalScheduleId
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Schedule entry
                      </p>

                      <p className="mt-1 break-all font-medium">
                        {session.scheduleEntryId ??
                          "Not available"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    This is a standalone
                    session.
                  </p>
                )}
              </section>

              <section className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">
                  Bookings
                </h3>

                {session.bookings
                  .length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No bookings for this
                    session.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {
                        session.bookings
                          .length
                      }{" "}
                      booking
                      {session.bookings
                        .length === 1
                        ? ""
                        : "s"}{" "}
                      attached to this
                      session.
                    </p>

                    <p className="mt-3 text-sm font-medium">
                      Sessions with
                      bookings cannot be
                      permanently deleted.
                    </p>
                  </>
                )}
              </section>

              {isConfirmingCancellation ? (
                <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                  <h3 className="font-semibold">
                    Cancel this session?
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    This will mark the
                    Session as CANCELLED.
                    It will remain in
                    Glacier&apos;s records
                    and will no longer be
                    available for booking.
                  </p>

                  {bookedQuantity > 0 ? (
                    <p className="mt-3 text-sm font-medium">
                      This Session currently
                      has {bookedQuantity}{" "}
                      reserved or confirmed{" "}
                      admission
                      {bookedQuantity === 1
                        ? ""
                        : "s"}.
                    </p>
                  ) : null}

                  {session.operationalScheduleId ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      This generated Session
                      will also be marked as
                      a CANCELLED schedule
                      exception.
                    </p>
                  ) : null}

                  {cancellationError ? (
                    <div className="mt-4 rounded-lg border border-destructive/30 bg-background p-4 text-sm text-destructive">
                      {
                        cancellationError
                      }
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsConfirmingCancellation(
                          false,
                        );

                        setCancellationError(
                          "",
                        );
                      }}
                      disabled={
                        isCancelling
                      }
                    >
                      Keep Session
                    </Button>

                    <Button
                      type="button"
                      onClick={() =>
                        void handleCancellation()
                      }
                      disabled={
                        isCancelling
                      }
                    >
                      {isCancelling
                        ? "Cancelling..."
                        : "Confirm Cancellation"}
                    </Button>
                  </div>
                </section>
              ) : null}

              {isConfirmingDeletion ? (
                <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                  <h3 className="font-semibold">
                    Permanently delete this
                    session?
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    This action permanently
                    removes the Session from
                    Glacier and cannot be
                    undone.
                  </p>

                  {session.operationalScheduleId ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      The originating
                      Operational Schedule
                      will remain unchanged.
                      Only this generated
                      Session occurrence
                      will be deleted.
                    </p>
                  ) : null}

                  {deletionError ? (
                    <div className="mt-4 rounded-lg border border-destructive/30 bg-background p-4 text-sm text-destructive">
                      {
                        deletionError
                      }
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsConfirmingDeletion(
                          false,
                        );

                        setDeletionError(
                          "",
                        );
                      }}
                      disabled={
                        isDeleting
                      }
                    >
                      Keep Session
                    </Button>

                    <Button
                      type="button"
                      onClick={() =>
                        void handleDeletion()
                      }
                      disabled={
                        isDeleting
                      }
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete Permanently"}
                    </Button>
                  </div>
                </section>
              ) : null}

              {!isConfirmingCancellation &&
              !isConfirmingDeletion ? (
                <div className="flex flex-wrap gap-3 border-t pt-6">
                  <Button
                    type="button"
                    onClick={() =>
                      setIsEditing(true)
                    }
                    disabled={
                      session.status ===
                      "CANCELLED"
                    }
                  >
                    Edit Session
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCancellationError(
                        "",
                      );

                      setIsConfirmingCancellation(
                        true,
                      );
                    }}
                    disabled={
                      session.status ===
                      "CANCELLED"
                    }
                  >
                    Cancel Session
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDeletionError(
                        "",
                      );

                      setIsConfirmingDeletion(
                        true,
                      );
                    }}
                    disabled={
                      !canDelete
                    }
                  >
                    Delete Session
                  </Button>
                </div>
              ) : null}

              {!canDelete ? (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium">
                    Deletion unavailable
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    This Session has one or
                    more Booking records and
                    must be preserved.
                    Cancel the Session
                    instead if it should no
                    longer operate.
                  </p>
                </div>
              ) : null}

              {session.status ===
              "CANCELLED" ? (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium">
                    Session cancelled
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    This Session has been
                    cancelled and can no
                    longer be edited.
                  </p>

                  {canDelete ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Because it has no
                      bookings, it may still
                      be permanently deleted.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
