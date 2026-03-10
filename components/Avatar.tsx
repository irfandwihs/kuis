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
// PENGATURAN URL AVATAR EKSTERNAL
// ==========================================
// Masukkan 9 URL gambar berbeda di sini (format .webp sangat disarankan).
// Pastikan urutannya sesuai dengan ekspresi yang diinginkan (0-8).
const AVATAR_IMAGES = [
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capy1.webp", // Normal
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capy2.webp", // Senang
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capy3.webp", // Kaget
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capy4.webp", // Cool
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capy5.webp", // Misterius
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capy6.webp", // Semangat
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capy7.webp", // Santai
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capy8.webp", // Fokus
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/capy9.webp", // Juara
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/cat1.webp",
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/cat2.webp",
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/cat3.webp",
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/cat4.webp",
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/cat5.webp",
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/cat6.webp",
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/cat7.webp",
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/cat8.webp",
  "https://raw.githubusercontent.com/irfandwihs/kuis/master/public/cat9.webp",
];

export default function Avatar({
  avatarString = "0",
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

  const safeAvatarString = avatarString || "0";
  const avatarIdx = safeAvatarString.includes(":")
    ? 0
    : parseInt(safeAvatarString, 10);

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

  // Gunakan gambar dari array jika tersedia dan tidak error
  const customImageUrl = AVATAR_IMAGES[avatarIdx];
  const isUsingCustomImage = customImageUrl && !imageError;

  const finalImageUrl = isUsingCustomImage
    ? customImageUrl
    : `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${safeAvatarString}&backgroundColor=ffdfbf`;

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

          {/* Preload all other images to prevent flickering when switching */}
          <div className="hidden">
            {AVATAR_IMAGES.map((url, i) => (
              <img key={i} src={url} alt="" referrerPolicy="no-referrer" />
            ))}
          </div>
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

export { AVATAR_IMAGES };
