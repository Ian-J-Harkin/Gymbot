import Image from "next/image";

const pillars = [
  {
    number: "01",
    title: "Precision",
    description:
      "Every program is engineered with scientific rigor. No guesswork, no filler — only methodologies that deliver measurable results.",
  },
  {
    number: "02",
    title: "Efficiency",
    description:
      "Your time is your most valuable asset. Our sessions are designed to maximize output within your schedule, not consume it.",
  },
  {
    number: "03",
    title: "Privacy",
    description:
      "A members-only environment with limited capacity. Train alongside peers who share your drive, not a crowded gym floor.",
  },
];

export function Philosophy() {
  return (
    <section id="philosophy" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">
              Our Philosophy
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] text-foreground text-balance">
              Built for those who build empires
            </h2>
            <p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Forge was created from a singular conviction: that the men who
              shape industries deserve a training environment as disciplined and
              refined as their professional lives. No distractions. No
              compromise.
            </p>
          </div>

          <div className="relative aspect-[4/5] lg:aspect-[3/4]">
            <Image
              src="/images/about-gym.jpg"
              alt="Premium equipment at Forge"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 border border-primary/20" />
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-12 lg:gap-16">
          {pillars.map((pillar) => (
            <div key={pillar.number} className="group">
              <span className="text-sm font-mono text-primary">
                {pillar.number}
              </span>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-foreground">
                {pillar.title}
              </h3>
              <div className="mt-3 h-px w-12 bg-primary group-hover:w-24 transition-all duration-500" />
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
