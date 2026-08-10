"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  CreateScheduleDialog,
  SchedulePattern,
} from "./CreateScheduleDialog";
import { ScheduleBuilder } from "./ScheduleBuilder";
import { SessionsTimeline } from "./SessionsTimeline";

interface SessionsWorkspaceProps {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
}

export function SessionsWorkspace({
  eventId,
  eventStartDate,
  eventEndDate,
}: SessionsWorkspaceProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedPattern, setSelectedPattern] =
    useState<SchedulePattern | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  function handlePatternSelected(
    pattern: SchedulePattern,
  ) {
    setSelectedPattern(pattern);
    setDialogOpen(false);
  }

  function handleBuilderBack() {
    setSelectedPattern(null);
    setDialogOpen(true);
  }

  function handleBuilderCancel() {
    setSelectedPattern(null);
  }

  function handleBuilderComplete() {
    setSelectedPattern(null);

    setRefreshKey((currentKey) => currentKey + 1);
  }

if (selectedPattern) {
  return (
    <div className="flex justify-center py-4">
      <ScheduleBuilder
        eventId={eventId}
        pattern={selectedPattern}
        eventStartDate={eventStartDate}
        eventEndDate={eventEndDate}
        onBack={handleBuilderBack}
        onCancel={handleBuilderCancel}
        onComplete={handleBuilderComplete}
      />
    </div>
  );
}

  return (
    <>
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Sessions
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage the operational schedule for this event.
              </p>
            </div>

            <Button
              onClick={() => setDialogOpen(true)}
            >
              + Create Schedule
            </Button>
          </div>
        </section>

        <SessionsTimeline
          key={refreshKey}
          eventId={eventId}
        />
      </div>

      <CreateScheduleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectPattern={handlePatternSelected}
      />
    </>
  );
}