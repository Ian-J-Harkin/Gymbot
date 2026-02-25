import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Forge has fundamentally changed how I approach my day. The discipline I build at 5 AM carries straight into the boardroom.",
    name: "James R.",
    title: "Managing Director, Capital Markets",
    initials: "JR",
  },
  {
    quote:
      "After a decade of generic gym memberships, this is the first place that actually feels designed for how I live and work.",
    name: "David K.",
    title: "Founder & CEO, Tech Startup",
    initials: "DK",
  },
  {
    quote:
      "The coaching is world-class, the facility is immaculate, and the community is exactly the calibre of people you want around you.",
    name: "Michael T.",
    title: "Senior Partner, Law Firm",
    initials: "MT",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">
            Testimonials
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance">
            What our members say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-8 lg:p-10 border border-border flex flex-col"
            >
              <Quote className="h-6 w-6 text-primary mb-6" />
              <p className="text-foreground leading-relaxed flex-1 text-lg">
                {t.quote}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
