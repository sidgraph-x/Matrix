import Link from "next/link";
import HeroMotion from "@/components/home/HeroMotion";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section id="top" className="pt-[clamp(64px,10vw,120px)] pb-[72px]">
        <div className="wrap flex flex-col gap-10">
          <h1 className="serif m-0 max-w-[1040px] text-[clamp(46px,7vw,96px)] leading-[1.02]">
            A frontier research lab for energy, taste and <em className="italic text-ember-deep">intelligence.</em>
          </h1>
          <div className="flex flex-wrap items-start justify-between gap-x-20 gap-y-8">
            <p className="m-0 max-w-[620px] text-[clamp(18px,1.6vw,20px)] leading-[1.55] text-ink-3">
              We think the next era of intelligence will be personal: powered where it lives, owned by the people it serves, and shaped by their judgment. Matrix studies the full stack that makes this possible, and builds it into a single machine.
            </p>
            <Link href="/node#research" className="pt-1.5 text-[16px] text-ink underline underline-offset-4 hover:text-ember-deep">Read our research</Link>
          </div>
        </div>
      </section>

      <section aria-label="From sunlight to taste, in five chapters" className="pb-[clamp(80px,10vw,120px)]">
        <div className="wrap">
          <div className="overflow-hidden rounded-[4px] bg-night px-[clamp(16px,3vw,40px)] pt-[clamp(16px,3vw,40px)] pb-8">
            <HeroMotion />
          </div>
        </div>
      </section>
    </>
  );
}
