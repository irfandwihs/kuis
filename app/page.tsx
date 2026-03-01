"use client";

import { useAuth } from "@/contexts/AuthContext";
import { FlaskConical, GraduationCap, Pencil, Star, Cloud, Bell, HelpCircle, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

export default function Home() {
  const { signInWithGoogle, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#162431] text-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#E67E22] border-t-transparent rounded-full mb-4"
        />
        <p className="text-white/60 font-bold tracking-widest uppercase text-xs animate-pulse">Memuat Petualangan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#162431] flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background Image from Attachment */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/home-bg.png" 
          alt="Background"
          fill
          className="object-cover opacity-60"
          priority
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#162431]/40 via-transparent to-[#162431]/80" />
      </div>

      {/* Container for the "Phone" view on desktop, full screen on mobile */}
      <div className="w-full max-w-[500px] h-full min-h-screen flex flex-col items-center justify-between relative z-10">
        {/* Top Section: Logo (Kept as requested) */}
        <div className="pt-12 md:pt-16 z-10 flex flex-col items-center">
          <h1 className="text-6xl md:text-7xl font-black tracking-tight text-white leading-none drop-shadow-2xl">
            STUDY
          </h1>
          <div className="flex items-center gap-2 mt-[-10px]">
            <div className="relative">
              <FlaskConical className="w-12 h-12 md:w-16 md:h-16 text-[#E67E22] fill-[#E67E22]/20 drop-shadow-lg" />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-4 bg-[#E67E22] rounded-sm opacity-60 blur-[2px]" />
            </div>
            <span className="text-6xl md:text-7xl font-black tracking-tight text-[#E67E22] drop-shadow-2xl">LAB</span>
          </div>
        </div>

        {/* Middle Section: Empty (Background image provides the illustration) */}
        <div className="flex-1" />

        {/* Bottom Section: White Panel */}
        <div className="w-full bg-white/95 backdrop-blur-sm rounded-t-[40px] md:rounded-t-[50px] pt-8 pb-8 md:pt-12 md:pb-10 px-8 md:px-10 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
          <button
            onClick={signInWithGoogle}
            className="w-full bg-[#ff6b00] text-white font-black text-xl md:text-2xl py-5 md:py-6 rounded-full shadow-xl shadow-[#ff6b00]/30 active:scale-95 transition-all hover:brightness-110"
          >
            Masuk
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
