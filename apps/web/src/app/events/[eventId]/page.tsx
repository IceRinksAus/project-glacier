"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { use } from "react";

import { EventHeader } from "@/components/events/EventHeader";
import { EventSetupGuide } from "@/components/events/EventSetupGuide";
import { EventSettingsWorkspace } from "@/components/events/EventSettingsWorkspace";
import { EventOverview } from "@/components/events/EventOverview";
import { EventBrandingWorkspace } from "@/components/events/EventBrandingWorkspace";
import { EventTabs, parseEventTab } from "@/components/events/EventTabs";
import type { EventTab } from "@/components/events/EventTabs";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { ProductsWorkspace } from "@/components/products/ProductsWorkspace";
import { SessionsWorkspace } from "@/components/sessions/SessionsWorkspace";
import { TicketTypesWorkspace } from "@/components/ticket-types/TicketTypesWorkspace";
import { WaiverWorkspace } from "@/components/waiver/WaiverWorkspace";
import { useEvent } from "@/hooks/useEvent";
import { BookingsWorkspace } from "@/components/bookings/BookingsWorkspace";

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
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
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

            {event.status === "DRAFT" ? (
              <EventSetupGuide activeTab={activeTab} onNavigate={selectTab} />
            ) : null}

            {activeTab === "Overview" ? (
              <EventOverview
                event={event}
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
                key={event.id}
                eventId={event.id}
                activityType={event.activityType}
                jurisdiction={event.jurisdiction}
              />
            ) : null}

            {activeTab === "Ticket Types" ? (
              <TicketTypesWorkspace
                eventId={event.id}
                onReturnToReadiness={() => selectTab("Overview")}
              />
            ) : null}

            {activeTab === "Products" ? (
              <ProductsWorkspace eventId={event.id} />
            ) : null}

            {activeTab === "Website" ? (
              <EventBrandingWorkspace
                eventId={event.id}
                eventSlug={event.slug}
                eventName={event.name}
                eventDescription={event.description}
                eventStatus={event.status}
                initialBranding={event.branding}
              />
            ) : null}

            {activeTab === "Settings" ? (
              <EventSettingsWorkspace event={event} onNavigate={selectTab} />
            ) : null}

            {activeTab === "Reports" ? (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Event reports have moved</h2>
                <p className="mt-2 text-sm text-muted-foreground">Open this Event inside the organisational Reports workspace, where you can switch between this Event, an Event Group or all authorised Events without leaving reporting.</p>
                <Link href={`/reports?report=${encodeURIComponent(searchParams.get("report") || "OVERVIEW")}&scope=EVENT&scopeId=${encodeURIComponent(event.id)}`} className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open {event.name} reports</Link>
              </div>
            ) : null}

            {activeTab === "Bookings" ? (
              <BookingsWorkspace
                fixedEventId={event.id}
                fixedEventName={event.name}
                embedded
              />
            ) : null}

            {activeTab === "Customers" ? (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold">{activeTab}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the operational {activeTab.toLowerCase()} workspace with{" "}
                  {event.name} already selected.
                </p>
                <Link
                  href={`/customers?eventId=${encodeURIComponent(event.id)}`}
                  className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  View Event Customers
                </Link>
              </div>
            ) : null}

            {activeTab !== "Overview" &&
            activeTab !== "Sessions" &&
            activeTab !== "Ticket Types" &&
            activeTab !== "Products" &&
            activeTab !== "Bookings" &&
            activeTab !== "Customers" &&
            activeTab !== "Waiver" &&
            activeTab !== "Website" &&
            activeTab !== "Reports" &&
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
