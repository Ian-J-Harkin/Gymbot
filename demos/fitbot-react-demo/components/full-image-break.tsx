import Image from "next/image";

export function FullImageBreak() {
  return (
    <section className="relative h-[50vh] min-h-[400px] lg:h-[60vh]">
      <Image
        src="/images/training.jpg"
        alt="Training at Forge"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-background/40" />
      <div className="absolute inset-0 flex items-center justify-center">
        <blockquote className="text-center px-6 max-w-3xl">
          <p className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
            {"\"The body achieves what the mind believes.\""}
          </p>
          <cite className="block mt-6 text-sm uppercase tracking-[0.2em] text-primary not-italic">
            Forge Ethos
          </cite>
        </blockquote>
      </div>
    </section>
  );
}
