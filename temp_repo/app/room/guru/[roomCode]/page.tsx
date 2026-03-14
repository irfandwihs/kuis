"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Play, Square, ArrowLeft, CheckCircle2, Circle, Clock, FileText, Download, X, Flag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Avatar from "@/components/Avatar";

export default function GuruRoom() {
  const { roomCode } = useParams();
  const { userData } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!roomCode) return;

    const q = query(collection(db, "rooms"), where("roomCode", "==", roomCode));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const roomData: any = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setRoom(roomData);
        
        // Fetch leaderboard
        const lbQuery = query(
          collection(db, "rooms", roomData.id, "leaderboard"),
          orderBy("score", "desc")
        );
        onSnapshot(lbQuery, (lbSnapshot) => {
          const lbData = lbSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setLeaderboard(lbData);
        });
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  const updateRoomStatus = async (status: string) => {
    if (!room?.id) return;
    await updateDoc(doc(db, "rooms", room.id), { status });
  };

  const downloadCSV = () => {
    if (leaderboard.length === 0) return;

    const headers = ["Peringkat", "Nama Siswa", "Kelas", "No Absen", "Skor (XP)", "Status"];
    const csvContent = [
      headers.join(","),
      ...leaderboard.map((entry, index) => {
        return [
          index + 1,
          `"${entry.siswaName}"`,
          `"${entry.studentClass || "-"}"`,
          `"${entry.studentAbsen || "-"}"`,
          entry.score,
          entry.status === "finished" ? "Selesai" : "Belum Selesai"
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Kuis_${roomCode}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!room) return <div className="p-8 text-center text-brand-navy/60 bg-brand-cream min-h-screen flex items-center justify-center">Memuat ruangan...</div>;

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center">
      <div className="w-full max-w-md md:max-w-2xl px-4 py-6 md:py-10">
        <button 
          onClick={() => router.push('/guru')}
          className="flex items-center gap-2 text-brand-navy/40 hover:text-brand-orange transition-colors mb-6 group font-black uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </button>

        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm text-center mb-6 border border-brand-navy/5">
          <h1 className="text-brand-navy/40 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Kode Ruangan</h1>
          <div className="text-5xl md:text-7xl font-mono font-black tracking-[0.2em] text-brand-navy mb-10">
            {roomCode}
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-4">
              {room.status === "waiting" && (
                <button 
                  onClick={() => updateRoomStatus("active")}
                  className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20 transition-all active:scale-95"
                >
                  <Play className="w-6 h-6 fill-current" /> Mulai Kuis
                </button>
              )}
              {room.status === "active" && (
                <button 
                  onClick={() => updateRoomStatus("finished")}
                  className="w-full bg-brand-navy text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-black shadow-lg shadow-brand-navy/20 transition-all active:scale-95"
                >
                  <Square className="w-6 h-6 fill-current" /> Akhiri Kuis
                </button>
              )}
              {room.status === "finished" && (
                <button 
                  onClick={() => setShowReport(true)}
                  className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <FileText className="w-6 h-6" /> Lihat Laporan
                </button>
              )}
            </div>
            
            {/* Race Mode Button */}
            <button 
              onClick={() => router.push(`/room/guru/${roomCode}/race`)}
              className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-sky-600 shadow-lg shadow-sky-500/20 transition-all active:scale-95"
            >
              <Flag className="w-5 h-5" /> Tampilkan Mode Balapan
            </button>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl md:text-2xl font-black text-brand-navy flex items-center gap-3 tracking-tight">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-brand-orange" />
              Monitoring Siswa ({leaderboard.length})
            </h2>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3" />
                {leaderboard.filter(s => s.status === "finished").length} Selesai
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange/10 text-brand-orange rounded-full text-[10px] font-black uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {leaderboard.filter(s => s.status === "playing").length} Aktif
              </div>
            </div>
          </div>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 bg-brand-cream/30 rounded-3xl border-2 border-dashed border-brand-navy/10">
              <Users className="w-10 h-10 md:w-12 md:h-12 text-brand-navy/20 mx-auto mb-4" />
              <p className="text-brand-navy/40 text-sm font-bold">Menunggu siswa bergabung...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((entry, idx) => {
                const progressPercent = entry.totalQuestions > 0 
                  ? (entry.progress / entry.totalQuestions) * 100 
                  : 0;

                return (
                  <div key={entry.id || idx} className="p-5 bg-brand-cream/30 rounded-3xl border border-brand-navy/5 hover:border-brand-orange/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar avatarString={entry.avatar} size="md" />
                          {entry.status === "finished" && (
                            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-black text-brand-navy text-base leading-none mb-1">{entry.siswaName}</h3>
                          <p className="text-[10px] text-brand-navy/40 font-black uppercase tracking-widest">
                            {entry.studentClass} • No Absen {entry.studentAbsen || "-"} • {entry.status === "finished" ? "Selesai" : `Sedang Mengerjakan Soal ke-${Math.min((entry.progress || 0) + 1, entry.totalQuestions || 1)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-brand-orange leading-none mb-1">{entry.score} <span className="text-[10px] uppercase tracking-widest text-brand-navy/40">XP</span></div>
                        <div className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest">
                          {entry.progress} / {entry.totalQuestions} Soal
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-brand-navy/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          className={`h-full transition-all duration-500 ${entry.status === "finished" ? "bg-emerald-500" : "bg-brand-orange"}`}
                        />
                      </div>
                      
                      {/* Detailed Question Dots */}
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: entry.totalQuestions }).map((_, qIdx) => (
                          <div 
                            key={qIdx}
                            className={`w-2 h-2 rounded-full ${qIdx < entry.progress ? (entry.status === "finished" ? "bg-emerald-500" : "bg-brand-orange") : "bg-brand-navy/10"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-in fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-brand-navy/5 flex items-center justify-between bg-brand-cream/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-brand-navy tracking-tight">Laporan Hasil Kuis</h2>
                    <p className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest">Ruangan: {roomCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={downloadCSV}
                    className="flex items-center gap-2 px-4 py-3 bg-brand-navy text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-black transition-all active:scale-95 shadow-lg shadow-brand-navy/20"
                  >
                    <Download className="w-4 h-4" />
                    Unduh CSV
                  </button>
                  <button 
                    onClick={() => setShowReport(false)}
                    className="p-3 bg-white rounded-2xl text-brand-navy/20 hover:text-red-500 transition-all shadow-sm"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-brand-cream/10">
                <div className="bg-white rounded-3xl border border-brand-navy/5 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-cream/50 border-b border-brand-navy/5">
                          <th className="p-4 text-[10px] font-black text-brand-navy/40 uppercase tracking-widest text-center">Peringkat</th>
                          <th className="p-4 text-[10px] font-black text-brand-navy/40 uppercase tracking-widest">Siswa</th>
                          <th className="p-4 text-[10px] font-black text-brand-navy/40 uppercase tracking-widest">Kelas</th>
                          <th className="p-4 text-[10px] font-black text-brand-navy/40 uppercase tracking-widest text-center">No Absen</th>
                          <th className="p-4 text-[10px] font-black text-brand-navy/40 uppercase tracking-widest text-right">Skor (XP)</th>
                          <th className="p-4 text-[10px] font-black text-brand-navy/40 uppercase tracking-widest text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-brand-navy/40 text-sm font-bold">Belum ada data siswa.</td>
                          </tr>
                        ) : (
                          leaderboard.map((entry, idx) => (
                            <tr key={entry.id || idx} className="border-b border-brand-navy/5 hover:bg-brand-cream/30 transition-colors">
                              <td className="p-4 text-center">
                                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${
                                  idx === 0 ? "bg-yellow-400 text-white" : 
                                  idx === 1 ? "bg-slate-300 text-white" : 
                                  idx === 2 ? "bg-amber-600 text-white" : 
                                  "bg-brand-navy/5 text-brand-navy/60"
                                }`}>
                                  {idx + 1}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar avatarString={entry.avatar} size="sm" />
                                  <span className="font-black text-brand-navy text-sm">{entry.siswaName}</span>
                                </div>
                              </td>
                              <td className="p-4 text-sm font-bold text-brand-navy/60">{entry.studentClass || "-"}</td>
                              <td className="p-4 text-sm font-bold text-brand-navy/60 text-center">{entry.studentAbsen || "-"}</td>
                              <td className="p-4 text-right font-black text-brand-orange">{entry.score}</td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  entry.status === "finished" ? "bg-emerald-50 text-emerald-600" : "bg-brand-orange/10 text-brand-orange"
                                }`}>
                                  {entry.status === "finished" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  {entry.status === "finished" ? "Selesai" : "Aktif"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
