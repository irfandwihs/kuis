"use client";

import { motion } from "motion/react";
import { User } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [imageError, setImageError] = useState(false);
  const [lastAvatar, setLastAvatar] = useState(avatarString);

  if (lastAvatar !== avatarString) {
    setLastAvatar(avatarString);
    setImageError(false);
  }

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

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-16 h-16"
  };

  return (
    <div 
      className={`relative flex items-center justify-center rounded-2xl shadow-inner overflow-hidden bg-brand-cream/50 ${sizeClasses[size]} ${className}`}
    >
      {!imageError ? (
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: "url('/capybara.png')",
            backgroundSize: "300% 300%",
            backgroundPosition: position,
            backgroundRepeat: "no-repeat"
          }}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-brand-navy/5">
          <User className={`${iconSizes[size]} text-brand-navy/20`} />
        </div>
      )}
      
      {/* Hidden img tag to detect load error for backgroundImage */}
      <img 
        src="/capybara.png" 
        className="hidden" 
        onError={() => setImageError(true)} 
        alt=""
      />

      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none" />
    </div>
  );
}

export { CAPYBARA_POSITIONS };
