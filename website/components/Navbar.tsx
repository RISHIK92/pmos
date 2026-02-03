"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={`pointer-events-auto bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 rounded-full px-2 py-2 flex items-center gap-2 transition-all duration-300 ${
            scrolled ? "scale-[0.98] bg-white/80" : "scale-100"
          }`}
        >
          {/* Brand Pill */}
          <div className="flex items-center gap-2 bg-white rounded-full pl-2 pr-4 py-1.5 shadow-sm border border-black/5">
            <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-gray-900">
              Dex
            </span>
          </div>

          {/* Desktop Nav - Clean Text Links */}
          <div className="hidden md:flex items-center gap-1 px-2">
            {["Features", "How it works", "Privacy"].map((item) => (
              <a
                key={item}
                href="#"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-full transition-all"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center pl-2">
            <button className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20">
              Download Beta
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile Menu Button - Circular */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-teal-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </motion.nav>
      </div>

      {/* Mobile Menu Overlay - Minimal & Clean */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 left-4 right-4 z-40 bg-white/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/20 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {["Features", "How it works", "Privacy"].map((item) => (
                <a
                  key={item}
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-4 text-lg font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-700 rounded-2xl transition-colors"
                >
                  {item}
                </a>
              ))}
              <div className="h-px bg-gray-100 my-2" />
              <button className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20">
                Download Beta <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
