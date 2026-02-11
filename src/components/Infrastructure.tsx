"use client";

import { motion } from "framer-motion";

const cards = [
  {
    icon: "⚡",
    title: "grid_orchestration",
    desc: "Real-time load balancing and dispatch optimization across distributed generation assets and storage systems.",
    tag: "CORE_ENGINE",
  },
  {
    icon: "◑",
    title: "predictive_analytics",
    desc: "ML-driven forecasting for demand curves, renewable generation capacity, and grid stability metrics.",
    tag: "INTELLIGENCE",
  },
  {
    icon: "◆",
    title: "edge_compute",
    desc: "Distributed compute nodes deployed at substations and generation sites for sub-millisecond response.",
    tag: "COMPUTE",
  },
  {
    icon: "◎",
    title: "digital_twin",
    desc: "Complete virtual replica of physical grid infrastructure for simulation, testing, and scenario planning.",
    tag: "SIMULATION",
  },
  {
    icon: "◉",
    title: "protocol_layer",
    desc: "Unified communication protocol bridging legacy SCADA systems with modern IoT sensor networks.",
    tag: "CONNECTIVITY",
  },
  {
    icon: "★",
    title: "security_mesh",
    desc: "Zero-trust architecture with hardware-backed encryption for critical infrastructure protection.",
    tag: "SECURITY",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Infrastructure() {
  return (
    <section id="infrastructure" className="relative z-[1]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[11px] font-medium tracking-[0.15em] uppercase text-accent mb-4"
        >
          // infrastructure
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-sans text-3xl md:text-5xl font-bold leading-[1.1] tracking-[-0.025em] max-w-[700px] mb-5"
        >
          Built for the systems that power everything
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[15px] md:text-[17px] text-secondary max-w-[540px] leading-relaxed"
        >
          Modular, resilient, real-time. Our infrastructure layer connects generation, transmission, and consumption into a single coherent system.
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border mt-16 border border-border overflow-hidden"
        >
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              className="group bg-surface hover:bg-elevated p-8 md:p-10 transition-all duration-300 cursor-default relative"
            >
              {/* Green left border on hover */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="w-10 h-10 border border-border-light rounded-lg flex items-center justify-center mb-6 text-lg text-accent bg-accent-dim group-hover:border-accent/30 transition-colors">
                {card.icon}
              </div>

              <h3 className="font-mono text-[15px] font-semibold mb-3 tracking-[-0.01em]">
                {card.title}
              </h3>

              <p className="text-sm text-secondary leading-relaxed">
                {card.desc}
              </p>

              <div className="font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-muted mt-6 pt-6 border-t border-border">
                [{card.tag}]
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
