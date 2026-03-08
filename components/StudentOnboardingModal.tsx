"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { User, GraduationCap, Check, Sparkles } from "lucide-react";
import Avatar, { CAPYBARA_POSITIONS } from "./Avatar";

export default function StudentOnboardingModal() {
  const { userData, updateProfile } = useAuth();
  const [name, setName] = useState(userData?.displayName || "");
  const [studentClass, setStudentClass] = useState("");
  const [absenNumber, setAbsenNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Character Creator State
  const [avatarIdx, setAvatarIdx] = useState(0);

  // If profile is already completed, don't show
  if (userData?.profileCompleted) return null;

  const avatarString = avatarIdx.toString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !studentClass || !absenNumber) return;

    setIsSubmitting(true);
    try {
      await updateProfile({
        displayName: name,
        avatar: avatarString,
        studentClass: studentClass,
        absenNumber: parseInt(absenNumber, 10),
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row"
        >
          {/* Left Side: Preview */}
          <div className="bg-brand-navy p-8 md:w-2/5 flex flex-col items-center justify-center text-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-4 left-4 rotate-12">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-4 right-4 -rotate-12">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-brand-orange/20 rounded-full blur-2xl animate-pulse" />
              <Avatar
                avatarString={avatarString}
                size="xl"
                className="relative z-10 border-4 border-white shadow-2xl"
              />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              Pilih Avatarmu
            </h2>
            <p className="text-white/60 text-xs font-medium">
              Capybara mana yang paling menggambarkan dirimu hari ini?
            </p>
          </div>

          {/* Right Side: Controls */}
          <div className="flex-1 p-8 md:p-10 flex flex-col h-[80vh] md:h-auto overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
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
                      <option value="" disabled>
                        Pilih Kelas
                      </option>
                      {[
                        "7A",
                        "7B",
                        "7C",
                        "7D",
                        "7E",
                        "7F",
                        "7G",
                        "7H",
                        "8A",
                        "8B",
                        "8C",
                        "8D",
                        "8E",
                        "8F",
                        "8G",
                        "8H",
                        "9A",
                        "9B",
                        "9C",
                        "9D",
                        "9E",
                        "9F",
                        "9G",
                        "9H",
                      ].map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2 ml-1">
                    Nomor Absen
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={absenNumber}
                      onChange={(e) => setAbsenNumber(e.target.value)}
                      className="w-full px-4 py-4 bg-brand-cream/50 border-2 border-transparent rounded-2xl focus:border-brand-orange focus:bg-white outline-none text-brand-navy font-bold transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Pilih No. Absen
                      </option>
                      {Array.from({ length: 32 }, (_, i) => i + 1).map(
                        (num) => (
                          <option key={num} value={num.toString()}>
                            {num}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Avatar Grid Selection */}
              <div>
                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-4 ml-1">
                  Pilih Capybara
                </label>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  {CAPYBARA_POSITIONS.map((pos, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarIdx(idx)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all ${
                        avatarIdx === idx
                          ? "border-brand-orange shadow-lg shadow-brand-orange/20 scale-105 z-10"
                          : "border-transparent hover:border-brand-orange/30 hover:scale-105"
                      }`}
                    >
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: "url('/capybara.png')",
                          backgroundSize: "300% 300%",
                          backgroundPosition: pos,
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting || !name || !studentClass || !absenNumber
                }
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
