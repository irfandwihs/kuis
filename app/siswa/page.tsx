"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Play,
  Trophy,
  Star,
  Zap,
  History,
  Users,
  Diamond,
  ShoppingBag,
  Home,
  FileText,
  BookOpen,
  Eye,
  Link as LinkIcon,
  X,
  Settings,
  User,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  limit,
  getCountFromServer,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import StudentOnboardingModal from "@/components/StudentOnboardingModal";
import Avatar from "@/components/Avatar";
import { motion } from "motion/react";
import Shop from "@/components/Shop";

interface Material {
  id: string;
  guruId: string;
  subject: string;
  title: string;
  description: string;
  content?: string;
  points?: string[];
  fileUrl?: string;
  fileName?: string;
  order: number;
  createdAt: any;
}

export default function SiswaDashboard() {
  const { userData, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [rank, setRank] = useState<number | string>("-");
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const [mainTab, setMainTab] = useState<
    "beranda" | "kuis" | "tugas" | "materi" | "profil"
  >("beranda");
  const [berandaTab, setBerandaTab] = useState<
    "history" | "leaderboard" | "shop"
  >("history");

  // Profile Settings States
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (userData?.displayName) {
      setNewName(userData.displayName);
    }
  }, [userData?.displayName]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.uid) return;
      try {
        // 1. Fetch Global Leaderboard (All Siswa who have earned XP)
        const qLeaderboard = query(
          collection(db, "users"),
          where("role", "==", "Siswa"),
          where("xp", ">", 0),
          orderBy("xp", "desc")
        );
        const snapshotLeaderboard = await getDocs(qLeaderboard);
        const users = snapshotLeaderboard.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGlobalLeaderboard(users);

        // 2. Calculate Actual Global Rank (Siswa only)
        if (userData.xp === undefined || userData.xp === null) {
          setRank("-");
        } else {
          const qRank = query(
            collection(db, "users"),
            where("role", "==", "Siswa"),
            where("xp", ">", userData.xp),
          );
          const rankSnapshot = await getCountFromServer(qRank);
          const actualRank = rankSnapshot.data().count + 1;
          setRank(`#${actualRank}`);
        }

        // 3. Fetch Quiz History
        const qHistory = query(
          collection(db, "users", userData.uid, "history"),
          orderBy("completedAt", "desc"),
          limit(10),
        );
        const snapshotHistory = await getDocs(qHistory);
        const historyData = snapshotHistory.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuizHistory(historyData);
        // 4. Fetch Materials
        const qMaterials = query(
          collection(db, "materials"),
          orderBy("order", "asc"),
        );
        const snapshotMaterials = await getDocs(qMaterials);
        const materialsData = snapshotMaterials.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Material,
        );
        setMaterials(materialsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [userData?.uid, userData?.xp, userData?.quizzesPlayed]);

  const xp = userData?.xp || 0;
  const quizzesPlayed = userData?.quizzesPlayed || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpToNextLevel = 100 - (xp % 100);
  const progress = xp % 100;

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length === 6) {
      router.push(`/room/siswa/${roomCode}`);
    }
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center pb-24">
      <StudentOnboardingModal />
      <div className="w-full max-w-md md:max-w-2xl px-4 py-6 md:py-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-6 rounded-[32px] shadow-sm gap-4 border border-brand-navy/5">
          <div className="flex items-center gap-4">
            <Avatar
              avatarString={userData.avatar}
              size="lg"
              className="border-4 border-white shadow-xl"
            />
            <div>
              <h1 className="text-xl font-black text-brand-navy tracking-tight">
                {userData.displayName}
              </h1>
              <p className="text-brand-navy/60 text-xs font-bold uppercase tracking-wider">
                Level {level} • {userData.studentClass || "Siswa"}{" "}
                {userData.studentAbsen
                  ? `• No Absen ${userData.studentAbsen}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="flex-1 md:w-48">
              <div className="flex justify-between text-[10px] font-black text-brand-navy/40 mb-1 uppercase tracking-widest">
                <span>XP: {xp}</span>
                <span>Next: {xpToNextLevel}</span>
              </div>
              <div className="h-2 bg-brand-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-orange transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-brand-navy/40 hover:text-brand-orange transition-colors"
              title="Keluar"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </header>

        {mainTab === "beranda" && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-brand-navy/5 flex flex-col items-center text-center group hover:border-brand-orange transition-all">
              <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-xl mb-2 group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-brand-navy/40 font-black uppercase tracking-widest mb-1">
                Peringkat
              </div>
              <div className="text-lg font-black text-brand-navy">{rank}</div>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-brand-navy/5 flex flex-col items-center text-center group hover:border-brand-orange transition-all">
              <div className="p-2 bg-brand-navy/10 text-brand-navy rounded-xl mb-2 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-brand-navy/40 font-black uppercase tracking-widest mb-1">
                Total XP
              </div>
              <div className="text-lg font-black text-brand-navy">{xp}</div>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-brand-navy/5 flex flex-col items-center text-center">
              <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-xl mb-2">
                <Star className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-brand-navy/40 font-black uppercase tracking-widest mb-1">
                Quiz
              </div>
              <div className="text-lg font-black text-brand-navy">
                {quizzesPlayed}
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-brand-navy/5 flex flex-col items-center text-center">
              <div className="p-2 bg-sky-100 text-sky-500 rounded-xl mb-2">
                <Diamond className="w-5 h-5 fill-current" />
              </div>
              <div className="text-[10px] text-brand-navy/40 font-black uppercase tracking-widest mb-1">
                Diamond
              </div>
              <div className="text-lg font-black text-brand-navy">
                {userData.diamonds || 0}
              </div>
            </div>
          </div>
        )}

        {mainTab === "beranda" && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
              <button
                onClick={() => setBerandaTab("history")}
                className={`flex-1 min-w-[80px] py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${berandaTab === "history" ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" : "bg-white text-brand-navy/40 hover:bg-brand-navy/5"}`}
              >
                Riwayat
              </button>
              <button
                onClick={() => setBerandaTab("leaderboard")}
                className={`flex-1 min-w-[80px] py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${berandaTab === "leaderboard" ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" : "bg-white text-brand-navy/40 hover:bg-brand-navy/5"}`}
              >
                Global
              </button>
              <button
                onClick={() => setBerandaTab("shop")}
                className={`flex-1 min-w-[80px] py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${berandaTab === "shop" ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" : "bg-white text-brand-navy/40 hover:bg-brand-navy/5"}`}
              >
                Toko
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              {berandaTab === "history" && (
                <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-xl shadow-brand-navy/5 w-full border border-brand-navy/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <History className="w-6 h-6 text-brand-orange" />
                    <h2 className="text-xl font-black text-brand-navy tracking-tight">
                      Riwayat Kuis
                    </h2>
                  </div>

                  {quizHistory.length === 0 ? (
                    <div className="text-center py-12 bg-brand-cream/30 rounded-3xl border-2 border-dashed border-brand-navy/5">
                      <p className="text-brand-navy/40 font-bold text-sm">
                        Belum ada riwayat kuis.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quizHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-brand-cream/50 rounded-2xl border border-transparent hover:border-brand-orange/20 transition-all flex justify-between items-center"
                        >
                          <div>
                            <h3 className="font-black text-brand-navy text-sm mb-1">
                              {item.quizTitle}
                            </h3>
                            <p className="text-[10px] text-brand-navy/40 font-black uppercase tracking-widest">
                              {item.completedAt
                                ?.toDate()
                                .toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}{" "}
                              • Room: {item.roomCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-brand-orange">
                              +{item.score}
                            </div>
                            <div className="text-[8px] text-brand-navy/40 font-black uppercase tracking-widest">
                              XP
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {berandaTab === "shop" && (
                <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-xl shadow-brand-navy/5 w-full border border-brand-navy/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <Shop />
                </div>
              )}

              {berandaTab === "leaderboard" && (
                <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-xl shadow-brand-navy/5 w-full border border-brand-navy/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-brand-orange" />
                      <h2 className="text-xl font-black text-brand-navy tracking-tight">
                        Peringkat Global
                      </h2>
                    </div>
                    <div className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest">
                      Peringkatmu:{" "}
                      <span className="text-brand-orange">{rank}</span>
                    </div>
                  </div>

                  {/* Podium Section */}
                  {globalLeaderboard.length > 0 && (
                    <div className="flex items-end justify-center gap-2 mb-10 mt-4 h-48">
                      {/* 2nd Place */}
                      <div className="flex flex-col items-center flex-1 max-w-[100px]">
                        {globalLeaderboard[1] ? (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center"
                          >
                            <Avatar
                              avatarString={globalLeaderboard[1].avatar}
                              size="md"
                              className="mb-2 border-2 border-slate-300"
                            />
                            <div className="text-[10px] font-black text-brand-navy truncate w-full text-center mb-1">
                              {globalLeaderboard[1].displayName}
                            </div>
                            <div className="w-full bg-slate-300 h-20 rounded-t-2xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl font-black text-white">
                                2
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="w-full bg-brand-cream/50 h-16 rounded-t-2xl border-x border-t border-brand-navy/5" />
                        )}
                      </div>

                      {/* 1st Place */}
                      <div className="flex flex-col items-center flex-1 max-w-[120px]">
                        {globalLeaderboard[0] ? (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <Trophy className="w-6 h-6 text-yellow-400 mb-1 animate-bounce" />
                            <Avatar
                              avatarString={globalLeaderboard[0].avatar}
                              size="lg"
                              className="mb-2 border-4 border-yellow-400 shadow-xl"
                            />
                            <div className="text-xs font-black text-brand-navy truncate w-full text-center mb-1">
                              {globalLeaderboard[0].displayName}
                            </div>
                            <div className="w-full bg-yellow-400 h-32 rounded-t-2xl flex items-center justify-center shadow-xl relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                              <span className="text-4xl font-black text-white relative z-10">
                                1
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="w-full bg-brand-cream/50 h-24 rounded-t-2xl border-x border-t border-brand-navy/5" />
                        )}
                      </div>

                      {/* 3rd Place */}
                      <div className="flex flex-col items-center flex-1 max-w-[100px]">
                        {globalLeaderboard[2] ? (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col items-center"
                          >
                            <Avatar
                              avatarString={globalLeaderboard[2].avatar}
                              size="md"
                              className="mb-2 border-2 border-amber-600"
                            />
                            <div className="text-[10px] font-black text-brand-navy truncate w-full text-center mb-1">
                              {globalLeaderboard[2].displayName}
                            </div>
                            <div className="w-full bg-amber-600 h-16 rounded-t-2xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl font-black text-white">
                                3
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="w-full bg-brand-cream/50 h-12 rounded-t-2xl border-x border-t border-brand-navy/5" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {globalLeaderboard.length === 0 ? (
                      <div className="text-center py-12 bg-brand-cream/30 rounded-3xl border-2 border-dashed border-brand-navy/10">
                        <Trophy className="w-10 h-10 text-brand-navy/20 mx-auto mb-4" />
                        <p className="text-brand-navy/40 text-sm font-bold">
                          Belum ada siswa yang mengerjakan kuis.
                        </p>
                      </div>
                    ) : (
                      globalLeaderboard.map((user, idx) => (
                        <div
                          key={user.id}
                          className={`p-4 rounded-2xl flex justify-between items-center transition-all ${user.id === userData.uid ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20 scale-[1.02]" : "bg-brand-cream/50 border border-transparent"}`}
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-xs ${idx === 0 ? "bg-yellow-400 text-white" : idx === 1 ? "bg-slate-300 text-white" : idx === 2 ? "bg-amber-600 text-white" : "bg-brand-navy/5 text-brand-navy/40"}`}
                            >
                              {idx + 1}
                            </span>
                            <Avatar
                              avatarString={user.avatar}
                              size="md"
                              className="shadow-sm"
                            />
                            <div>
                              <h3
                                className={`font-black text-sm ${user.id === userData.uid ? "text-white" : "text-brand-navy"}`}
                              >
                                {user.displayName}
                              </h3>
                              <p
                                className={`text-[10px] font-black uppercase tracking-widest ${user.id === userData.uid ? "text-white/60" : "text-brand-navy/40"}`}
                              >
                                {user.studentClass || "Siswa"} • Level{" "}
                                {Math.floor((user.xp || 0) / 100) + 1}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-lg font-black ${user.id === userData.uid ? "text-white" : "text-brand-navy"}`}
                            >
                              {user.xp || 0}
                            </div>
                            <div
                              className={`text-[8px] font-black uppercase tracking-widest ${user.id === userData.uid ? "text-white/40" : "text-brand-navy/40"}`}
                            >
                              Total XP
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {mainTab === "kuis" && (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl shadow-brand-navy/5 w-full text-center border border-brand-navy/5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-brand-navy text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-navy/20 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                <Play className="w-10 h-10 ml-1" />
              </div>
              <h2 className="text-2xl font-black text-brand-navy mb-2 tracking-tight">
                Gabung Kuis
              </h2>
              <p className="text-brand-navy/60 text-sm mb-8 leading-relaxed font-medium">
                Masukkan 6 digit kode ruangan yang diberikan oleh guru Anda
                untuk memulai petualangan!
              </p>

              <form onSubmit={joinRoom} className="space-y-6">
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="000000"
                  className="w-full text-center text-4xl md:text-5xl font-mono tracking-[0.4em] p-5 md:p-6 bg-brand-cream/50 border-2 border-transparent rounded-3xl focus:border-brand-orange focus:bg-white focus:ring-8 focus:ring-brand-orange/5 outline-none transition-all uppercase placeholder:text-brand-navy/20 text-brand-navy"
                />
                <button
                  type="submit"
                  disabled={roomCode.length !== 6}
                  className="w-full bg-brand-navy text-white font-black text-lg py-5 rounded-3xl hover:bg-brand-black hover:shadow-xl hover:shadow-brand-navy/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  Masuk Ruangan
                </button>
              </form>
            </div>
          </div>
        )}

        {mainTab === "tugas" && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-brand-cream/50 text-brand-navy/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-brand-navy mb-2 tracking-tight">
              Tugas
            </h2>
            <p className="text-brand-navy/60 text-sm font-medium">
              Belum ada tugas yang diberikan.
            </p>
          </div>
        )}

        {mainTab === "profil" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
              <div className="flex items-center gap-3 mb-8">
                <Settings className="w-6 h-6 text-brand-orange" />
                <h2 className="text-xl font-black text-brand-navy tracking-tight">
                  Pengaturan Profil
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    <Avatar
                      avatarString={userData.avatar}
                      size="xl"
                      className="border-4 border-white shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] font-black text-brand-navy/40 uppercase tracking-widest">
                    Ganti avatar di Toko
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2 ml-1">
                      Nama Lengkap
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nama kamu..."
                        className="flex-1 p-4 bg-brand-cream/50 border-2 border-transparent rounded-2xl focus:border-brand-orange outline-none font-bold text-brand-navy transition-all"
                      />
                      <button
                        onClick={async () => {
                          if (!newName.trim() || isSaving) return;
                          setIsSaving(true);
                          try {
                            await updateProfile({ displayName: newName });
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 3000);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving || newName === userData.displayName}
                        className="bg-brand-navy text-white px-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-black transition-all disabled:opacity-50"
                      >
                        {isSaving ? "..." : "Simpan"}
                      </button>
                    </div>
                    {showSuccess && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Nama berhasil
                        diperbarui!
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2 ml-1">
                      Ekspresi
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "0" },
                        { id: "1" },
                        { id: "2" },
                        { id: "3" },
                        { id: "4" },
                        { id: "5" },
                        { id: "6" },
                        { id: "7" },
                        { id: "8" },
                        { id: "9" },
                        { id: "10" },
                        { id: "11" },
                        { id: "12" },
                        { id: "13" },
                        { id: "14" },
                        { id: "15" },
                        { id: "16" },
                        { id: "17" },
                      ].map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => updateProfile({ avatar: exp.id })}
                          className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                            userData.avatar === exp.id
                              ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                              : "border-brand-navy/5 bg-brand-cream/30 text-brand-navy/40 hover:border-brand-orange/30"
                          }`}
                        >
                          <Avatar avatarString={exp.id} size="sm" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-brand-cream/30 rounded-2xl border border-brand-navy/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest">
                        Informasi Akun
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-brand-navy/40">Email</span>
                        <span className="text-brand-navy">
                          {userData.email}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-brand-navy/40">Kelas</span>
                        <span className="text-brand-navy">
                          {userData.studentClass || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-brand-navy/40">No Absen</span>
                        <span className="text-brand-navy">
                          {userData.studentAbsen || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-brand-orange" />
                <h2 className="text-xl font-black text-brand-navy tracking-tight">Saran Avatar Menarik</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-brand-cream/30 rounded-3xl border border-brand-navy/5">
                  <h3 className="text-xs font-black text-brand-navy uppercase tracking-widest mb-2">1. Aksesoris Unik</h3>
                  <p className="text-xs text-brand-navy/60 leading-relaxed">
                    Tambahkan kacamata keren, topi petualang, atau mahkota emas untuk menunjukkan statusmu sebagai juara kuis!
                  </p>
                </div>
                <div className="p-4 bg-brand-cream/30 rounded-3xl border border-brand-navy/5">
                  <h3 className="text-xs font-black text-brand-navy uppercase tracking-widest mb-2">2. Latar Belakang</h3>
                  <p className="text-xs text-brand-navy/60 leading-relaxed">
                    Gunakan warna gradasi yang mencolok atau pola geometris di belakang avatarmu agar lebih menonjol di papan peringkat.
                  </p>
                </div>
                <div className="p-4 bg-brand-cream/30 rounded-3xl border border-brand-navy/5">
                  <h3 className="text-xs font-black text-brand-navy uppercase tracking-widest mb-2">3. Efek Partikel</h3>
                  <p className="text-xs text-brand-navy/60 leading-relaxed">
                    Beri efek aura bersinar, percikan api, atau bintang-bintang kecil di sekitar avatarmu untuk kesan magis.
                  </p>
                </div>
                <div className="p-4 bg-brand-cream/30 rounded-3xl border border-brand-navy/5">
                  <h3 className="text-xs font-black text-brand-navy uppercase tracking-widest mb-2">4. Ekspresi Wajah</h3>
                  <p className="text-xs text-brand-navy/60 leading-relaxed">
                    Pilih ekspresi yang sesuai dengan kepribadianmu: semangat, tenang, atau penuh misteri!
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-brand-navy text-white rounded-3xl text-center">
                <p className="text-sm font-bold mb-4">Ingin fitur kustomisasi avatar yang lebih lengkap?</p>
                <button 
                  onClick={() => setMainTab("beranda")}
                  className="bg-brand-orange text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
                >
                  Kunjungi Toko Sekarang
                </button>
              </div>
            </section> */}
          </div>
        )}

        {mainTab === "materi" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-black text-brand-navy flex items-center gap-3 tracking-tight">
                  <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-brand-orange" />
                  Materi Pembelajaran
                </h2>
              </div>

              {materials.length === 0 ? (
                <div className="text-center py-12 md:py-16 bg-brand-cream/30 rounded-[32px] border-2 border-dashed border-brand-navy/10">
                  <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-brand-navy/20 mx-auto mb-4" />
                  <p className="text-brand-navy/40 text-sm font-bold">
                    Belum ada materi yang tersedia.
                  </p>
                </div>
              ) : (
                <div className="relative py-10">
                  {/* Duolingo-like path line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-brand-cream -translate-x-1/2 rounded-full hidden md:block" />

                  <div className="space-y-12 relative z-10">
                    {materials.map((mat, idx) => {
                      // Zig-zag logic
                      const positions = [
                        "md:-translate-x-24",
                        "md:translate-x-24",
                        "md:translate-x-0",
                      ];
                      const posClass = positions[idx % 3];

                      return (
                        <div
                          key={mat.id}
                          className={`flex flex-col items-center transition-all ${posClass}`}
                        >
                          <div className="relative group">
                            <button
                              onClick={() => setViewingMaterial(mat)}
                              className="w-20 h-20 md:w-24 md:h-24 rounded-[32px] bg-white border-4 border-brand-cream flex items-center justify-center shadow-xl hover:scale-110 hover:border-brand-orange transition-all relative z-20 group"
                            >
                              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-brand-navy flex items-center justify-center text-white font-black text-xl md:text-2xl group-hover:bg-brand-orange transition-colors">
                                {idx + 1}
                              </div>

                              {/* Tooltip-like label */}
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-brand-navy text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                                {mat.title}
                              </div>
                            </button>

                            {mat.fileUrl && (
                              <a
                                href={mat.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 bg-white text-brand-navy rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-brand-orange"
                                title="Buka File Eksternal"
                              >
                                <LinkIcon className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          <div className="mt-4 text-center max-w-[200px]">
                            <h3 className="font-black text-brand-navy text-sm mb-1 truncate">
                              {mat.title}
                            </h3>
                            <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                              {mat.subject}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* View Material Modal */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-brand-navy/5 flex justify-between items-center bg-brand-cream/30">
              <div>
                <span className="inline-block px-2 py-1 bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase tracking-widest rounded-md mb-2">
                  {viewingMaterial.subject}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-brand-navy tracking-tight">
                  {viewingMaterial.title}
                </h2>
              </div>
              <button
                onClick={() => setViewingMaterial(null)}
                className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors text-brand-navy/40 hover:text-brand-navy"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {viewingMaterial.points && viewingMaterial.points.length > 0 ? (
                <div className="space-y-8 relative py-4">
                  <div className="absolute left-6 top-0 bottom-0 w-1 bg-brand-cream rounded-full" />
                  {viewingMaterial.points.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex gap-6 relative z-10 animate-in slide-in-from-left duration-500"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-black text-lg shadow-lg shadow-brand-navy/20 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 p-6 bg-brand-cream/30 rounded-3xl border border-brand-navy/5 font-medium text-brand-navy leading-relaxed">
                        {point}
                      </div>
                    </div>
                  ))}
                </div>
              ) : viewingMaterial.content ? (
                <div className="prose prose-sm md:prose-base max-w-none text-brand-navy/80 whitespace-pre-wrap">
                  {viewingMaterial.content}
                </div>
              ) : viewingMaterial.fileUrl ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-16 h-16 text-brand-orange mb-4" />
                  <p className="text-brand-navy font-bold mb-6">
                    Materi ini berupa file dokumen.
                  </p>
                  <a
                    href={viewingMaterial.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-navy text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-brand-black transition-colors"
                  >
                    Buka File {viewingMaterial.fileName}
                  </a>
                </div>
              ) : (
                <p className="text-center text-brand-navy/40">
                  Konten tidak tersedia.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-navy/10 flex justify-around items-center p-4 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl">
        <button
          onClick={() => setMainTab("beranda")}
          className={`flex flex-col items-center gap-1 transition-colors ${mainTab === "beranda" ? "text-brand-orange" : "text-brand-navy/40 hover:text-brand-navy/60"}`}
        >
          <Home
            className={`w-6 h-6 ${mainTab === "beranda" ? "fill-current" : ""}`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Beranda
          </span>
        </button>
        <button
          onClick={() => setMainTab("kuis")}
          className={`flex flex-col items-center gap-1 transition-colors ${mainTab === "kuis" ? "text-brand-orange" : "text-brand-navy/40 hover:text-brand-navy/60"}`}
        >
          <Play
            className={`w-6 h-6 ${mainTab === "kuis" ? "fill-current" : ""}`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Kuis
          </span>
        </button>
        <button
          onClick={() => setMainTab("tugas")}
          className={`flex flex-col items-center gap-1 transition-colors ${mainTab === "tugas" ? "text-brand-orange" : "text-brand-navy/40 hover:text-brand-navy/60"}`}
        >
          <FileText
            className={`w-6 h-6 ${mainTab === "tugas" ? "fill-current" : ""}`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Tugas
          </span>
        </button>
        <button
          onClick={() => setMainTab("materi")}
          className={`flex flex-col items-center gap-1 transition-colors ${mainTab === "materi" ? "text-brand-orange" : "text-brand-navy/40 hover:text-brand-navy/60"}`}
        >
          <BookOpen
            className={`w-6 h-6 ${mainTab === "materi" ? "fill-current" : ""}`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Materi
          </span>
        </button>
        <button
          onClick={() => setMainTab("profil")}
          className={`flex flex-col items-center gap-1 transition-colors ${mainTab === "profil" ? "text-brand-orange" : "text-brand-navy/40 hover:text-brand-navy/60"}`}
        >
          <User
            className={`w-6 h-6 ${mainTab === "profil" ? "fill-current" : ""}`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Profil
          </span>
        </button>
      </nav>
    </div>
  );
}
