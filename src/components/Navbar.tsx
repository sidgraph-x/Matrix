"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const links = [
  { label: "infrastructure", href: "/#infrastructure" },
  { label: "network", href: "/#network" },
  { label: "platform", href: "/#platform" },
  { label: "blog", href: "/blog" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 h-16 px-6 md:px-12 flex items-center justify-between transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <a
        href="#"
        className="font-mono text-sm font-bold tracking-[0.15em] uppercase text-foreground hover:text-accent transition-colors"
      >
        <span className="text-accent">&#9670;</span> matrix
      </a>

      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-secondary hover:text-accent transition-colors"
          >
            ./{link.label}
          </a>
        ))}
        <a
          href="#contact"
          className="font-mono text-[11px] font-semibold tracking-[0.04em] uppercase px-5 py-2 bg-accent text-background rounded hover:bg-foreground transition-colors"
        >
          get_access
        </a>
      </div>
    </motion.nav>
  );
}
