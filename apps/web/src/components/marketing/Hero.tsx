import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="py-28">
      <div className="max-w-3xl">
        <span className="rounded-full border px-4 py-2 text-sm font-medium">
          Built for festivals, attractions and experiences
        </span>

        <h1 className="mt-8 text-6xl font-bold tracking-tight">
          Build unforgettable events.
        </h1>

        <p className="mt-8 text-xl leading-8 text-muted-foreground">
          Glacier is the modern operating platform for ticketing,
          attractions, festivals and venues.
        </p>

        <div className="mt-10 flex gap-4">
          <Button size="lg">
            Start Building
          </Button>

          <Button
            variant="outline"
            size="lg"
          >
            View Demo
          </Button>
        </div>
      </div>
    </section>
  );
}