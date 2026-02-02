"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Database,
  TrendingUp,
  GitBranch,
  Search,
  PieChart,
  Code,
  FileText,
  MessageSquare,
  Mail,
  Sparkles,
  Folder,
  ArrowRight,
  Globe,
} from "lucide-react";

// --- Memory Visual Component (Refined) ---
function MemoryVisual() {
  const [phase, setPhase] = useState<"idle" | "typing" | "scanning" | "found">(
    "idle",
  );
  const [query, setQuery] = useState("");
  const fullQuery = "budget for project X";

  const documents = [
    {
      id: 1,
      type: "email",
      icon: Mail,
      title: "Email from Sarah",
      date: "yesterday",
      context: "mentioned budget",
    },
    {
      id: 2,
      type: "doc",
      icon: FileText,
      title: "Contract_v2.pdf",
      date: "just now",
      isTarget: true,
    },
    {
      id: 3,
      type: "chat",
      icon: MessageSquare,
      title: "Slack: #marketing",
      date: "2h ago",
      context: "approved cost",
    },
    {
      id: 4,
      type: "note",
      icon: FileText,
      title: "Meeting Notes",
      date: "Monday",
      context: null,
    },
  ];

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const runSequence = async () => {
      // Phase 1: Typing
      setPhase("typing");
      for (let i = 0; i <= fullQuery.length; i++) {
        setQuery(fullQuery.slice(0, i));
        await new Promise((r) => setTimeout(r, 50));
      }

      // Phase 2: Scanning
      setPhase("scanning");
      await new Promise((r) => setTimeout(r, 1500));

      // Phase 3: Found
      setPhase("found");
      await new Promise((r) => setTimeout(r, 4000));

      // Reset
      setPhase("idle");
      setQuery("");
    };

    runSequence();

    return () => {}; // Cleanup not fully implemented for simpler loop logic, but ideally should cancel promises
  }, []);

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden bg-gray-50 rounded-3xl font-sans">
      {/* Search Header */}
      <div className="p-6 border-b border-gray-200 bg-white z-10">
        <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-xl border border-gray-200 transition-colors duration-300 ${phase === 'scanning' ? 'border-violet-300 ring-2 ring-violet-100' : ''}">
          <Search
            size={18}
            className={`transition-colors ${phase !== "idle" ? "text-violet-600" : "text-gray-500"}`}
          />
          <span className="text-gray-700 font-medium text-sm h-5 flex items-center">
            {query}
            {phase === "typing" && (
              <span className="w-0.5 h-4 bg-violet-500 ml-1 animate-pulse" />
            )}
            {query === "" && (
              <span className="text-gray-400">Search for anything...</span>
            )}
          </span>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 p-6 relative flex flex-col gap-3">
        {documents.map((doc, i) => {
          const isTarget = doc.isTarget;
          const isContext = !!doc.context && phase === "found";
          const isDimmed = phase === "found" && !isTarget && !isContext;

          return (
            <motion.div
              key={doc.id}
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: isTarget && phase === "found" ? 1.02 : 1,
                opacity: isDimmed ? 0.3 : 1,
                borderColor:
                  isTarget && phase === "found"
                    ? "#8B5CF6"
                    : isContext
                      ? "#A78BFA"
                      : "transparent",
                backgroundColor:
                  isTarget && phase === "found"
                    ? "#FFFFFF"
                    : isContext
                      ? "#F5F3FF"
                      : "transparent",
              }}
              className={`p-3 rounded-xl border-2 flex items-center gap-4 transition-all relative ${isTarget && phase === "found" ? "shadow-lg shadow-violet-100" : ""}`}
            >
              <div
                className={`p-2 rounded-lg transition-colors ${isTarget && phase === "found" ? "bg-violet-100 text-violet-600" : "bg-gray-200 text-gray-500"}`}
              >
                <doc.icon size={18} />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4
                    className={`font-semibold text-sm transition-colors ${isTarget && phase === "found" ? "text-violet-900" : "text-gray-800"}`}
                  >
                    {doc.title}
                  </h4>
                  {isContext && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-bold text-violet-500 bg-violet-100 px-2 py-0.5 rounded-full"
                    >
                      CONTEXT LINK
                    </motion.span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{doc.date}</p>
              </div>

              {/* Connecting Line for Context */}
              {isContext && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  className="absolute left-6 top-10 w-0.5 bg-violet-200 -z-10"
                />
              )}
            </motion.div>
          );
        })}

        {/* Scanning Beam */}
        {phase === "scanning" && (
          <motion.div
            layoutId="scan-beam"
            className="absolute inset-x-0 h-32 bg-gradient-to-b from-violet-500/0 via-violet-500/10 to-violet-500/0 z-20 pointer-events-none backdrop-blur-[1px]"
            initial={{ top: "-20%" }}
            animate={{ top: "120%" }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}

const features = [
  {
    id: "web-intel",
    title: "The Web. Real-time.",
    subtitle: "Live Intelligence",
    description:
      "Dex has direct access to the web. Ask about stock prices, sports scores, or breaking news. It browses, synthesizes, and delivers answers with sources.",
    icon: Globe,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    visualContent: (
      <div className="w-full h-full flex flex-col bg-gray-50 rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="px-8 py-6 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Live Web Search
            </span>
          </div>
          <div className="text-lg font-medium text-gray-900">
            "Who won the Monaco GP today?"
          </div>
        </div>

        {/* Results Stream */}
        <div className="p-8 space-y-6">
          {/* Sources */}
          <div className="flex gap-3 overflow-hidden">
            {["Motorsport.com", "F1 Official", "Sky Sports"].map(
              (source, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-xs font-medium text-gray-600"
                >
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0" />
                  {source}
                </div>
              ),
            )}
          </div>

          {/* Answer Card */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xl shadow-blue-500/5 relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Globe size={100} className="text-blue-500" />
            </div>
            <div className="relative z-10">
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Verstappen wins in Monaco.
              </h4>
              <p className="text-gray-600 leading-relaxed text-sm">
                Max Verstappen secured victory at the Monaco Grand Prix, holding
                off a late challenge from Fernando Alonso. Ocon finished third
                for Alpine.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-500">
                  Formule 1
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-500">
                  2h ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "memory",
    title: "Recall Everything.",
    subtitle: "Local Vector Database",
    description:
      "Dex indexes context. Every conversation, email, and document is semantically searchable. It's a second brain that stays on your device.",
    icon: Database,
    color: "bg-violet-600",
    textColor: "text-violet-600",
    visualContent: <MemoryVisual />,
  },
  {
    id: "finance",
    title: "Wealth Planner",
    subtitle: "Proactive AI Planning",
    description:
      "Connects to your financial stream to categorize, analyze, and predict your financial health in real-time. No manual logging required.",
    icon: TrendingUp,
    color: "bg-emerald-600",
    textColor: "text-emerald-600",
    visualContent: (
      <div className="w-full h-full flex flex-col bg-gray-900 text-white rounded-3xl overflow-hidden relative">
        {/* Gradient Overlay */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/20 blur-[100px] rounded-full" />

        <div className="p-8 relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-sm text-emerald-400 font-medium uppercase tracking-wider mb-1">
                Net Worth
              </p>
              <h3 className="text-5xl font-bold tracking-tighter">$142,450</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
          </div>

          {/* Graph Line */}
          <div className="h-32 w-full flex items-end gap-1 mb-8">
            {[40, 45, 42, 55, 60, 58, 65, 78, 85, 82, 90, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className={`flex-1 rounded-t-sm ${i === 11 ? "bg-emerald-500" : "bg-white/10"}`}
              />
            ))}
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-bold uppercase">Recent</p>
            {[
              { name: "Apple Inc.", amount: "-$14.99", icon: "🍎" },
              {
                name: "Salary Deposit",
                amount: "+$4,250",
                icon: "💰",
                pos: true,
              },
            ].map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tx.icon}</span>
                  <span className="font-medium text-sm text-gray-200">
                    {tx.name}
                  </span>
                </div>
                <span
                  className={`font-medium ${tx.pos ? "text-emerald-400" : "text-gray-400"}`}
                >
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "dev",
    title: "Deep Work OS.",
    subtitle: "GitHub Manager",
    description:
      "Brings your Issues, PRs, and CI/CD pipelines directly into your operating layer. Manage code without the tab clutter.",
    icon: GitBranch,
    color: "bg-gray-800",
    textColor: "text-gray-800",
    visualContent: (
      <div className="w-full h-full bg-[#0d1117] rounded-3xl p-6 overflow-hidden relative shadow-2xl flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex bg-gray-900 rounded-lg p-1">
            <div className="px-3 py-1 bg-gray-800 rounded font-medium text-xs text-white">
              Board
            </div>
            <div className="px-3 py-1 text-gray-500 font-medium text-xs">
              Graph
            </div>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex gap-4 flex-1">
          {/* Column 1: Backlog */}
          <div className="flex-1 bg-gray-900/50 rounded-xl p-3 flex flex-col gap-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
              ToDo
            </div>
            {/* Card */}
            <div className="bg-[#161b22] p-3 rounded-lg border border-gray-800 shadow-sm">
              <p className="text-gray-300 text-sm font-medium mb-2">
                Optimize DB Queries
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-[10px] text-gray-500">#492</span>
              </div>
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="flex-1 bg-gray-900/50 rounded-xl p-3 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 blur-[20px]" />
            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest px-1 flex justify-between">
              In Progress{" "}
              <span className="text-[10px] bg-blue-500/20 px-1.5 rounded text-blue-300">
                2
              </span>
            </div>

            {/* Active Card 1 */}
            <div className="bg-[#161b22] p-4 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white text-sm font-semibold">
                  API Integration
                </span>
                <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white">
                  R
                </span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: "0%" }}
                  whileInView={{ width: "75%" }}
                  transition={{ duration: 1.5, delay: 0.2 }}
                  className="bg-blue-500 h-full rounded-full"
                />
              </div>
              <div className="flex gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <GitBranch size={10} /> fe/api-v2
                </span>
              </div>
            </div>

            {/* Active Card 2 */}
            <div className="bg-[#161b22] p-3 rounded-lg border border-gray-800 opacity-60">
              <p className="text-gray-300 text-sm font-medium mb-2">
                Auth Refactor
              </p>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-indigo-500" />
                  <div className="w-4 h-4 rounded-full bg-purple-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="flex-1 bg-gray-900/50 rounded-xl p-3 flex flex-col gap-3">
            <div className="text-xs font-bold text-green-500 uppercase tracking-widest px-1">
              Done
            </div>
            {/* Done Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-[#161b22] p-3 rounded-lg border border-green-900/50 flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <p className="text-gray-300 text-sm font-medium line-through decorate-gray-600">
                  Home Hero UI
                </p>
                <div className="bg-green-500/10 p-1 rounded-full text-green-500">
                  <Sparkles size={12} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    ),
  },
];

export function ParallaxFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={containerRef} className="relative bg-white pt-24 pb-48">
      {features.map((feature, index) => (
        <FeatureBlock key={feature.id} feature={feature} index={index} />
      ))}
    </section>
  );
}

function FeatureBlock({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center sticky top-0 px-4">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        {/* Text Content */}
        <div className="md:pr-12">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm font-bold tracking-wide mb-8 ${feature.textColor}`}
          >
            <feature.icon size={16} />
            {feature.subtitle}
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tighter leading-tight mb-6">
            {feature.title}
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            {feature.description}
          </p>

          <button className="mt-8 flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all relative group">
            Learn more
            <ArrowRight size={18} />
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
          </button>
        </div>

        {/* Solid Card Visual */}
        <div className="h-[500px] w-full bg-white rounded-[40px] shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden transform transition-all hover:scale-[1.02] duration-500">
          {feature.visualContent}
        </div>
      </div>
    </div>
  );
}
