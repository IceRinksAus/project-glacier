"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

interface ReservationCountdownProps {
  reservedUntil: string;
}

function getRemainingSeconds(
  reservedUntil: string,
) {
  const expiresAt =
    new Date(reservedUntil).getTime();

  const now = Date.now();

  return Math.max(
    0,
    Math.ceil(
      (expiresAt - now) / 1000,
    ),
  );
}

export function ReservationCountdown({
  reservedUntil,
}: ReservationCountdownProps) {
  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(() =>
    getRemainingSeconds(
      reservedUntil,
    ),
  );

  useEffect(() => {
    const reset = window.setTimeout(
      () => {
        setRemainingSeconds(
          getRemainingSeconds(
            reservedUntil,
          ),
        );
      },
      0,
    );

    const interval =
      window.setInterval(() => {
        const nextRemaining =
          getRemainingSeconds(
            reservedUntil,
          );

        setRemainingSeconds(
          nextRemaining,
        );

        if (
          nextRemaining <= 0
        ) {
          window.clearInterval(
            interval,
          );
        }
      }, 1000);

    return () => {
      window.clearTimeout(reset);
      window.clearInterval(
        interval,
      );
    };
  }, [reservedUntil]);

  const isExpired =
    remainingSeconds <= 0;

  const formattedRemaining =
    useMemo(() => {
      const minutes =
        Math.floor(
          remainingSeconds / 60,
        );

      const seconds =
        remainingSeconds % 60;

      return `${String(
        minutes,
      ).padStart(
        2,
        "0",
      )}:${String(
        seconds,
      ).padStart(
        2,
        "0",
      )}`;
    }, [remainingSeconds]);

  const expiryTime =
    new Date(
      reservedUntil,
    ).toLocaleTimeString(
      "en-AU",
      {
        hour: "numeric",
        minute: "2-digit",
      },
    );

  if (isExpired) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="font-medium text-destructive">
          Reservation expired
        </p>

        <p className="mt-1 text-sm text-destructive">
          This temporary reservation
          has expired. Please start a
          new booking to reserve
          tickets again.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">
            Your tickets are
            temporarily reserved
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Reservation expires at{" "}
            {expiryTime}.
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-sm text-muted-foreground">
            Time remaining
          </p>

          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formattedRemaining}
          </p>
        </div>
      </div>
    </div>
  );
}
