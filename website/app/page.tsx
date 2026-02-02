import { Hero } from "../components/Hero";
import { BentoGrid } from "../components/BentoGrid";
import { HowItWorks } from "../components/HowItWorks";
import { Footer } from "../components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background overflow-hidden relative selection:bg-primary/20">
      {/* Global decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-br from-secondary to-transparent -z-20 opacity-50 pointer-events-none" />

      <Hero />
      <BentoGrid />
      <HowItWorks />
      <Footer />
    </main>
  );
}
