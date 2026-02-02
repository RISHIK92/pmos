"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  // Base
  Menu,
  Bell,
  Plus,
  Search,
  ArrowUpRight,
  // Icons
  Mic,
  TrendingUp,
  Brain,
  Heart,
  CreditCard,
  Send,
  Download,
  FileText,
  Clock,
  Moon,
  Droplets,
  Flame,
  // New Icons for Focus/Tasks/Content
  Zap,
  BookOpen,
  Leaf,
  ListTodo,
  Briefcase,
  AlarmClock,
  PlayCircle,
  Instagram,
  Linkedin,
  CheckCircle2,
  Circle,
} from "lucide-react";

export function MobileShowcase() {
  const [activeScreen, setActiveScreen] = useState(0);

  const screens = [
    {
      id: "home",
      label: "Assistant",
      content: <HomeScreen />,
    },
    {
      id: "restrictor",
      label: "Focus",
      content: <FocusScreen />,
    },
    {
      id: "finance",
      label: "Finance",
      content: <FinanceScreen />,
    },
    {
      id: "tasks",
      label: "Tasks",
      content: <TasksScreen />,
    },
    {
      id: "memory",
      label: "Memory",
      content: <MemoryScreen />,
    },
    {
      id: "content",
      label: "Content",
      content: <ContentScreen />,
    },
    {
      id: "health",
      label: "Health",
      content: <HealthScreen />,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % screens.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-gray-900">
            One App. <span className="text-gray-400">Total Control.</span>
          </h2>
          <p className="text-xl text-gray-500">
            The actual operating system running on your device.
          </p>
        </div>

        <div className="flex flex-col items-center">
          {/* Phone Mockup Frame */}
          <div className="relative w-[340px] h-[700px] bg-black rounded-[55px] shadow-2xl border-[8px] border-gray-900 overflow-hidden ring-1 ring-black/10">
            {/* Dynamic Island */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-9 bg-black rounded-full z-30 flex items-center justify-center gap-2 px-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
            </div>

            {/* Status Bar Area (Visual only, underlying transparency handled by screens) */}
            <div className="absolute top-0 w-full h-14 bg-transparent z-20 pointer-events-none" />

            {/* Screen Content - REMOVED PADDING AND BACKGROUND from container to allow immersive screens */}
            <div className="w-full h-full relative overflow-hidden bg-black rounded-[45px]">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={activeScreen}
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-25%", opacity: 0.5 }} // Slight parallax exit
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="w-full h-full absolute inset-0"
                >
                  {screens[activeScreen].content}
                </motion.div>
              </AnimatePresence>

              {/* Bottom Tab Bar (Simulated) */}
              <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-black/5 to-transparent flex items-center justify-around pb-6 px-6 z-20 pointer-events-none">
                {/* Just show simple dots for tabs to save space */}
                <div className="flex gap-2 p-2 rounded-full bg-black/20 backdrop-blur-md">
                  {screens.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeScreen ? "bg-white" : "bg-white/30"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Indicators */}
          <div className="mt-12 flex flex-wrap gap-4 justify-center max-w-2xl">
            {screens.map((screen, i) => (
              <button
                key={i}
                onClick={() => setActiveScreen(i)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeScreen === i ? "bg-black text-white shadow-lg scale-105" : "bg-white text-gray-500 hover:bg-gray-100"}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${activeScreen === i ? "bg-blue-400 animate-pulse" : "bg-gray-300"}`}
                />
                {screen.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeScreen() {
  return (
    <div className="w-full h-full bg-[#FAFAFA] flex flex-col relative pt-14 pb-0">
      <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-100">
        <Menu size={24} className="text-gray-800" />
        <Bell size={20} className="text-gray-800" />
      </div>
      <div className="flex-1 p-4 space-y-6 overflow-hidden">
        <div className="flex justify-end">
          <div className="bg-black text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
            <p className="text-sm">What's my spending look like this week?</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Analyzing finances...
            </span>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-start w-full"
        >
          <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[90%] space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp size={12} className="text-green-600" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Analysis
              </span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">
              You've spent <span className="font-bold">₹12,450</span> this week.
              That's{" "}
              <span className="text-green-600 font-medium">15% less</span> than
              usual. Good job!
            </p>
          </div>
        </motion.div>
      </div>
      <div className="p-4 bg-white border-t border-gray-100 pb-20">
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-full border border-gray-200">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-400">
            <Plus size={20} />
          </button>
          <div className="flex-1 text-gray-400 text-sm pl-2">
            Ask anything...
          </div>
          <button className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md text-white">
            <Mic size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FocusScreen() {
  return (
    <div className="w-full h-full bg-white flex flex-col pt-14 pb-8 px-6 relative">
      <div className="mb-2">
        <Menu size={24} className="text-gray-900" />
      </div>

      <div className="flex-1 flex flex-col items-center pt-8">
        {/* Mode Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full mb-8">
          <Briefcase size={14} className="text-gray-800" fill="currentColor" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
            Work
          </span>
        </div>

        {/* Timer Input */}
        <div className="flex items-baseline justify-center mb-10">
          <span className="text-8xl font-extralight text-black tracking-tighter">
            30
          </span>
          <span className="text-2xl text-gray-300 ml-1 font-normal">min</span>
        </div>

        {/* Mode Selector */}
        <div className="w-full flex gap-3 overflow-x-auto pb-4 hide-scrollbar justify-center">
          {[
            {
              label: "Work",
              icon: Briefcase,
              active: true,
              color: "text-gray-900",
              bg: "bg-gray-100",
              border: "border-transparent",
            },
            {
              label: "Study",
              icon: BookOpen,
              active: false,
              color: "text-blue-500",
              bg: "bg-white",
              border: "border-gray-100",
            },
            {
              label: "Sleep",
              icon: Moon,
              active: false,
              color: "text-gray-500",
              bg: "bg-white",
              border: "border-gray-100",
            },
          ].map((m, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border ${m.active ? "bg-gray-100 border-gray-100" : "bg-white border-gray-100"}`}
            >
              <m.icon
                size={14}
                className={m.active ? "text-gray-900" : "text-gray-400"}
                fill={m.active ? "currentColor" : "none"}
              />
              <span
                className={`text-xs font-bold ${m.active ? "text-gray-900" : "text-gray-400"}`}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {/* Last Sessions Link */}
        <div className="mt-6 flex items-center gap-2 text-gray-400">
          <Clock size={14} />
          <span className="text-xs font-bold">Last Sessions</span>
        </div>
      </div>

      <button className="w-full bg-black text-white py-5 rounded-[30px] font-bold text-lg shadow-xl shadow-gray-200 flex items-center justify-between px-8 mb-4">
        <span>Start Session</span>
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <ArrowUpRight size={16} className="text-black" />
        </div>
      </button>
    </div>
  );
}

function TasksScreen() {
  return (
    <div className="w-full h-full bg-white flex flex-col px-6 pt-14 pb-8">
      <div className="mb-8 pt-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">
          Command Center
        </h2>
        <p className="text-gray-400 text-sm">Track your progress.</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase
              size={16}
              className="text-blue-500"
              fill="currentColor"
            />
            <span className="text-xs font-bold uppercase text-gray-400">
              Work
            </span>
            <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold">
              2
            </span>
          </div>
          <div className="space-y-2">
            {[
              { title: "Q4 Report", due: "Today", status: "In Progress" },
              { title: "Client Meeting", due: "Fri", status: "Pending" },
            ].map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <Circle size={20} className="text-gray-300" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-400">Due {t.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlarmClock
              size={16}
              className="text-red-500"
              fill="currentColor"
            />
            <span className="text-xs font-bold uppercase text-gray-400">
              Deadlines
            </span>
            <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold">
              1
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
            <Circle size={20} className="text-red-300" />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Submit Taxes</p>
              <p className="text-xs text-red-500 font-medium">
                Critical • Jan 15
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceScreen() {
  return (
    <div className="w-full h-full bg-white flex flex-col pt-14 pb-8">
      <div className="px-6 pt-2 pb-6">
        <p className="text-gray-500 text-sm font-medium mb-1">Total Balance</p>
        <div className="flex items-baseline gap-1 mb-2">
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            ₹12,450
          </h2>
          <span className="text-2xl text-gray-400">.00</span>
        </div>
        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 rounded-full">
          <ArrowUpRight size={14} className="text-green-600" />
          <span className="text-xs font-bold text-green-600">
            +2.5% this month
          </span>
        </div>
      </div>

      <div className="pl-2 mb-8 overflow-hidden">
        <div className="flex gap-3">
          <div className="w-[150px] h-[100px] bg-[#6C5CE7] rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-indigo-200">
            <div className="flex justify-between text-white/80">
              <CreditCard size={16} />
              <span className="text-[10px] font-bold">Main</span>
            </div>
            <div className="text-white">
              <p className="text-lg font-bold">₹8,240</p>
              <p className="text-[10px] opacity-70">.... 4921</p>
            </div>
          </div>
          <div className="w-[150px] h-[100px] bg-[#00B894] rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-emerald-100">
            <div className="flex justify-between text-white/80">
              <CreditCard size={16} />
              <span className="text-[10px] font-bold">Savings</span>
            </div>
            <div className="text-white">
              <p className="text-lg font-bold">₹4,210</p>
              <p className="text-[10px] opacity-70">.... 8821</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 flex justify-between mb-8 gap-4">
        {[
          { label: "Send", icon: Send, color: "#F1F2F6" },
          { label: "Request", icon: Download, color: "#F1F2F6" },
          { label: "Bills", icon: FileText, color: "#F1F2F6" },
        ].map((a, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
              <a.icon size={20} className="text-gray-700" />
            </div>
            <span className="text-xs font-medium text-gray-500">{a.label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-gray-50 rounded-t-[32px] p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Transactions</h3>
        <div className="space-y-4">
          {[
            {
              name: "Apple Store",
              cat: "Electronics",
              amt: "-₹999",
              icon: "🍎",
            },
            {
              name: "Uber Eats",
              cat: "Food & Drink",
              amt: "-₹455",
              icon: "🍔",
            },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg shadow-sm">
                  {t.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.cat}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900">{t.amt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoryScreen() {
  return (
    <div className="w-full h-full bg-white flex flex-col pt-14 pb-8">
      <div className="px-6 space-y-1 mb-6 pt-6">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
        <p className="text-gray-400 text-sm">42 stored memories</p>
      </div>
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-3 rounded-xl">
          <Search size={18} className="text-gray-400" />
          <span className="text-gray-400 text-sm">Search memories...</span>
        </div>
      </div>
      <div className="flex-1 px-6 space-y-4 overflow-hidden">
        {[
          {
            title: "Grandma's Recipe",
            tag: "Family",
            color: "bg-orange-100 text-orange-600",
            icon: "🥘",
          },
          {
            title: "Passport Scan",
            tag: "Personal",
            color: "bg-blue-100 text-blue-600",
            icon: "📘",
          },
          {
            title: "Wifi Password",
            tag: "Home",
            color: "bg-purple-100 text-purple-600",
            icon: "🔑",
          },
        ].map((m, i) => (
          <div
            key={i}
            className="flex gap-4 p-4 border border-gray-100 rounded-2xl shadow-sm bg-white"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg bg-gray-50`}
            >
              {m.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="flex justify-between mb-1">
                <h4 className="font-bold text-sm text-gray-900">{m.title}</h4>
                <span className="text-xs text-gray-300">Just now</span>
              </div>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                Detailed content regarding {m.title.toLowerCase()}...
              </p>
              <span
                className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${m.color}`}
              >
                {m.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentScreen() {
  return (
    <div className="w-full h-full bg-white flex flex-col px-6 pt-14 pb-8">
      <div className="mb-8 pt-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Content Hub</h2>
        <p className="text-gray-400 text-sm">Curated for you.</p>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">
          Continue Watching
        </h3>
        <div className="flex gap-4 overflow-hidden">
          {[
            { title: "Inception", platform: "Netflix", color: "bg-red-600" },
            { title: "Severance", platform: "Apple TV+", color: "bg-gray-900" },
          ].map((m, i) => (
            <div
              key={i}
              className={`w-32 h-44 ${m.color} rounded-xl p-3 flex flex-col justify-between shadow-md shrink-0`}
            >
              <div className="text-white/80">
                <PlayCircle size={24} />
              </div>
              <div>
                <span className="text-[10px] text-white/70 font-bold uppercase">
                  {m.platform}
                </span>
                <p className="text-white font-bold text-sm leading-tight">
                  {m.title}
                </p>
                <div className="w-full bg-white/30 h-1 rounded-full mt-2">
                  <div className="w-3/4 bg-white h-full rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">
          Social Shortcuts
        </h3>
        <div className="flex gap-4">
          {[
            { icon: Instagram, color: "text-pink-600", bg: "bg-pink-50" },
            { icon: Linkedin, color: "text-blue-700", bg: "bg-blue-50" },
            { icon: FileText, color: "text-gray-700", bg: "bg-gray-100" },
          ].map((s, i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-full ${s.bg} flex items-center justify-center`}
            >
              <s.icon size={20} className={s.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthScreen() {
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 pt-14 pb-8">
      <div className="flex justify-between items-center mb-8 pt-6">
        <h2 className="text-2xl font-bold text-gray-900">Health</h2>
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <Heart size={16} className="text-red-500" fill="currentColor" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-3xl p-5 flex flex-col justify-between h-36">
          <div className="flex justify-between">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <TrendingUp size={18} className="text-black" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">8,432</p>
            <p className="text-xs text-gray-500 font-medium">Steps</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl p-5 flex flex-col justify-between h-36 text-white">
          <div className="flex justify-between">
            <div className="p-2 bg-white/10 rounded-xl">
              <Moon size={18} className="text-white" fill="currentColor" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">7h 12m</p>
            <p className="text-xs text-gray-400 font-medium">Sleep</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-3xl p-5 flex flex-col justify-between h-36">
          <div className="flex justify-between">
            <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500">
              <Droplets size={18} fill="currentColor" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900">1.2L</p>
            <p className="text-xs text-blue-400 font-medium">Water</p>
          </div>
        </div>

        <div className="bg-orange-50 rounded-3xl p-5 flex flex-col justify-between h-36">
          <div className="flex justify-between">
            <div className="p-2 bg-white rounded-xl shadow-sm text-orange-500">
              <Flame size={18} fill="currentColor" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-900">420</p>
            <p className="text-xs text-orange-400 font-medium">Kcal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
