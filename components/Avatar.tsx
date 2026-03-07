"use client";

import { motion } from "motion/react";

interface AvatarProps {
  avatarString?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const CAPYBARA_POSITIONS = [
  "0% 0%", "50% 0%", "100% 0%",
  "0% 50%", "50% 50%", "100% 50%",
  "0% 100%", "50% 100%", "100% 100%"
];

export default function Avatar({ avatarString = "0", size = "md", className = "" }: AvatarProps) {
  const safeAvatarString = avatarString || "0";
  // If the old format (e.g. "0:0:0") is passed, fallback to 0
  const avatarIdx = safeAvatarString.includes(":") ? 0 : parseInt(safeAvatarString, 10);
  const position = CAPYBARA_POSITIONS[avatarIdx] || CAPYBARA_POSITIONS[0];
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32"
  };

  return (
    <div 
      className={`relative flex items-center justify-center rounded-2xl shadow-inner overflow-hidden bg-brand-cream/50 ${sizeClasses[size]} ${className}`}
    >
      <div 
        className="w-full h-full"
        style={{
          backgroundImage: "url('/capybara.png')",
          backgroundSize: "300% 300%",
          backgroundPosition: position,
          backgroundRepeat: "no-repeat"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none" />
    </div>
  );
}

export { CAPYBARA_POSITIONS };
