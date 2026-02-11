"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section id="contact" className="relative z-[1]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 md:py-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[11px] font-medium tracking-[0.15em] uppercase text-accent mb-4"
        >
          // init
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-sans text-3xl md:text-5xl font-bold leading-[1.1] tracking-[-0.025em] max-w-[600px] mb-5"
        >
          Ready to build the future of energy?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[15px] md:text-[17px] text-secondary max-w-[480px] leading-relaxed mb-10"
        >
          Join the operators, utilities, and governments already running on Matrix.
        </motion.p>

        {/* Terminal-style input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-[500px]"
        >
          <div className="bg-surface border border-border overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-white/[0.02]">
              <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
              <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
              <span className="w-2 h-2 rounded-full bg-[#28c840]" />
            </div>
            <div className="p-4">
              <div className="font-mono text-xs text-muted mb-3">
                $ matrix access --request
              </div>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex flex-col sm:flex-row gap-2"
              >
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-accent text-sm">
                    &gt;
                  </span>
                  <input
                    type="email"
                    placeholder="enter_email"
                    className="w-full font-mono text-[13px] pl-7 pr-4 py-3 bg-background border border-border-light text-foreground outline-none focus:border-accent transition-colors placeholder:text-muted"
                  />
                </div>
                <button
                  type="submit"
                  className="font-mono text-[13px] font-semibold px-6 py-3 bg-accent text-background hover:bg-foreground transition-colors whitespace-nowrap"
                >
                  submit
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
