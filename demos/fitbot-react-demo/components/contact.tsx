'use client';

import { MapPin, Clock, Phone, Mail } from "lucide-react";

const details = [
  {
    icon: MapPin,
    label: "Location",
    value: "42 Ironside Lane, Financial District",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "5:00 AM - 10:00 PM (Chairman: 24/7)",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (212) 555-0199",
  },
  {
    icon: Mail,
    label: "Email",
    value: "membership@forgegym.com",
  },
];

export function Contact() {
  return (
    <section id="contact" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">
              Contact
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground text-balance">
              Begin your application
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Membership at Forge is by application only. Schedule a private
              tour to experience our facility and discuss which tier aligns
              with your goals.
            </p>

            <div className="mt-12 grid sm:grid-cols-2 gap-8">
              {details.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.label} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground mb-1">
                        {d.label}
                      </p>
                      <p className="text-foreground">{d.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-6"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2" suppressHydrationWarning>
                <label
                  htmlFor="firstName"
                  className="text-sm uppercase tracking-[0.15em] text-muted-foreground"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="h-12 bg-transparent border border-border px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="James"
                />
              </div>
              <div className="flex flex-col gap-2" suppressHydrationWarning>
                <label
                  htmlFor="lastName"
                  className="text-sm uppercase tracking-[0.15em] text-muted-foreground"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="h-12 bg-transparent border border-border px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Richardson"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2" suppressHydrationWarning>
              <label
                htmlFor="email"
                className="text-sm uppercase tracking-[0.15em] text-muted-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                className="h-12 bg-transparent border border-border px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="james@company.com"
              />
            </div>
            <div className="flex flex-col gap-2" suppressHydrationWarning>
              <label
                htmlFor="role"
                className="text-sm uppercase tracking-[0.15em] text-muted-foreground"
              >
                Role / Organization
              </label>
              <input
                id="role"
                type="text"
                className="h-12 bg-transparent border border-border px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="CEO, Acme Corp"
              />
            </div>
            <div className="flex flex-col gap-2" suppressHydrationWarning>
              <label
                htmlFor="message"
                className="text-sm uppercase tracking-[0.15em] text-muted-foreground"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="bg-transparent border border-border p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Tell us about your training goals..."
              />
            </div>
            <button
              type="submit"
              className="h-14 bg-primary text-primary-foreground text-sm uppercase tracking-[0.15em] font-medium hover:bg-primary/90 transition-colors mt-2"
            >
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
