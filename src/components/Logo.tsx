"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showText?: boolean;
  centered?: boolean;
}

export default function Logo({
  className = "",
  size = "md",
  showText = true,
  centered = false,
}: LogoProps) {
  // Dimensions for the circular medallion emblem
  const iconDimensions = {
    sm: "w-8 h-8",
    md: "w-11 h-11 sm:w-12 sm:h-12",
    lg: "w-20 h-20 sm:w-24 sm:h-24",
    xl: "w-32 h-32 sm:w-36 sm:h-36",
    hero: "w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64",
  }[size];

  const titleSize = {
    sm: "text-sm",
    md: "text-lg sm:text-xl",
    lg: "text-2xl sm:text-3xl",
    xl: "text-3xl sm:text-4xl",
    hero: "text-3xl sm:text-5xl md:text-6xl",
  }[size];

  const subtitleSize = {
    sm: "text-[9px]",
    md: "text-[10px] sm:text-[11px]",
    lg: "text-xs sm:text-sm",
    xl: "text-sm sm:text-base",
    hero: "text-xs sm:text-sm md:text-base",
  }[size];

  // If size is 'hero' (Middle of the website)
  if (size === "hero") {
    return (
      <div className={`flex flex-col items-center justify-center text-center group select-none ${className}`}>
        {/* Glowing ambient background */}
        <div className="relative animate-float-slow">
          <div className="absolute inset-0 bg-emerald-500/30 blur-3xl rounded-full scale-110 pointer-events-none animate-pulse-aura" />
          <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-95 pointer-events-none" />

          {/* Grand Circular Medallion Emblem */}
          <div
            className={`relative ${iconDimensions} rounded-full overflow-hidden border-2 border-amber-400/60 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_50px_rgba(16,185,129,0.35)] group-hover:scale-105 group-hover:border-amber-400 transition-all duration-500 bg-black`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand-logo.png"
              alt="Al Moman Frozen Foods Emblem"
              className="w-full h-full object-cover scale-100"
              width={256}
              height={256}
            />
          </div>
        </div>

        {/* Grand Typography below centerpiece logo */}
        {showText && (
          <div className="mt-6 flex flex-col items-center">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <h1 className={`font-black tracking-tight text-white ${titleSize} drop-shadow-lg`}>
                AL MOMAN
              </h1>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest bg-emerald-950/90 text-emerald-400 border border-emerald-600/60 px-2.5 sm:px-3 py-1 rounded-full shadow-lg">
                FROZEN FOODS
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="w-8 sm:w-12 h-px bg-gradient-to-r from-transparent to-amber-400/80" />
              <p className={`font-extrabold tracking-[0.25em] text-amber-400 uppercase ${subtitleSize}`}>
                100% HALAL • PREMIUM HOMEMADE QUALITY
              </p>
              <span className="w-8 sm:w-12 h-px bg-gradient-to-l from-transparent to-amber-400/80" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Header / Navbar & Footer Mode (Compact Horizontal)
  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 group select-none ${
        centered ? "flex-col justify-center text-center" : ""
      } ${className}`}
    >
      {/* Sleek Circular Emblem */}
      <div
        className={`relative ${iconDimensions} rounded-full overflow-hidden shrink-0 border border-amber-400/50 shadow-md shadow-emerald-950/40 group-hover:scale-105 group-hover:border-amber-400 transition-all duration-300 bg-black`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand-logo.png"
          alt="Al Moman Frozen Foods"
          className="w-full h-full object-cover"
          width={size === "sm" ? 32 : size === "lg" ? 96 : size === "xl" ? 144 : 48}
          height={size === "sm" ? 32 : size === "lg" ? 96 : size === "xl" ? 144 : 48}
        />
      </div>

      {/* Clean Brand Typography */}
      {showText && (
        <div className={`flex flex-col ${centered ? "items-center" : ""}`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`font-black tracking-tight text-white ${titleSize} group-hover:text-emerald-300 transition-colors whitespace-nowrap`}
            >
              AL MOMAN
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
              FROZEN
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`font-extrabold tracking-widest text-emerald-400 uppercase ${subtitleSize}`}
            >
              FOODS
            </span>
            <span className="text-zinc-600 text-[10px]">•</span>
            <span className="text-[10px] sm:text-xs text-amber-400/90 font-medium tracking-wide">
              100% HALAL
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
