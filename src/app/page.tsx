import Link from "next/link";
import TitleArt from "@/components/home/title/TitleArt";
import Hero3D from "@/components/home/hero3d/Hero3D";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section id="top" className="pt-[clamp(48px,6vw,96px)] pb-[clamp(32px,3.5vw,52px)]">
        <div className="wrap-wide flex flex-col gap-[clamp(28px,3.5vw,48px)]">
          <div className="hero-rise">
            <TitleArt
              text="Self Sustaining Super Intelligence for Humankind"
              className="m-0 max-w-[15.5em] text-balance font-sans text-[clamp(44px,7vw,136px)] font-[680] leading-[0.94] tracking-[-0.05em]"
            />
          </div>
          <div className="hero-rise flex flex-wrap items-end justify-between gap-x-20 gap-y-7" style={{ animationDelay: ".12s" }}>
            <p className="m-0 max-w-[640px] text-[clamp(18px,1.5vw,21px)] leading-[1.55] text-ink-3">
              Intelligence that makes its own power, runs on its own silicon and learns the judgment of the people it serves. Matrix researches the full stack and builds it into a single machine, the Node.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/node" className="btn btn-ink">Explore the Node</Link>
              <Link href="/node#research" className="btn btn-line">Read our research</Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="From sunlight to taste, in five chapters" className="pb-[clamp(80px,10vw,128px)]">
        <div className="wrap-wide">
          <div className="hero-rise overflow-hidden rounded-[6px] bg-night shadow-[0_40px_80px_-40px_rgba(25,23,20,.55)]" style={{ animationDelay: ".24s" }}>
            <Hero3D />
          </div>
        </div>
      </section>
    </>
  );
}
