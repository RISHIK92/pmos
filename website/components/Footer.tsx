import React from "react";

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border/50 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <span className="font-bold text-xl text-text-primary tracking-tight">
            Dex
          </span>
        </div>

        <div className="flex gap-8 text-text-secondary text-sm font-medium">
          <a href="#" className="hover:text-primary transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Twitter
          </a>
        </div>

        <p className="text-text-secondary text-sm">
          © {new Date().getFullYear()} Dex OS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
