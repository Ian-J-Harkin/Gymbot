export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold text-foreground">
              FORGE
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Private Club
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a
              href="#philosophy"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Philosophy
            </a>
            <a
              href="#programs"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Programs
            </a>
            <a
              href="#membership"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Membership
            </a>
            <a
              href="#contact"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            {"© 2026 Forge. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
}
