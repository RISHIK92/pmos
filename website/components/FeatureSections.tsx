"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Database,
  TrendingUp,
  GitBranch,
  Layers,
  Search,
  Bell,
} from "lucide-react";

const features = [
  {
    id: "memory",
    title: "A Second Brain that actually remembers.",
    description:
      "Traditional OSs forget your context the moment you close an app. Dex indexes your digital life—emails, chats, docs—into a local Vector Database.",
    details: [
      "Semantic Search: 'Where did I leave my keys?'",
      "Contextual Recall: Dex knows you're in a meeting.",
      "Local-First Privacy: Your data stays on your device.",
    ],
    icon: Database,
    color: "bg-purple-500",
    align: "left",
  },
  {
    id: "finance",
    title: "Wealth Health, Proactively Managed.",
    description:
      "Stop manually logging transactions. Dex connects to your SMS and bank notifications to categorize spending in real-time.",
    details: [
      "Auto-Categorization: 'Food', 'Travel', 'Tech'.",
      "Spending Alerts: 'You've exceeded your coffee budget.'",
      "Subscription Tracking: Never miss a renewal.",
    ],
    icon: TrendingUp,
    color: "bg-green-500",
    align: "right",
  },
  {
    id: "github",
    title: "The OS for Developers.",
    description:
      "Why context switch to check a PR? Dex's GitHub Manager brings your repositories directly into your workflow.",
    details: [
      "PR Status Widgets on Home Screen.",
      "Merge Conflicts Alerts.",
      "Dev Journal: Auto-log your deep work sessions.",
    ],
    icon: GitBranch,
    color: "bg-gray-800",
    align: "left",
  },
];

export function FeatureSections() {
  return (
    <section className="py-24 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-32">
        {features.map((feature, index) => (
          <div
            key={feature.id}
            className={`flex flex-col md:flex-row items-center gap-16 ${
              feature.align === "right" ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Text Content */}
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border/50 text-text-secondary text-sm font-medium">
                <feature.icon size={16} />
                <span className="capitalize">{feature.id} Module</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">
                {feature.title}
              </h2>
              <p className="text-xl text-text-secondary leading-relaxed">
                {feature.description}
              </p>

              <ul className="space-y-4 pt-4">
                {feature.details.map((detail, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-text-primary font-medium"
                  >
                    <div className={`w-2 h-2 rounded-full ${feature.color}`} />
                    {detail}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Visual Abstract Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex-1 w-full"
            >
              <div className="aspect-[4/3] rounded-3xl bg-secondary border border-border/50 shadow-lg relative overflow-hidden group">
                {/* Decorative Elements based on feature */}
                <div
                  className={`absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,currentColor,transparent)] ${feature.color.replace("bg-", "text-")}`}
                />

                {/* Abstract UI Representation */}
                <div className="absolute inset-10 bg-white rounded-2xl shadow-sm border border-border/40 p-6 flex flex-col gap-4">
                  {/* Header Bar */}
                  <div className="flex items-center gap-4 border-b border-border/30 pb-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center text-white`}
                    >
                      <feature.icon size={24} />
                    </div>
                    <div className="h-4 w-32 bg-gray-100 rounded-full" />
                  </div>

                  {/* Content Skeleton */}
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-full bg-gray-50 rounded-full" />
                    <div className="h-4 w-[90%] bg-gray-50 rounded-full" />
                    <div className="h-4 w-[75%] bg-gray-50 rounded-full" />
                  </div>

                  {/* Interactive Floating Logic */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -right-6 bottom-10 bg-white p-4 rounded-xl shadow-xl border border-border/40 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <Search size={16} />
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-16 bg-gray-200 rounded-full" />
                      <div className="h-2 w-10 bg-gray-100 rounded-full" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
