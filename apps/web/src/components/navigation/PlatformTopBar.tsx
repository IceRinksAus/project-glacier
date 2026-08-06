import { Bell, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PlatformTopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Organisation
        </p>

        <button className="flex items-center gap-1 text-sm font-semibold">
          Ice Rinks Australia
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Button>

        <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            JS
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium">Jamie Stoller</p>
            <p className="text-xs text-muted-foreground">
              Owner
            </p>
          </div>

          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}