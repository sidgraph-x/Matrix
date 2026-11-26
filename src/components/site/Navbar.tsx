"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { label: "Research", href: "/node#research" },
  { label: "Node", href: "/node" },
  { label: "Challenges", href: "/challenges" },
  { label: "Blog", href: "/blog" },
  { label: "Beliefs", href: "/node#beliefs" },
];

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <path d="M13 2L24 8L13 14L2 8Z" fill="#FF6B2C" />
      <path d="M2 12.5L13 18.5L24 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 17L13 23L24 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeOpacity=".45" />
    </svg>
  );
}

export default function Navbar() {
  const path = usePathname();
  // the menu belongs to the page it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;

  const isActive = (href: string) => !href.includes("#") && path.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-rule-soft bg-paper/90 backdrop-blur-md">
      <div className="wrap flex h-[72px] items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline" aria-label="Matrix home">
          <Mark />
          <span className="font-serif text-[24px] tracking-[-0.01em]">Matrix</span>
        </Link>
        <nav aria-label="Main" className="hidden md:flex gap-8 text-[15px]">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`no-underline transition-colors hover:text-ember-deep ${isActive(l.href) ? "text-ink underline decoration-ember underline-offset-[6px]" : "text-ink-2"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="ml-auto hidden sm:block">
          <Link href="/node#access" className="btn btn-ink !min-h-[44px] !px-5">Request a Node</Link>
        </span>
        <button
          type="button"
          className="ml-auto sm:ml-0 md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-rule"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenOn(open ? null : path)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" stroke="currentColor" strokeWidth="1.6">
            {open ? <path d="M3 3L15 15M15 3L3 15" /> : <path d="M2 5H16M2 9H16M2 13H16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="md:hidden border-t border-rule-soft bg-paper">
          <ul className="wrap flex flex-col py-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpenOn(null)} className="block py-3 font-serif text-[26px] text-ink no-underline">{l.label}</Link>
              </li>
            ))}
            <li className="pt-3 pb-2"><Link href="/node#access" onClick={() => setOpenOn(null)} className="btn btn-ink">Request a Node</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
