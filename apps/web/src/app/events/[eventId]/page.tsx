"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use } from "react";

import { EventHeader } from "@/components/events/EventHeader";
import { EventEntryPolicySettings } from "@/components/events/EventEntryPolicySettings";
import { EventOverview } from "@/components/events/EventOverview";
import {
  EventTabs,
  parseEventTab,
} from "@/components/events/EventTabs";
import type { EventTab } from "@/components/events/EventTabs";
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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { event, isLoading, error } = useEvent(eventId);
  const activeTab = parseEventTab(searchParams.get("tab"));

  function selectTab(tab: EventTab) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (tab === "Overview") {
      nextSearchParams.delete("tab");
    } else {
      nextSearchParams.set("tab", tab);
    }
    const query = nextSearchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

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

            <EventTabs activeTab={activeTab} onChange={selectTab} />

            {activeTab === "Overview" ? (
              <EventOverview
                eventId={event.id}
                name={event.name}
                description={event.description}
                status={event.status}
                slug={event.slug}
                startDate={event.startDate}
                endDate={event.endDate}
                onNavigate={selectTab}
                onActivated={() => window.location.reload()}
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

            {activeTab === "Settings" ? (
              <EventEntryPolicySettings
                eventId={event.id}
                initialOpensMinutesBeforeStart={
                  event.entryOpensMinutesBeforeStart
                }
                initialClosesMinutesAfterEnd={event.entryClosesMinutesAfterEnd}
              />
            ) : null}

            {activeTab !== "Overview" &&
            activeTab !== "Sessions" &&
            activeTab !== "Waiver" &&
            activeTab !== "Settings" ? (
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
