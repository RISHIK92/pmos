"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, ChevronRight } from "lucide-react";
import { ThinkingBubble } from "./ThinkingBubble";

const scenarios = [
  {
    id: "finance",
    label: "Check Spending",
    query: "How much did I spend on food this week?",
    thinkingSteps: [
      "Accessing Finance.db...",
      "Analyzing transactions...",
      "Grouping by category 'Food'...",
    ],
    response:
      "You've spent **$145.50** on food this week. That's **12% less** than last week. 🥗",
  },
  {
    id: "memory",
    label: "Recall Info",
    query: "When is my car insurance due?",
    thinkingSteps: [
      "Searching memory vector store...",
      "Found emails from Geico...",
      "Extracting dates...",
    ],
    response:
      "Your car insurance with Geico expires on **March 15th, 2026**. I've set a reminder for March 1st. 🚗",
  },
  {
    id: "dev",
    label: "Dev Mode",
    query: "Create a PR for the innovative feature.",
    thinkingSteps: [
      "Connecting to GitHub...",
      "Pushing branch 'feature/innovative'...",
      "Generating PR description...",
    ],
    response:
      "PR #42 **'feat: innovative feature'** has been created. I've also added an entry to your Dev Journal. 💻",
  },
];

export function InteractiveDemo() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);

  const playScenario = async (scenarioId: string) => {
    if (isTyping) return;
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    setActiveScenario(scenarioId);
    setMessages([]); // Clear previous
    setIsTyping(true);

    // 1. User Message
    await new Promise((r) => setTimeout(r, 300));
    setMessages([{ role: "user", text: scenario.query }]);

    // 2. Thinking Simulation
    for (const step of scenario.thinkingSteps) {
      setThinkingStatus(step);
      await new Promise((r) => setTimeout(r, 1200));
    }

    // 3. Final Response
    setThinkingStatus(null);
    setMessages((prev) => [...prev, { role: "ai", text: scenario.response }]);
    setIsTyping(false);
  };

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="px-3 py-1 bg-secondary text-primary rounded-full text-xs font-bold tracking-widest uppercase mb-4 inline-block">
            Try It Out
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            Experience the <span className="text-primary">Workflow</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            See how Dex handles complex requests in real-time. Select a scenario
            below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => playScenario(s.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between group ${
                  activeScenario === s.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                }`}
              >
                <div>
                  <h4
                    className={`font-semibold ${activeScenario === s.id ? "text-primary" : "text-text-primary"}`}
                  >
                    {s.label}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1 opacity-80 truncate max-w-[200px]">
                    "{s.query}"
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className={`transition-transform duration-300 ${
                    activeScenario === s.id
                      ? "text-primary translate-x-1"
                      : "text-gray-300 group-hover:text-primary/50"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2 bg-secondary/30 rounded-3xl border border-border overflow-hidden h-[450px] flex flex-col shadow-inner relative">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur border-b border-border p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm">
                  Dex Assistant
                </h3>
                <p className="text-xs text-text-secondary flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{" "}
                  Online
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 && !thinkingStatus && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="flex-1 flex items-center justify-center flex-col gap-4 text-text-secondary"
                  >
                    <Send size={48} className="opacity-20" />
                    <p>Select a scenario to start</p>
                  </motion.div>
                )}

                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 mr-3 flex items-center justify-center text-white text-xs font-bold mt-1">
                        D
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-white border border-border/50 text-text-primary rounded-bl-none"
                      }`}
                    >
                      {/* Allow basic markdown-like bolding */}
                      <p
                        dangerouslySetInnerHTML={{
                          __html: msg.text.replace(
                            /\*\*(.*?)\*\*/g,
                            "<strong>$1</strong>",
                          ),
                        }}
                      />
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 ml-3 flex items-center justify-center text-gray-600 mt-1">
                        <User size={16} />
                      </div>
                    )}
                  </motion.div>
                ))}

                {thinkingStatus && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="self-start"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                        D
                      </div>
                      <ThinkingBubble status={thinkingStatus} />
                    </div>
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
