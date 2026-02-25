"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Philosophy", href: "#philosophy" },
  { label: "Programs", href: "#programs" },
  { label: "Membership", href: "#membership" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
              FORGE
            </span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Private Club
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#contact"
              className="hidden lg:inline-flex h-10 items-center px-6 text-sm uppercase tracking-[0.15em] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Book a Tour
            </a>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-foreground p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-background border-t border-border">
          <div className="px-6 py-8 flex flex-col gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-lg uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex h-12 items-center justify-center px-6 text-sm uppercase tracking-[0.15em] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Book a Tour
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
