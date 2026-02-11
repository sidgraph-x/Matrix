"use client";

const links = [
  { label: "privacy", href: "#" },
  { label: "terms", href: "#" },
  { label: "security", href: "#" },
  { label: "status", href: "#" },
  { label: "github", href: "#" },
];

export default function Footer() {
  return (
    <footer className="relative z-[1] border-t border-border">
      {/* Signal pulse line */}
      <div className="relative h-px w-full overflow-hidden">
        <div
          className="absolute top-0 h-px w-[20%] opacity-60"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
            animation: "signal-pulse 4s ease-in-out infinite",
          }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="font-mono text-[12px] text-muted flex flex-col gap-1">
          <span>&copy; 2026 matrix energy infrastructure</span>
          <span className="text-secondary">Founders: Siddhant Saxena & Sarthak Kapil</span>
        </div>

        <ul className="flex items-center gap-6 md:gap-8">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="font-mono text-[12px] text-muted hover:text-secondary transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
