const items = [
  "Strength Training",
  "Personal Coaching",
  "Recovery & Mobility",
  "Nutrition Programming",
  "Performance Testing",
  "Executive Scheduling",
  "Private Sessions",
  "Sport-Specific Training",
];

export function MarqueeBar() {
  return (
    <div className="bg-primary py-3 overflow-hidden">
      <div className="animate-marquee flex whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="mx-8 text-sm uppercase tracking-[0.2em] font-medium text-primary-foreground"
          >
            {item}
            <span className="ml-8 text-primary-foreground/40">{"////"}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
