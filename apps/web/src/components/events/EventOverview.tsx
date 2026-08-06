interface EventOverviewProps {
  name: string;
  description: string | null;
  status: string;
  slug: string;
  startDate: string;
  endDate: string;
}

export function EventOverview({
  name,
  description,
  status,
  slug,
  startDate,
  endDate,
}: EventOverviewProps) {
  const formattedStartDate = new Date(startDate).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedEndDate = new Date(endDate).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-xl border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Event overview
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {name}
        </h2>

        <p className="mt-4 leading-7 text-muted-foreground">
          {description || "No event description has been added yet."}
        </p>

        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Event dates
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {formattedStartDate} — {formattedEndDate}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Status
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {status}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Website slug
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {slug}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Future event website
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {slug}.glacier.com
            </dd>
          </div>
        </dl>
      </section>

      <aside className="rounded-xl border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Setup progress
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span>Event readiness</span>
            <span className="font-semibold">25%</span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/4 rounded-full bg-primary" />
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Event details</span>
            <span className="font-medium">Complete</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Sessions</span>
            <span className="text-muted-foreground">Not started</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Ticket types</span>
            <span className="text-muted-foreground">Not started</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Branding</span>
            <span className="text-muted-foreground">Not started</span>
          </div>
        </div>
      </aside>
    </div>
  );
}