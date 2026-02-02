"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Mic,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  Command,
  Cpu,
} from "lucide-react";

export function HowItWorks() {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-gray-900">
            From Voice to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500">
              Action.
            </span>
          </h2>
          <p className="text-xl text-gray-500 font-light">
            No more tapping through menus. Just ask, and Dex interprets your
            intent, plans the steps, and executes them on your OS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Beam (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-gray-200 via-violet-200 to-gray-200" />

          {/* Step 1: Speak */}
          <StepCard
            icon={Mic}
            label="Input"
            title="You Speak"
            desc="Natural language voice command."
            color="bg-black"
            delay={0}
          />

          {/* Step 2: Think */}
          <StepCard
            icon={Cpu}
            label="Process"
            title="Dex Thinks"
            desc="Dex plans the execution."
            color="bg-gray-700"
            delay={0.2}
            highlight
          />

          {/* Step 3: Act */}
          <StepCard
            icon={Zap}
            label="Output"
            title="Action Taken"
            desc="Direct OS-level execution."
            color="bg-emerald-600"
            delay={0.4}
          />
        </div>

        {/* Code Snippet Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 max-w-2xl mx-auto bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800 font-mono text-sm overflow-hidden"
        >
          <div className="flex gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="space-y-2">
            <p className="text-gray-500"># The Pipeline</p>
            <p className="text-white">
              <span className="text-purple-400">user_input</span> ={" "}
              <span className="text-green-400">"Order an Uber to SFO"</span>
            </p>
            <p className="text-white">
              <span className="text-blue-400">plan</span> ={" "}
              <span className="text-yellow-400">agent.think(user_input)</span>
            </p>
            <p className="text-gray-500">
              {" "}
              [Open Uber, Set Destination, Request]
            </p>
            <p className="text-white">
              <span className="text-red-400">await</span> system.execute(
              <span className="text-blue-400">plan</span>)
            </p>
          </div>
        </motion.div>
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
  delay,
  highlight,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="relative flex flex-col items-center text-center"
    >
      <div
        className={`w-24 h-24 rounded-3xl ${color} flex items-center justify-center shadow-xl shadow-gray-200 mb-8 relative z-10 group transition-transform hover:scale-105 duration-500`}
      >
        <Icon size={40} className="text-white" />
        {highlight && (
          <div className="absolute inset-0 rounded-3xl bg-gray-500 blur-xl -z-10 opacity-40 animate-pulse" />
        )}
      </div>

      <span className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">
        {label}
      </span>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed max-w-xs">{desc}</p>
    </motion.div>
  );
}
