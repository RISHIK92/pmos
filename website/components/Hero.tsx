"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Download, Star } from "lucide-react";
import { ThinkingBubble } from "./ThinkingBubble";

export function Hero() {
  const [demoStatus, setDemoStatus] = useState<string | null>("Listening...");
  const [demoResponse, setDemoResponse] = useState<string | null>(null);

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
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 pt-12 md:pt-0">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_30%,rgba(0,184,148,0.1),transparent_60%)]" />
      <div className="absolute left-0 bottom-0 top-0 w-1/3 bg-gradient-to-r from-gray-50/50 to-transparent -z-10" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT: Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-left px-4 lg:px-0"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-semibold tracking-wide border border-emerald-100 mb-6">
            <Star size={14} fill="currentColor" /> Public Beta Live
          </div>

          <h1 className="text-6xl md:text-[5.5rem] font-bold tracking-tight mb-8 text-gray-400 leading-[1.05]">
            Your Life, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">
              Optimized.
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-xl mb-10 leading-relaxed font-light">
            Dex is the intelligent personal operating layer for your phone. It
            doesn't just listen; it{" "}
            <span className="text-gray-900 font-medium">remembers</span>{" "}
            context, <span className="text-gray-900 font-medium">manages</span>{" "}
            tasks, and <span className="text-gray-900 font-medium">acts</span>{" "}
            on your behalf.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <button className="px-8 py-4 bg-teal-600 text-white rounded-full font-bold text-lg hover:bg-teal-700 transition-all flex items-center shadow-xl shadow-teal-200 hover:scale-105 active:scale-95 transform group">
              <Download size={20} className="mr-2" /> Download Beta
            </button>
            <button className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all flex items-center group">
              Watch Demo{" "}
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-400">
            Available on iOS & Android via Expo Go.
          </p>
        </motion.div>

        {/* RIGHT: Mockup Animation */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotate: 5 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full flex justify-center lg:justify-end"
        >
          <div className="relative w-full max-w-[380px] aspect-[9/19] bg-gray-900 rounded-[55px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[8px] border-gray-900 overflow-hidden ring-4 ring-black/5">
            {/* Screen Content */}
            <div className="w-full h-full bg-slate-50 relative flex flex-col">
              {/* Status Bar */}
              <div className="h-8 w-full flex justify-between px-6 items-center mt-2">
                <span className="text-xs font-bold text-gray-800">9:41</span>
                <div className="flex gap-1.5">
                  <div className="w-4 h-2.5 bg-gray-800 rounded-[2px]" />
                  <div className="w-4 h-2.5 bg-gray-800 rounded-[2px]" />
                  <div className="w-6 h-2.5 bg-gray-800 rounded-[2px]" />
                </div>
              </div>

              {/* Fake Apps */}
              <div className="grid grid-cols-4 gap-4 p-6 mt-8 opacity-40">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl bg-gray-200 shadow-sm"
                  />
                ))}
              </div>

              {/* The Overlay Mockup (Preserved Logic) */}
              <div className="absolute inset-x-0 bottom-0 top-0 bg-black/5 backdrop-blur-[2px] flex flex-col justify-end p-2 pb-8">
                <div className="mx-2 mb-2">
                  {/* User Bubble */}
                  {demoStatus && demoStatus !== "Listening..." && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      className="bg-blue-600 text-white self-end rounded-2xl rounded-tr-sm p-3 px-4 mb-4 max-w-[85%] ml-auto shadow-md"
                    >
                      <p className="text-[15px] font-medium">
                        Where did I park my car?
                      </p>
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
                        className="bg-white rounded-2xl rounded-tl-sm p-5 shadow-lg border border-gray-100 w-full"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                            <Star
                              size={12}
                              className="text-white"
                              fill="currentColor"
                            />
                          </div>
                          <span className="text-xs font-bold text-teal-600 tracking-wide uppercase">
                            Dex Memory
                          </span>
                        </div>
                        <p className="text-gray-800 text-[16px] leading-relaxed font-medium">
                          {demoResponse}
                        </p>
                      </motion.div>
                    )
                  )}
                </div>

                {/* Input Bar */}
                <div className="mx-2 bg-white/80 backdrop-blur-xl rounded-full p-2 flex items-center justify-between pl-5 shadow-lg border border-white/50">
                  <span className="text-gray-400 text-sm font-medium">
                    Ask Dex...
                  </span>
                  {demoStatus === "Listening..." ? (
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg animate-pulse ring-4 ring-red-100">
                      <Mic size={22} color="white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg ring-4 ring-gray-100">
                      <Mic size={22} color="white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
