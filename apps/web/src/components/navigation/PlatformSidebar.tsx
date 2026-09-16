"use client";

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
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-black text-sidebar-primary-foreground">G</span>
          <span>Glacier</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/settings"
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname.startsWith("/settings")
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

export function PlatformMobileNav() {
  const pathname = usePathname();
  const primaryItems = navigationItems.filter(({ href }) => ["/", "/events", "/pos", "/bookings", "/reports"].includes(href));

  return (
    <nav aria-label="Primary navigation" className="overflow-x-auto border-b bg-card px-3 py-2 lg:hidden">
      <div className="flex min-w-max gap-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
