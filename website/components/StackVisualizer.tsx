"use client";

import React from "react";
import { motion } from "framer-motion";

export function StackVisualizer() {
  return (
    <section className="py-24 bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#333,transparent_70%)] opacity-40" />

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 tracking-tight">
          The{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
            Architecture
          </span>
        </h2>

        <div className="relative flex flex-col items-center gap-16">
          {/* Connecting Line */}
          <div className="absolute top-10 bottom-10 w-[2px] bg-gradient-to-b from-transparent via-gray-700 to-transparent left-1/2 -translate-x-1/2 -z-10" />

          {/* Node 1: React Native */}
          <Node
            title="Interface"
            subtitle="React Native (Expo)"
            details="120Hz Animations • Haptic Feedback"
            icon="📱"
          />

          {/* Node 2: LangGraph */}
          <Node
            title="Intelligence"
            subtitle="LangGraph Agents"
            details="State Management • Tool Routing"
            icon="🧠"
            highlight
          />

          {/* Node 3: Vector DB */}
          <Node
            title="Memory"
            subtitle="Local Vector DB"
            details="Semantic Search • Privacy First"
            icon="💾"
          />
        </div>
      </div>
    </section>
  );
}

function Node({ title, subtitle, details, icon, highlight = false }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-100px" }}
      className={`relative p-8 rounded-3xl border ${highlight ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/5"} backdrop-blur-md w-full max-w-sm`}
    >
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl mb-4 mx-auto">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-1">{title}</h3>
      <p
        className={`font-mono text-sm mb-4 ${highlight ? "text-primary" : "text-gray-400"}`}
      >
        {subtitle}
      </p>
      <div className="h-[1px] w-16 bg-white/20 mx-auto mb-4" />
      <p className="text-xs text-gray-500 uppercase tracking-widest">
        {details}
      </p>

      {/* Pulsing Dots for connection */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-black border-2 border-gray-700" />
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-black border-2 border-gray-700" />
    </motion.div>
  );
}
