interface EventHeaderProps {
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

export function EventHeader({
  name,
  status,
  startDate,
  endDate,
}: EventHeaderProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Event
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {name}
          </h1>

          <p className="mt-3 text-muted-foreground">
            {new Date(startDate).toLocaleDateString("en-AU")}
            {" – "}
            {new Date(endDate).toLocaleDateString("en-AU")}
          </p>
        </div>

        <div>
          <span className="rounded-full border px-4 py-2 text-sm font-medium">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}