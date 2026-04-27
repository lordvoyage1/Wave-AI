import React from "react";
import { useNavigate } from "react-router-dom";
import AlvaIcon from "@/components/features/AlvaIcon";

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-[hsl(222,47%,4%)] px-4 py-8 mt-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <AlvaIcon size={32} />
            <div>
              <div className="font-heading font-bold text-sm synth-name">Wave AI</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Advanced Intelligence</div>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <button
              onClick={() => navigate("/about")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
            <button
              onClick={() => navigate("/api-docs")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              API Docs
            </button>
            <a
              href="https://voyagesoftwareinc.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Voyage Software Inc.
            </a>
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            &copy; {year} Voyage Software Inc. · Developed by Lord Voyage.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Alva Wave · All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
