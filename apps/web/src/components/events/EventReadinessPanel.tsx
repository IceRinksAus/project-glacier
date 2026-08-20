"use client";

import { CheckCircle2, CircleAlert, CircleMinus } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import type { EventTab } from "@/components/events/EventTabs";
import {
  getAuthRoleSnapshot,
  getServerAuthRoleSnapshot,
  subscribeAuthSession,
} from "@/lib/auth";
import { EventReadiness, eventService } from "@/services/event.service";

interface Props {
  eventId: string;
  eventStatus: string;
  onNavigate: (tab: EventTab) => void;
  onActivated: () => void;
}

export function EventReadinessPanel({
  eventId,
  eventStatus,
  onNavigate,
  onActivated,
}: Props) {
  const [readiness, setReadiness] = useState<EventReadiness | null>(null);
  const role = useSyncExternalStore(
    subscribeAuthSession,
    getAuthRoleSnapshot,
    getServerAuthRoleSnapshot,
  );
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    eventService
      .getReadiness(eventId)
      .then(setReadiness)
      .catch((loadError) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Event readiness.",
        ),
      );
  }, [eventId]);

  async function activate() {
    setIsActivating(true);
    setError("");
    try {
      await eventService.updateStatus(eventId, "ACTIVE");
      onActivated();
    } catch (activationError) {
      setError(
        activationError instanceof Error
          ? activationError.message
          : "Unable to activate this Event.",
      );
    } finally {
      setIsActivating(false);
    }
  }

  return (
    <aside className="rounded-xl border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">
        Setup progress
      </p>
      {readiness ? (
        <>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Event readiness</span>
              <span className="font-semibold">{readiness.percentage}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${readiness.percentage}%` }}
              />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {readiness.items.map((item) => {
              const Icon =
                item.status === "COMPLETE"
                  ? CheckCircle2
                  : item.status === "NOT_REQUIRED"
                    ? CircleMinus
                    : CircleAlert;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.destinationTab)}
                  className="flex w-full items-start gap-3 rounded-lg border p-3 text-left hover:bg-muted/50"
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2 text-sm font-medium">
                      <span>{item.label}</span>
                      <span className="text-xs">
                        {item.status.replace("_", " ")}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.explanation}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {role === "OWNER" && eventStatus !== "ACTIVE" ? (
            <Button
              className="mt-6 w-full"
              disabled={!readiness.readyToActivate || isActivating}
              onClick={() => void activate()}
            >
              {isActivating ? "Activating..." : "Activate Event"}
            </Button>
          ) : null}
          {!readiness.readyToActivate ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Complete each required item before activation.
            </p>
          ) : null}
        </>
      ) : !error ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Checking readiness...
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
