"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Diamond } from "lucide-react";
import confetti from "canvas-confetti";

export default function AchievementNotification() {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const prevXpRef = useRef<number | undefined>(undefined);
  const prevDiamondsRef = useRef<number | undefined>(undefined);

  const addNotification = (notif: any) => {
    setNotifications(prev => [...prev, notif]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 5000);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.3 },
      colors: ['#FFD700', '#00FFFF', '#FF8C00'],
      zIndex: 10000
    });
  };

  useEffect(() => {
    if (!userData) return;

    const currentXp = userData.xp || 0;
    const currentDiamonds = userData.diamonds || 0;

    // Initialize refs if undefined
    if (prevXpRef.current === undefined) {
      prevXpRef.current = currentXp;
      prevDiamondsRef.current = currentDiamonds;
      return;
    }

    const prevXp = prevXpRef.current;
    const prevDiamonds = prevDiamondsRef.current;

    const prevLevel = Math.floor(prevXp / 100) + 1;
    const currentLevel = Math.floor(currentXp / 100) + 1;

    // Check Level Up
    if (currentLevel > prevLevel) {
      addNotification({
        id: Date.now() + Math.random(),
        type: "level_up",
        title: "Level Up!",
        message: `Luar biasa! Kamu mencapai Level ${currentLevel}!`,
        icon: <Trophy className="w-6 h-6 text-yellow-500" />
      });
      triggerConfetti();
    }

    // Check Diamond Milestones (e.g., every 50 diamonds collected)
    // We only want to trigger if diamonds INCREASED and crossed a milestone
    if (currentDiamonds > prevDiamonds) {
      const milestones = [50, 100, 200, 500, 1000, 2000, 5000];
      for (const milestone of milestones) {
        if (prevDiamonds < milestone && currentDiamonds >= milestone) {
          addNotification({
            id: Date.now() + Math.random(),
            type: "diamond_milestone",
            title: "Pencapaian Diamond!",
            message: `Hebat! Kamu telah mengumpulkan ${milestone} Diamonds!`,
            icon: <Diamond className="w-6 h-6 text-cyan-500" />
          });
          triggerConfetti();
          break; // Only trigger the highest milestone crossed
        }
      }
    }

    prevXpRef.current = currentXp;
    prevDiamondsRef.current = currentDiamonds;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.xp, userData?.diamonds]);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="bg-white border border-brand-navy/5 shadow-2xl shadow-brand-navy/10 rounded-2xl p-4 flex items-center gap-4 min-w-[300px] pointer-events-auto"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center shrink-0">
              {notif.icon}
            </div>
            <div>
              <h4 className="font-black text-brand-navy text-sm">{notif.title}</h4>
              <p className="text-brand-navy/60 text-xs font-medium">{notif.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
