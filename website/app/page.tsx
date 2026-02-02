import { Hero } from "../components/Hero";
import { Marquee } from "../components/Marquee";
import { ParallaxFeatures } from "../components/ParallaxFeatures";
import { HowItWorks } from "../components/HowItWorks";
import { MobileShowcase } from "../components/MobileShowcase";
import { InteractiveGlass } from "../components/InteractiveGlass";
import { StackVisualizer } from "../components/StackVisualizer";
import { Footer } from "../components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background overflow-hidden relative selection:bg-primary/20">
      <Hero />
      <Marquee />
      <MobileShowcase />
      <InteractiveGlass />
      <ParallaxFeatures />
      <HowItWorks />
      {/* <StackVisualizer /> */}
      <Footer />
    </main>
  );
}
