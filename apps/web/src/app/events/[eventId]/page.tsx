"use client";

import { use, useState } from "react";

import { EventHeader } from "@/components/events/EventHeader";
import { EventOverview } from "@/components/events/EventOverview";
import { EventTabs } from "@/components/events/EventTabs";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { SessionsWorkspace } from "@/components/sessions/SessionsWorkspace";
import { WaiverWorkspace } from "@/components/waiver/WaiverWorkspace";
import { useEvent } from "@/hooks/useEvent";

interface EventWorkspacePageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default function EventWorkspacePage({
  params,
}: EventWorkspacePageProps) {
  const { eventId } = use(params);
  const { event, isLoading, error } = useEvent(eventId);
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <PlatformShell>
      <div className="flex flex-col gap-6">
        {isLoading ? (
          <div className="rounded-xl border bg-card p-6">Loading event...</div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && event ? (
          <>
            <EventHeader
              name={event.name}
              status={event.status}
              startDate={event.startDate}
              endDate={event.endDate}
            />

            <EventTabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "Overview" ? (
              <EventOverview
                name={event.name}
                description={event.description}
                status={event.status}
                slug={event.slug}
                startDate={event.startDate}
                endDate={event.endDate}
              />
            ) : null}

            {activeTab === "Sessions" ? (
              <SessionsWorkspace
                eventId={event.id}
                eventStartDate={event.startDate}
                eventEndDate={event.endDate}
                eventTimezone={event.timezone}
              />
            ) : null}

            {activeTab === "Waiver" ? (
              <WaiverWorkspace
                eventId={event.id}
                activityType={event.activityType}
                jurisdiction={event.jurisdiction}
              />
            ) : null}

            {activeTab !== "Overview" &&
            activeTab !== "Sessions" &&
            activeTab !== "Waiver" ? (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold">{activeTab}</h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  This section will be completed in a future sprint.
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </PlatformShell>
  );
}
