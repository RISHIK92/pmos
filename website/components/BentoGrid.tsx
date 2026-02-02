"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  CheckSquare,
  Shield,
  Github,
  DollarSign,
  Smartphone,
  Sparkles,
  Lock,
} from "lucide-react";
import clsx from "clsx";

const features = [
  {
    title: "Memory",
    description: "A searchable vector database of your life. Recall anything.",
    icon: Brain,
    className: "md:col-span-2",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Tasks",
    description: "AI that auto-prioritizes your day.",
    icon: CheckSquare,
    className: "md:col-span-1",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Restrictor",
    description: "Deep Work mode that blocks distractions.",
    icon: Shield,
    className: "md:col-span-1",
    color: "bg-red-100 text-red-600",
  },
  {
    title: "GitHub Manager",
    description: "Track PRs and issues directly from your OS.",
    icon: Github,
    className: "md:col-span-2",
    color: "bg-gray-100 text-gray-800",
  },
  {
    title: "Finance Planner",
    description: "Proactive budgeting and spending insights.",
    icon: DollarSign,
    className: "md:col-span-3",
    color: "bg-green-100 text-green-600",
  },
];

export function BentoGrid() {
  return (
    <section className="py-24 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-primary">
          The <span className="text-primary">Dex Modules</span>
        </h2>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Dex isn't just an app. It's a suite of intelligent tools designed to
          optimize every aspect of your life.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={clsx(
              "p-8 rounded-3xl border border-border/50 bg-white hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between h-[240px]",
              feature.className,
            )}
          >
            <div
              className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
                feature.color,
              )}
            >
              <feature.icon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-text-primary">
                {feature.title}
              </h3>
              <p className="text-text-secondary font-medium leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
