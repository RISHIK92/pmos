"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mic, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "You Speak",
    description: "Just trigger the overlay and say what you need.",
    icon: Mic,
    color: "bg-red-500",
  },
  {
    id: 2,
    title: "Dex Thinks",
    description: "Gemini Flash AI calculates the best path.",
    icon: Sparkles,
    color: "bg-primary",
  },
  {
    id: 3,
    title: "Action Taken",
    description: "Dex executes the task directly on your OS.",
    icon: CheckCircle2,
    color: "bg-blue-500",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-secondary/50 border-y border-border/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-primary">
            From Voice to <span className="text-primary">Action</span>
          </h2>
          <p className="text-text-secondary text-lg">
            No more tapping through menus. Just ask.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-20 right-20 h-0.5 bg-gray-200 -z-10" />

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative bg-white p-8 rounded-3xl border border-border/50 shadow-sm w-full md:w-1/3 text-center z-10"
            >
              <div
                className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-gray-200 ${step.color}`}
              >
                <step.icon size={32} color="white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">
                {step.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
