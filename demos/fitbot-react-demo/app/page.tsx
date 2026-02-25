import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { MarqueeBar } from "@/components/marquee-bar";
import { Philosophy } from "@/components/philosophy";
import { Programs } from "@/components/programs";
import { FullImageBreak } from "@/components/full-image-break";
import { Membership } from "@/components/membership";
import { Testimonials } from "@/components/testimonials";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main>
      <Navbar />
      <Hero />
      <MarqueeBar />
      <Philosophy />
      <Programs />
      <FullImageBreak />
      <Membership />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
}
