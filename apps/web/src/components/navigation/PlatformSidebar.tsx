import {
  BarChart3,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Package,
  ReceiptText,
  ScanLine,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Events",
    href: "/events",
    icon: CalendarDays,
  },
  {
    label: "Staff Scanner",
    href: "/staff/scanner",
    icon: ScanLine,
  },
  {
    label: "Point of Sale",
    href: "/pos",
    icon: ReceiptText,
  },
  {
    label: "Bookings",
    href: "/bookings",
    icon: Ticket,
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
];

export function PlatformSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Glacier
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
