export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-7xl px-6 text-sm text-muted-foreground lg:px-8">
        © {new Date().getFullYear()} Glacier. Built for modern event operators.
      </div>
    </footer>
  );
}