"use client";

export const eventTabs = [
  "Overview",
  "Sessions",
  "Products",
  "Ticket Types",
  "Bookings",
  "Customers",
  "Waiver",
  "Website",
  "Reports",
  "Settings",
] as const;

export type EventTab = (typeof eventTabs)[number];

export function parseEventTab(value: string | null): EventTab {
  return eventTabs.includes(value as EventTab) ? (value as EventTab) : "Overview";
}

interface EventTabsProps {
  activeTab: EventTab;
  onChange: (tab: EventTab) => void;
}

export function EventTabs({ activeTab, onChange }: EventTabsProps) {
  return (
    <div className="rounded-xl border bg-card">
      <nav className="flex overflow-x-auto">
        {eventTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`whitespace-nowrap border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}
