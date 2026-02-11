"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "ingest",
    desc: "High-throughput data pipeline processing millions of sensor readings per second from distributed energy assets.",
  },
  {
    num: "02",
    title: "process",
    desc: "Real-time stream processing with ML inference at the edge, identifying anomalies and optimization opportunities.",
  },
  {
    num: "03",
    title: "decide",
    desc: "Autonomous decision engine that dispatches commands to grid assets within milliseconds, optimizing for cost and reliability.",
  },
  {
    num: "04",
    title: "learn",
    desc: "Continuous feedback loop that improves models with every cycle, adapting to seasonal patterns and infrastructure changes.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Platform() {
  return (
    <section id="platform" className="relative z-[1]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[11px] font-medium tracking-[0.15em] uppercase text-accent mb-4"
        >
          // platform
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-sans text-3xl md:text-5xl font-bold leading-[1.1] tracking-[-0.025em] max-w-[700px] mb-5"
        >
          From raw data to actionable intelligence
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[15px] md:text-[17px] text-secondary max-w-[540px] leading-relaxed"
        >
          Four layers, one platform. Matrix transforms raw sensor data into decisions that keep the grid running.
        </motion.p>

        {/* Pipeline connector line */}
        <div className="relative mt-16">
          {/* Dashed connector */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="hidden lg:block absolute top-[60px] left-[12.5%] right-[12.5%] h-px origin-left"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, var(--color-accent) 0, var(--color-accent) 6px, transparent 6px, transparent 12px)",
            }}
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border overflow-hidden"
          >
            {steps.map((step) => (
              <motion.div
                key={step.num}
                variants={cardVariants}
                className="group bg-surface hover:bg-elevated p-8 md:p-10 transition-all duration-300 relative"
              >
                <div className="font-mono text-5xl md:text-6xl font-bold text-border-light group-hover:text-accent/20 transition-colors mb-6 leading-none">
                  {step.num}
                </div>

                <h3 className="font-mono text-lg font-semibold mb-3 tracking-[-0.01em] group-hover:text-accent transition-colors">
                  {step.title}
                </h3>

                <p className="text-[15px] text-secondary leading-relaxed">
                  {step.desc}
                </p>

                {/* Arrow indicator */}
                <div className="absolute right-4 top-4 font-mono text-border-light text-lg group-hover:text-accent/40 transition-colors">
                  →
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
