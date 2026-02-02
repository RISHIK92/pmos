"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Wallet,
  Brain,
  Terminal,
  Zap,
  Check,
  ChevronRight,
} from "lucide-react";
import { ThinkingBubble } from "./ThinkingBubble";

const scenarios = [
  {
    id: "finance",
    icon: Wallet,
    label: "Finance",
    sub: "Spend Analysis",
    query: "Am I over budget on coffee?",
    thinking: [
      "Accessing transaction stream...",
      "Filtering by category: 'Food & Drink' > 'Coffee'...",
      "Aggregating last 30 days...",
      "Comparing against monthly limit ($50.00)...",
    ],
    response:
      "You've spent **$64.50** on coffee this month. That is **$14.50 over** your set budget. Limit reached on Oct 24th.",
    color: "bg-emerald-500",
  },
  {
    id: "memory",
    icon: Brain,
    label: "Recall",
    sub: "Semantic Search",
    query: "What time was my meeting with Sarah?",
    thinking: [
      "Vector search: 'meeting Sarah'...",
      "Found audio transcript: 'Tuesday Sync' (0.89 similarity)...",
      "Extracting temporal entities...",
      "Cross-referencing Calendar...",
    ],
    response:
      "You agreed to meet Sarah at **2:00 PM tomorrow** at Blue Bottle. I've sent a calendar invite to both of you.",
    color: "bg-violet-500",
  },
  {
    id: "dev",
    icon: Terminal,
    label: "Dev",
    sub: "CI/CD & Git",
    query: "Deploy the staging branch.",
    thinking: [
      "Authenticating with GitHub...",
      "Checking branch 'staging' status...",
      "Running test suite (142 tests)...",
      "Triggering Vercel deployment hook...",
    ],
    response:
      "Deployment **#8492** initiated to **staging-dex-os.vercel.app**. Build #23 in progress. ETA: 45s.",
    color: "bg-gray-800",
  },
];

export function InteractiveGlass() {
  const [activeScenario, setActiveScenario] = useState(scenarios[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [step, setStep] = useState<"idle" | "thinking" | "result">("idle");
  const [thinkingText, setThinkingText] = useState("");

  const playScenario = async (scenario: (typeof scenarios)[0]) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveScenario(scenario);
    setStep("thinking");

    for (const text of scenario.thinking) {
      setThinkingText(text);
      await new Promise((r) => setTimeout(r, 800));
    }

    setStep("result");
    setTimeout(() => {
      setIsAnimating(false);
      setStep("idle");
    }, 5000);
  };

  return (
    <section className="py-32 px-4 relative bg-gray-50/50">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-violet-100 to-teal-100 rounded-full blur-[120px] -z-10 opacity-60" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter text-gray-900">
            See Dex{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Think.
            </span>
          </h2>
          <p className="text-xl text-gray-500 font-light">
            Agentic workflows that happen on-device. Click to observe the logic.
          </p>
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-[32px] shadow-2xl border border-white/40 ring-1 ring-black/5 overflow-hidden backdrop-blur-xl relative">
          <div className="flex flex-col md:flex-row min-h-[500px]">
            {/* Left: Sidebar / Controls */}
            <div className="w-full md:w-1/3 bg-gray-50/80 p-4 border-r border-gray-100 flex flex-col gap-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">
                Scenarios
              </div>
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => playScenario(s)}
                  disabled={isAnimating && activeScenario.id !== s.id}
                  className={`text-left p-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeScenario.id === s.id ? "bg-white shadow-md ring-1 ring-black/5" : "hover:bg-gray-100/50 opacity-60 hover:opacity-100"}`}
                >
                  {activeScenario.id === s.id && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gray-900"
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${activeScenario.id === s.id ? s.color + " text-white" : "bg-gray-200 text-gray-500"}`}
                    >
                      <s.icon size={18} />
                    </div>
                    <div>
                      <p
                        className={`font-semibold text-sm ${activeScenario.id === s.id ? "text-gray-900" : "text-gray-600"}`}
                      >
                        {s.label}
                      </p>
                      <p className="text-xs text-gray-400">{s.sub}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: Visualization Stage */}
            <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col justify-center relative bg-white">
              {/* State: Idle/Start */}
              <AnimatePresence mode="wait">
                {step === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 ring-1 ring-black/5">
                      {React.createElement(activeScenario.icon, {
                        size: 32,
                        className: "text-gray-400",
                      })}
                    </div>
                    <p className="text-2xl font-medium text-gray-900">
                      "{activeScenario.query}"
                    </p>
                    <button
                      onClick={() => playScenario(activeScenario)}
                      className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-medium text-sm hover:bg-black transition-colors flex items-center gap-2 shadow-lg shadow-gray-200"
                    >
                      Run Workflow <ArrowRight size={16} />
                    </button>
                  </motion.div>
                )}

                {/* State: Thinking */}
                {step === "thinking" && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center w-full"
                  >
                    <div className="mb-8">
                      <ThinkingBubble status={thinkingText} />
                    </div>
                    {/* Log Stream Effect */}
                    <div className="w-full max-w-sm space-y-2 opacity-50 font-mono text-xs">
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        key={thinkingText}
                        className="text-gray-500 border-l-2 border-gray-200 pl-3"
                      >
                        {thinkingText}
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* State: Result */}
                {step === "result" && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.3 }}
                    className="w-full max-w-sm mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className={`w-8 h-8 rounded-full ${activeScenario.color} flex items-center justify-center`}
                      >
                        <Check size={16} className="text-white" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        Task Completed
                      </span>
                    </div>
                    <p
                      className="text-gray-800 text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: activeScenario.response.replace(
                          /\*\*(.*?)\*\*/g,
                          '<span class="font-semibold text-gray-900 bg-gray-100 px-1 rounded">$1</span>',
                        ),
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
