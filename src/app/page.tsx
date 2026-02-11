import BackgroundEffects from "@/components/BackgroundEffects";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import Infrastructure from "@/components/Infrastructure";
import Network from "@/components/Network";
import Platform from "@/components/Platform";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <BackgroundEffects />
      <Navbar />
      <Hero />
      <StatsBar />
      <Infrastructure />
      <Network />
      <Platform />
      <CTA />
      <Footer />
    </>
  );
}
