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
  "0% 0%", "50% 0%", "100% 0%",
  "0% 50%", "50% 50%", "100% 50%",
  "0% 100%", "50% 100%", "100% 100%"
];

// ==========================================
// PENGATURAN URL AVATAR EKSTERNAL
// ==========================================
// 1. Unggah file capybara.png Anda ke GitHub.
// 2. Buka file tersebut di GitHub, klik tombol "Download" atau "Raw".
// 3. Salin URL-nya dan tempelkan di dalam tanda kutip di bawah ini.
// Contoh: const GITHUB_RAW_URL = "https://raw.githubusercontent.com/akun/repo/main/capybara.png";
const GITHUB_RAW_URL: string = "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capybara.png"; 

export default function Avatar({ avatarString = "0", size = "md", className = "" }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [prevAvatarString, setPrevAvatarString] = useState(avatarString);

  // Reset image error if avatar string changes
  if (avatarString !== prevAvatarString) {
    setPrevAvatarString(avatarString);
    setImageError(false);
  }

  const safeAvatarString = avatarString || "0";
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

  // Jika GITHUB_RAW_URL diisi, gunakan itu (mode spritesheet). 
  // Jika kosong, gunakan DiceBear API yang dijamin 100% muncul di semua perangkat.
  const isUsingSpritesheet = GITHUB_RAW_URL !== "";
  const finalImageUrl = isUsingSpritesheet 
    ? GITHUB_RAW_URL 
    : `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${safeAvatarString}&backgroundColor=ffdfbf`;

  return (
    <div 
      className={`relative flex items-center justify-center rounded-2xl shadow-inner overflow-hidden bg-brand-cream/50 ${sizeClasses[size]} ${className}`}
    >
      {!imageError ? (
        <>
          {isUsingSpritesheet ? (
            <>
              <div 
                className="w-full h-full absolute inset-0 z-10"
                style={{
                  backgroundImage: `url('${finalImageUrl}')`,
                  backgroundSize: "300% 300%",
                  backgroundPosition: position,
                  backgroundRepeat: "no-repeat"
                }}
              />
              {/* Hidden standard img tag to detect load error and force referrer policy */}
              <Image 
                src={finalImageUrl}
                alt=""
                width={1}
                height={1}
                unoptimized
                className="hidden"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className="w-full h-full relative z-10">
              <Image 
                src={finalImageUrl}
                alt="Avatar"
                fill
                unoptimized
                className="object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-brand-navy/5 z-10">
          <User className={`${iconSizes[size]} text-brand-navy/20`} />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none z-20" />
    </div>
  );
}

export { CAPYBARA_POSITIONS, GITHUB_RAW_URL };
