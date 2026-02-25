import { Check } from "lucide-react";

const tiers = [
  {
    name: "Foundation",
    price: "350",
    period: "/month",
    description: "Gym access with core training essentials.",
    features: [
      "Full facility access",
      "Open floor training hours",
      "Locker & towel service",
      "Member events",
      "Digital training log",
    ],
    highlighted: false,
  },
  {
    name: "Performance",
    price: "650",
    period: "/month",
    description: "For the committed professional seeking guided results.",
    features: [
      "Everything in Foundation",
      "8 personal training sessions",
      "Custom nutrition plan",
      "Monthly performance review",
      "Priority scheduling",
      "Recovery suite access",
    ],
    highlighted: true,
  },
  {
    name: "Chairman",
    price: "1,200",
    period: "/month",
    description: "The ultimate private training experience.",
    features: [
      "Everything in Performance",
      "Unlimited personal training",
      "Private training suite",
      "24/7 facility access",
      "Quarterly health assessments",
      "Guest passes (2/month)",
      "Dedicated concierge",
    ],
    highlighted: false,
  },
];

export function Membership() {
  return (
    <section id="membership" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">
            Membership
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance">
            Choose your commitment
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            All memberships include a private onboarding session and full
            facility orientation. Membership is by application only.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative p-8 lg:p-10 border flex flex-col ${
                tier.highlighted
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-px left-0 right-0 h-0.5 bg-primary" />
              )}
              <p
                className={`text-sm uppercase tracking-[0.2em] font-medium ${
                  tier.highlighted ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tier.name}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-serif text-5xl font-bold text-foreground">
                  {"$"}
                  {tier.price}
                </span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {tier.description}
              </p>
              <div className="mt-8 flex flex-col gap-4 flex-1">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              <a
                href="#contact"
                className={`mt-10 inline-flex h-12 items-center justify-center px-8 text-sm uppercase tracking-[0.15em] font-medium transition-colors ${
                  tier.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-foreground/20 text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                Apply Now
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
