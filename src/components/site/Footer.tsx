import Link from "next/link";
import { Mark } from "./Navbar";

const COLS = [
  { head: "Research", links: [["Energy", "/node#energy"], ["Compute", "/node#compute"], ["Link", "/node#link"], ["Intelligence", "/node#intelligence"]] },
  { head: "Read", links: [["Open problems", "/challenges"], ["Blog", "/blog"], ["Research agenda", "/node#agenda"]] },
  { head: "Company", links: [["Beliefs", "/node#beliefs"], ["Request a Node", "/node#access"], ["Careers", "/node#access"]] },
];

export default function Footer() {
  return (
    <footer id="company" className="bg-night text-night-mute">
      <div className="wrap flex flex-col gap-16 pt-20 pb-10">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="flex max-w-[380px] flex-col gap-4">
            <span className="flex items-center gap-2.5 text-night-ink">
              <Mark size={24} />
              <span className="font-serif text-[28px]">Matrix</span>
            </span>
            <p className="m-0 text-[15px] leading-[1.65]">
              A research lab for energy, taste and intelligence. We build personal intelligence that runs on its own power and belongs to the people it serves.
            </p>
          </div>
          <div className="flex flex-wrap gap-16 text-[14px]">
            {COLS.map((c) => (
              <div key={c.head} className="flex flex-col gap-3">
                <span className="text-night-ink">{c.head}</span>
                {c.links.map(([l, h]) => (
                  <Link key={l} href={h} className="text-night-mute no-underline hover:text-night-ink">{l}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-night-rule pt-6 text-[13px]">
          <span>© 2026 Matrix</span>
          <span>
            Founded by{" "}
            <a href="https://x.com/sidgraph" target="_blank" rel="noopener noreferrer" className="text-night-ink underline decoration-night-rule underline-offset-4 hover:decoration-ember">Siddhant Saxena</a>
            {" and "}
            <a href="https://x.com/thesisofsarthak" target="_blank" rel="noopener noreferrer" className="text-night-ink underline decoration-night-rule underline-offset-4 hover:decoration-ember">Sarthak Kapil</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
