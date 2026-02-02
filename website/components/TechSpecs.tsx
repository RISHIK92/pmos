"use client";

import React from "react";
import { motion } from "framer-motion";
import { Code2, Smartphone, Cpu, Cloud, Database, Lock } from "lucide-react";

const specs = [
  {
    icon: Smartphone,
    label: "Frontend",
    value: "React Native (Expo)",
    desc: "120Hz Fluid Animations",
  },
  {
    icon: Code2,
    label: "Agentic Logic",
    value: "Python LangGraph",
    desc: "Stateful Multi-Agent System",
  },
  {
    icon: Cpu,
    label: "Model",
    value: "Gemini Flash 2.5",
    desc: "Sub-100ms Latency",
  },
  {
    icon: Database,
    label: "Memory",
    value: "Local Vector DB",
    desc: "Privacy-first RAG",
  },
];

export function TechSpecs() {
  return (
    <section className="py-24 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Built for <span className="text-primary">Performance</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Dex runs on a modern, high-performance stack designed for low
            latency and maximum privacy.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {specs.map((spec, index) => (
            <motion.div
              key={spec.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <spec.icon size={24} className="text-primary" />
              </div>
              <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
                {spec.label}
              </p>
              <h3 className="text-xl font-bold text-white mb-1">
                {spec.value}
              </h3>
              <p className="text-xs text-gray-500">{spec.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
