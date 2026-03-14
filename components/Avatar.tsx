"use client";

import { User } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

interface AvatarProps {
  avatarString?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const CAPYBARA_POSITIONS = [
  "0% 0%",
  "50% 0%",
  "100% 0%",
  "0% 50%",
  "50% 50%",
  "100% 50%",
  "0% 100%",
  "50% 100%",
  "100% 100%",
];

// ==========================================
// PENGATURAN DICEBEAR STYLES
// ==========================================
const DICEBEAR_STYLES = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "avataaars-neutral",
  "bottts",
  "bottts-neutral",
  "big-ears",
  "big-smile",
  "fun-emoji",
  "miniavs",
  "pixel-art",
  "open-peeps",
];

export default function Avatar({
  avatarString = "adventurer:seed",
  size = "md",
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [prevAvatarString, setPrevAvatarString] = useState(avatarString);

  // Reset image error if avatar string changes
  if (avatarString !== prevAvatarString) {
    setPrevAvatarString(avatarString);
    setImageError(false);
  }

  const safeAvatarString = avatarString || "adventurer:seed";

  // Logic: if string contains ':', it's "style:seed".
  // If it's just a number (old data), we map it to a default style.
  let style = "adventurer";
  let seed = safeAvatarString;

  if (safeAvatarString.includes(":")) {
    const parts = safeAvatarString.split(":");
    style = parts[0];
    seed = parts[1];
  } else {
    // Fallback for old numeric IDs
    const idx = parseInt(safeAvatarString, 10);
    if (!isNaN(idx)) {
      style = DICEBEAR_STYLES[idx % DICEBEAR_STYLES.length];
      seed = `user-${idx}`;
    }
  }

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-16 h-16",
  };

  const finalImageUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=ffdfbf,ffd5dc,d1d4f9,c0aede,b6e3f4`;

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl shadow-inner overflow-hidden bg-brand-cream/50 ${sizeClasses[size]} ${className}`}
    >
      {!imageError ? (
        <div className="w-full h-full relative z-10">
          <Image
            src={finalImageUrl}
            alt="Avatar"
            fill
            unoptimized
            className="object-cover transition-opacity duration-300"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-brand-navy/5 z-10">
          <User className={`${iconSizes[size]} text-brand-navy/20`} />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none z-20" />
    </div>
  );
}

export { DICEBEAR_STYLES };
