"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Github,
  Music,
  Mail,
  Calendar,
  MessageSquare,
  Database,
  Cloud,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";

const integrations = [
  { name: "GitHub", icon: Github },
  { name: "Spotify", icon: Music },
  { name: "Gmail", icon: Mail },
  { name: "GCal", icon: Calendar },
  { name: "Slack", icon: MessageSquare },
  { name: "Notion", icon: Database },
  { name: "AWS", icon: Cloud },
  { name: "Linear", icon: Zap },
  { name: "Vercel", icon: Triangle },
  { name: "VS Code", icon: Terminal },
];

function Triangle(props: any) {
  return (
    <svg
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2L2 22H22L12 2Z" />
    </svg>
  );
}

export function Marquee() {
  return (
    <section className="py-12 mt-24 bg-white border-y border-gray-100 overflow-hidden relative">
      <div className="flex w-max">
        <motion.div
          animate={{ x: "-50%" }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          className="flex gap-12 px-6"
        >
          {/* Double the list for seamless loop */}
          {[...integrations, ...integrations].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-gray-400 font-semibold text-lg opacity-70 grayscale hover:grayscale-0 hover:text-black hover:opacity-100 transition-all duration-300 cursor-default"
            >
              <item.icon size={24} />
              <span>{item.name}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </section>
  );
}
