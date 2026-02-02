"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mic } from "lucide-react";
import { ThinkingBubble } from "./ThinkingBubble";

export function Hero() {
  const [demoStatus, setDemoStatus] = useState<string | null>("Listening...");
  const [demoResponse, setDemoResponse] = useState<string | null>(null);

  // Simple loop to demonstrate the UI
  useEffect(() => {
    const sequence = async () => {
      while (true) {
        setDemoStatus("Listening...");
        setDemoResponse(null);
        await new Promise((r) => setTimeout(r, 2000));

        setDemoStatus("Thinking...");
        await new Promise((r) => setTimeout(r, 1500));

        setDemoStatus("Searching your memories...");
        await new Promise((r) => setTimeout(r, 1500));

        setDemoStatus(null);
        setDemoResponse(
          "I found that you parked on Level 3, Row G yesterday at 5:30 PM.",
        );
        await new Promise((r) => setTimeout(r, 5000));
      }
    };
    sequence();
  }, []);

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 pt-20">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,184,148,0.05),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto z-10"
      >
        <span className="px-3 py-1 rounded-full bg-secondary text-primary text-sm font-semibold tracking-wide border border-border/50 mb-6 inline-block">
          PUBLIC BETA IS LIVE
        </span>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-text-primary">
          Your Life, <span className="text-gradient-primary">Optimized.</span>
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          Dex is the intelligent personal operating layer for your phone. It
          remembers your life, manages your finances, and helps you code.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg hover:bg-opacity-90 transition-all flex items-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transform">
            Download Beta <ArrowRight size={20} className="ml-2" />
          </button>
          <button className="px-8 py-4 bg-white text-text-primary border border-border rounded-full font-semibold text-lg hover:bg-secondary transition-all">
            View Features
          </button>
        </div>
      </motion.div>

      {/* Mockup Container */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mt-20 relative w-full max-w-[360px] md:max-w-[400px] aspect-[9/19] bg-gray-900 rounded-[50px] shadow-2xl border-[8px] border-gray-900 overflow-hidden"
      >
        {/* Screen Content */}
        <div className="w-full h-full bg-slate-50 relative flex flex-col">
          {/* Fake Apps */}
          <div className="grid grid-cols-4 gap-4 p-6 mt-12 opacity-50">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-gray-200" />
            ))}
          </div>

          {/* The Overlay Mockup */}
          <div className="absolute inset-x-0 bottom-0 top-0 bg-black/10 backdrop-blur-[2px] flex flex-col justify-end p-2 pb-8">
            <div className="mx-2 mb-2">
              {/* User Bubble */}
              {demoStatus && demoStatus !== "Listening..." && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className="bg-blue-500 text-white self-end rounded-2xl p-3 px-4 mb-4 max-w-[80%] ml-auto shadow-md"
                >
                  <p className="text-[14px]">Where did I park my car?</p>
                </motion.div>
              )}

              {/* AI Thinking/Response */}
              {demoStatus && demoStatus !== "Listening..." ? (
                <ThinkingBubble status={demoStatus} />
              ) : (
                demoResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary rounded-2xl p-4 shadow-sm border border-border/50 w-full"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>
                    <p className="text-text-primary text-[15px] leading-relaxed">
                      {demoResponse}
                    </p>
                  </motion.div>
                )
              )}
            </div>

            {/* Input Bar */}
            <div className="glass-panel mx-2 rounded-full p-2 flex items-center justify-between pl-4">
              <span className="text-gray-400 text-sm">Ask Dex...</span>
              {demoStatus === "Listening..." ? (
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-md animate-pulse">
                  <Mic size={20} color="white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Mic size={20} color="white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
