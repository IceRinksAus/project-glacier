import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          Glacier
        </Link>

        <nav className="flex items-center gap-8 text-sm font-medium">
          <Link href="/">Home</Link>
          <Link href="/events">Events</Link>
          <Link href="/support">Support</Link>
          <Link href="/login">Sign In</Link>
        </nav>
      </div>
    </header>
  );
}
