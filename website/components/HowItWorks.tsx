"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mic, ArrowRight, Sparkles, Zap, Cpu, Smartphone } from "lucide-react";

export function HowItWorks() {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter text-gray-900 leading-[1.05]">
            From Voice to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
              Action.
            </span>
          </h2>
          <p className="text-xl text-gray-500 font-light leading-relaxed">
            No more tapping through menus. Just ask, and Dex interprets your
            intent, plans the steps, and executes them on your OS.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Beam (Desktop) */}
          <div className="hidden md:block absolute top-24 left-[15%] right-[15%] h-[2px] bg-gray-100 overflow-hidden rounded-full">
            <motion.div
              initial={{ x: "-100%" }}
              whileInView={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-teal-500 to-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1: Input */}
            <StepCard
              icon={Mic}
              label="Input"
              title="You Speak"
              desc="Natural language voice command."
              color="bg-white"
              iconColor="text-black"
              borderColor="border-emerald-500/20"
              delay={0.1}
            />

            {/* Step 2: Processing */}
            <StepCard
              icon={Sparkles}
              label="Intelligence"
              title="Dex Thinks"
              desc="Semantic intent understanding."
              color="bg-white"
              iconColor="text-teal-600"
              borderColor="border-teal-500/20"
              delay={0.3}
              highlight
            />

            {/* Step 3: Action */}
            <StepCard
              icon={Zap}
              label="Execution"
              title="Action Taken"
              desc="Direct OS-level control."
              color="bg-white"
              iconColor="text-black"
              borderColor="border-emerald-500/20"
              delay={0.5}
            />
          </div>
        </div>

        {/* Floating UI Elements Visual */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden group"
          >
            <div className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm">
              <Smartphone size={20} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-xl mb-2">Native Integration</h3>
            <p className="text-gray-500 mb-6">
              Dex runs as a background service, capable of launching apps and
              performing gestures.
            </p>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-white rounded-full border border-gray-200 text-xs font-medium text-gray-600 shadow-sm">
                Accessibility Service
              </div>
              <div className="px-3 py-1 bg-white rounded-full border border-gray-200 text-xs font-medium text-gray-600 shadow-sm">
                Overlay
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-black text-white rounded-3xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-900/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="font-bold text-xl mb-2 relative z-10">
              Privacy First
            </h3>
            <p className="text-gray-400 mb-6 relative z-10">
              Your voice and screen context are processed locally or securely
              encrypted.
            </p>
            <div className="flex items-center gap-2 text-teal-400 font-medium text-sm relative z-10">
              <Cpu size={16} />
              <span>On-Device Processing</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  icon: Icon,
  label,
  title,
  desc,
  color,
  iconColor,
  borderColor = "border-gray-100",
  delay,
  highlight,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-50px" }}
      transition={{ duration: 0.7, delay }}
      className={`relative flex flex-col items-center text-center p-8 rounded-[32px] ${color} border ${borderColor} ${highlight ? "shadow-2xl shadow-teal-500/10" : "shadow-xl shadow-black/5"}`}
    >
      <div
        className={`w-20 h-20 rounded-2xl ${highlight ? "bg-teal-50" : "bg-gray-50"} flex items-center justify-center mb-6 relative z-10 group transition-transform hover:scale-110 duration-500`}
      >
        <Icon size={32} className={iconColor} />
      </div>

      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
        {label}
      </span>
      <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
        {title}
      </h3>
      <p className="text-gray-500 leading-relaxed font-medium">{desc}</p>
    </motion.div>
  );
}
