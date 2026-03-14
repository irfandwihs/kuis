"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { User, GraduationCap, Check, Sparkles, RefreshCw } from "lucide-react";
import Avatar, { DICEBEAR_STYLES } from "./Avatar";

export default function StudentOnboardingModal() {
  const { userData, updateProfile } = useAuth();
  const [name, setName] = useState(userData?.displayName || "");
  const [studentClass, setStudentClass] = useState(userData?.studentClass || "");
  const [studentAbsen, setStudentAbsen] = useState(userData?.studentAbsen || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Character Creator State
  const [selectedStyle, setSelectedStyle] = useState(DICEBEAR_STYLES[0]);
  const [seed, setSeed] = useState(Math.random().toString(36).substring(7));

  // If profile is already completed and has absence number, don't show
  if (userData?.profileCompleted && userData?.studentAbsen) return null;

  const avatarString = `${selectedStyle}:${seed}`;

  const randomizeSeed = () => {
    setSeed(Math.random().toString(36).substring(7));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !studentClass || !studentAbsen) return;

    setIsSubmitting(true);
    try {
      await updateProfile({
        displayName: name,
        avatar: avatarString,
        studentClass: studentClass,
        studentAbsen: studentAbsen
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const classOptions = [
    "7A", "7B", "7C", "7D", "7E", "7F", "7G", "7H",
    "8A", "8B", "8C", "8D", "8E", "8F", "8G", "8H",
    "9A", "9B", "9C", "9D", "9E", "9F", "9G", "9H"
  ];

  const absenOptions = Array.from({ length: 32 }, (_, i) => (i + 1).toString());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row my-auto"
        >
          {/* Left Side: Preview */}
          <div className="bg-brand-navy p-6 md:p-10 md:w-2/5 flex flex-col items-center justify-center text-center relative shrink-0">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-4 left-4 rotate-12"><Sparkles className="w-8 h-8 text-white" /></div>
              <div className="absolute bottom-4 right-4 -rotate-12"><GraduationCap className="w-8 h-8 text-white" /></div>
            </div>
            
            <div className="relative mb-6 md:mb-8">
              <div className="absolute -inset-6 bg-brand-orange/20 rounded-full blur-3xl animate-pulse" />
              <Avatar avatarString={avatarString} size="xl" className="relative z-10 border-4 border-white shadow-2xl scale-90 md:scale-110" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">Avatar Builder</h2>
            <p className="text-white/60 text-xs md:text-sm font-medium mb-6">Buat karakter unikmu sendiri!</p>
            
            <button
              type="button"
              onClick={randomizeSeed}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-widest text-xs border border-white/10 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Acak Karakter
            </button>
          </div>

          {/* Right Side: Controls */}
          <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2 ml-1">
                    Nama Panggilan
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy/20" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Budi"
                      className="w-full pl-12 pr-4 py-4 bg-brand-cream/50 border-2 border-transparent rounded-2xl focus:border-brand-orange focus:bg-white outline-none text-brand-navy font-bold transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2 ml-1">
                    Kelas
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy/20" />
                    <select
                      required
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-brand-cream/50 border-2 border-transparent rounded-2xl focus:border-brand-orange focus:bg-white outline-none text-brand-navy font-bold transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Pilih Kelas</option>
                      {classOptions.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2 ml-1">
                    No Absen
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy/20" />
                    <select
                      required
                      value={studentAbsen}
                      onChange={(e) => setStudentAbsen(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-brand-cream/50 border-2 border-transparent rounded-2xl focus:border-brand-orange focus:bg-white outline-none text-brand-navy font-bold transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Pilih No Absen</option>
                      {absenOptions.map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Avatar Style Selection */}
              <div>
                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-4 ml-1">
                  Pilih Gaya Seni
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {DICEBEAR_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectedStyle(style)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all ${
                        selectedStyle === style 
                          ? "border-brand-orange shadow-lg shadow-brand-orange/20 scale-105 z-10" 
                          : "border-transparent bg-brand-cream/30 hover:border-brand-orange/30 hover:scale-105"
                      }`}
                    >
                      <Avatar 
                        avatarString={`${style}:preview`}
                        size="sm"
                        className="w-full h-full"
                      />
                      <div className={`absolute inset-0 bg-brand-orange/10 transition-opacity ${selectedStyle === style ? "opacity-100" : "opacity-0"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name || !studentClass}
                className="w-full bg-brand-navy text-white font-black text-lg py-5 rounded-3xl hover:bg-brand-black transition-all shadow-xl shadow-brand-navy/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    Selesai & Masuk!
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
