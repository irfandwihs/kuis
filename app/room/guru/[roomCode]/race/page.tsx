"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Flag, Trophy, Users, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import Avatar from "@/components/Avatar";

export default function RaceMode() {
  const { roomCode } = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

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

  if (!room) return <div className="p-8 text-center text-brand-navy/60 bg-brand-cream min-h-screen flex items-center justify-center font-black uppercase tracking-widest">Memuat Arena Balap...</div>;

  // Sort leaderboard by progress to determine current positions in the race
  const racers = [...leaderboard].sort((a, b) => {
    // First by progress
    const progressA = a.totalQuestions > 0 ? a.progress / a.totalQuestions : 0;
    const progressB = b.totalQuestions > 0 ? b.progress / b.totalQuestions : 0;
    if (progressB !== progressA) return progressB - progressA;
    // Then by score
    return b.score - a.score;
  });

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="bg-brand-navy border-b border-white/10 p-3 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 relative shadow-xl">
        <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
          <button 
            onClick={() => router.push(`/room/guru/${roomCode}`)}
            className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-black text-white tracking-tight flex items-center gap-2 truncate">
              <Flag className="w-5 h-5 md:w-6 md:h-6 text-brand-orange shrink-0" />
              MODE BALAPAN
            </h1>
            <p className="text-white/50 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Ruangan: {roomCode}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-center sm:justify-end">
          <div className="bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 border border-white/5">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
            <span className="text-white font-black text-xs md:text-sm whitespace-nowrap">{racers.length} Pembalap</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 border border-white/5">
            <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
            <span className="text-white font-black text-xs md:text-sm whitespace-nowrap">{racers.filter(r => r.status === "finished").length} Selesai</span>
          </div>
        </div>
      </div>

      {/* Race Track Area */}
      <div className="flex-1 overflow-y-auto relative bg-[#1a2332] p-3 md:p-8 custom-scrollbar">
        {/* Track Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(90deg, transparent 99%, #ffffff 100%)', backgroundSize: '10% 100%' }} />

        <div className="max-w-7xl mx-auto relative">
          <div className="space-y-2 md:space-y-3 relative z-10">
            {racers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/40 font-black uppercase tracking-widest text-sm">Menunggu pembalap bersiap...</p>
              </div>
            ) : (
              racers.map((racer, index) => {
                const progressPercent = racer.totalQuestions > 0 
                  ? (racer.progress / racer.totalQuestions) * 100 
                  : 0;
                
                // Cap at 100%
                const displayPercent = Math.min(100, Math.max(0, progressPercent));
                const isFinished = racer.status === "finished" || displayPercent === 100;

                return (
                  <div key={racer.id} className="relative h-16 md:h-20 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 overflow-hidden flex items-center group">
                    {/* Lane Number */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-black/40 flex items-center justify-center border-r border-white/10 z-20">
                      <span className="text-white/30 font-black text-[10px] md:text-sm">{index + 1}</span>
                    </div>

                    {/* Finish Line for this lane */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 z-0 flex flex-col opacity-80">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex-1 flex">
                          <div className={`flex-1 ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`}></div>
                          <div className={`flex-1 ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`}></div>
                        </div>
                      ))}
                    </div>

                    {/* Track Line */}
                    <div className="absolute left-10 md:left-14 right-10 md:right-14 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 border-t border-dashed border-white/20 z-0" />

                    {/* Racer Avatar & Info Container */}
                    <div className="absolute left-10 md:left-14 right-10 md:right-14 top-0 bottom-0 z-10">
                      <motion.div 
                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                        initial={{ left: "0%" }}
                        animate={{ left: `${displayPercent}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 15 }}
                        style={{ transform: displayPercent === 100 ? 'translateX(-100%)' : 'translateX(0)' }}
                      >
                        <div className="relative">
                          <div className={`transition-transform duration-300 ${isFinished ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {/* Use a smaller avatar for mobile, medium for desktop */}
                            <div className="hidden md:block">
                              <Avatar avatarString={racer.avatar} size="md" className={`border-2 ${isFinished ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-white/20'} bg-brand-navy`} />
                            </div>
                            <div className="block md:hidden">
                              <Avatar avatarString={racer.avatar} size="sm" className={`border-2 ${isFinished ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-white/20'} bg-brand-navy`} />
                            </div>
                            {racer.cheatCount > 0 && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full border border-white/20 shadow-[0_0_10px_rgba(239,68,68,0.5)]" title={`${racer.cheatCount} Pelanggaran: ${racer.lastCheatMessage}`}>
                                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                              </div>
                            )}
                          </div>
                          
                          {/* Name Tag */}
                          <div className="absolute -bottom-5 md:-bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded text-[7px] md:text-[10px] font-black text-white tracking-wider border border-white/10">
                            {racer.siswaName.split(' ')[0]} {racer.studentAbsen && `(${racer.studentAbsen})`}
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Score/Progress Info (Right side) */}
                    <div className="absolute right-10 md:right-16 top-1/2 -translate-y-1/2 z-20 text-right opacity-40 group-hover:opacity-100 transition-opacity bg-brand-navy/60 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg backdrop-blur-sm">
                      <div className="text-white font-black text-[10px] md:text-sm">{racer.score} XP</div>
                      <div className="text-white/50 text-[7px] md:text-[10px] uppercase tracking-widest font-bold">{racer.progress}/{racer.totalQuestions}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
