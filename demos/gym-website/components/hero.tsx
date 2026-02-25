import Image from "next/image";
import { ArrowDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative h-screen min-h-[700px] flex items-end">
      <Image
        src="/images/hero-gym.jpg"
        alt="Interior of Forge private training club"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-background/60" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-20 lg:pb-28">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-6">
            Exclusive Members-Only Facility
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] text-foreground text-balance">
            Where discipline meets distinction
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            A private training club built for professionals who demand precision
            in every aspect of their lives.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href="#membership"
              className="inline-flex h-14 items-center justify-center px-8 text-sm uppercase tracking-[0.15em] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Membership
            </a>
            <a
              href="#philosophy"
              className="inline-flex h-14 items-center justify-center px-8 text-sm uppercase tracking-[0.15em] font-medium border border-foreground/20 text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              Our Philosophy
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ArrowDown className="h-5 w-5 text-muted-foreground" />
      </div>
    </section>
  );
}
