import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <PlatformShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Thursday, 6 August
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Good morning, Jamie
            </h1>

            <p className="mt-2 text-muted-foreground">
              Here&apos;s what&apos;s happening across your events.
            </p>
          </div>

          <Button size="lg">
            Create new event
          </Button>
        </div>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Welcome to the Glacier platform
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your organisation dashboard will display active events,
            bookings, revenue and operational alerts here.
          </p>
        </section>
      </div>
    </PlatformShell>
  );
}