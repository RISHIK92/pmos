"use client";

import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ThinkingBubbleProps {
  status: string;
}

export function ThinkingBubble({ status }: ThinkingBubbleProps) {
  return (
    <div className="flex items-center self-start bg-secondary rounded-full py-2 px-4 my-1 shadow-sm border border-border/50 max-w-[85%]">
      <motion.div
        className="mr-3 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        <Sparkles size={16} color="#FFF" />
      </motion.div>

      <div className="flex-1">
        <motion.p
          key={status} // Animate when status changes
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="text-[15px] font-semibold text-text-primary tracking-wide"
        >
          {status}
        </motion.p>
      </div>
    </div>
  );
}
