"use client";

import { useState } from "react";
import { Dumbbell, Zap, Heart, Brain } from "lucide-react";

const programs = [
  {
    icon: Dumbbell,
    title: "Strength Architecture",
    duration: "60 min",
    description:
      "Compound movement-focused programming built for raw strength development. Progressive overload protocols with periodized training cycles tailored to your body.",
    features: [
      "1-on-1 coaching",
      "Custom programming",
      "Monthly progress reviews",
    ],
  },
  {
    icon: Zap,
    title: "Executive Performance",
    duration: "45 min",
    description:
      "High-intensity, time-efficient training designed for maximum output in minimal time. Ideal for the professional with a demanding schedule.",
    features: [
      "HIIT protocols",
      "Metabolic conditioning",
      "Flexible scheduling",
    ],
  },
  {
    icon: Heart,
    title: "Recovery & Mobility",
    duration: "45 min",
    description:
      "Dedicated recovery sessions combining mobility work, soft tissue therapy, and active restoration to sustain long-term performance.",
    features: [
      "Guided stretching",
      "Myofascial release",
      "Breathing protocols",
    ],
  },
  {
    icon: Brain,
    title: "Performance Optimization",
    duration: "90 min",
    description:
      "A holistic approach combining physical training with nutrition strategy and biometric tracking for executives who want the complete edge.",
    features: [
      "Biometric analysis",
      "Nutrition planning",
      "Sleep optimization",
    ],
  },
];

export function Programs() {
  const [activeProgram, setActiveProgram] = useState(0);

  return (
    <section id="programs" className="py-24 lg:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">
            Programs
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance">
            Engineered for results
          </h2>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16">
          <div className="flex flex-col gap-2">
            {programs.map((program, index) => {
              const Icon = program.icon;
              return (
                <button
                  key={program.title}
                  type="button"
                  onClick={() => setActiveProgram(index)}
                  className={`flex items-center gap-4 p-5 text-left transition-all border ${
                    activeProgram === index
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      activeProgram === index
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <span
                      className={`font-serif text-lg font-semibold ${
                        activeProgram === index
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {program.title}
                    </span>
                    <span className="block text-sm text-muted-foreground mt-0.5">
                      {program.duration}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-8 lg:p-12 border border-border">
            <div className="flex items-center gap-3 mb-6">
              {(() => {
                const Icon = programs[activeProgram].icon;
                return <Icon className="h-6 w-6 text-primary" />;
              })()}
              <h3 className="font-serif text-3xl font-bold text-foreground">
                {programs[activeProgram].title}
              </h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {programs[activeProgram].description}
            </p>
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.15em] text-primary font-medium">
                Includes
              </p>
              {programs[activeProgram].features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-primary" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
            <a
              href="#contact"
              className="mt-10 inline-flex h-12 items-center px-8 text-sm uppercase tracking-[0.15em] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enquire Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
