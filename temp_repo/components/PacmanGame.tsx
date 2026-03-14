"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Avatar from "./Avatar";
import { Ghost as GhostIcon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface PacmanGameProps {
  question: any;
  onAnswer: (index: number) => void;
  avatarString: string;
  feedback: "correct" | "incorrect" | null;
}

const GRID_SIZE = 15;
const CELL_SIZE = 30; // pixels

// 0: Empty, 1: Wall, 2: Answer A, 3: Answer B, 4: Answer C, 5: Answer D
const INITIAL_MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 3, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1],
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // Tunnel row
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 4, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 5, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export default function PacmanGame({ question, onAnswer, avatarString, feedback }: PacmanGameProps) {
  const [playerPos, setPlayerPos] = useState({ x: 7, y: 11 });
  const [ghosts, setGhosts] = useState([
    { x: 1, y: 1, color: "text-red-500" },
    { x: 13, y: 1, color: "text-pink-500" },
    { x: 1, y: 13, color: "text-cyan-500" },
    { x: 13, y: 13, color: "text-orange-500" },
  ]);
  const [direction, setDirection] = useState<{ x: number, y: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const movePlayer = useCallback((dir: { x: number, y: number }) => {
    if (gameOver || feedback) return;

    setPlayerPos((prev) => {
      let newX = prev.x + dir.x;
      let newY = prev.y + dir.y;

      // Tunnel logic
      if (newY === 7) {
        if (newX < 0) newX = GRID_SIZE - 1;
        if (newX >= GRID_SIZE) newX = 0;
      }

      if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && INITIAL_MAZE[newY][newX] !== 1) {
        const cellValue = INITIAL_MAZE[newY][newX];
        if (cellValue >= 2 && cellValue <= 5) {
          onAnswer(cellValue - 2);
        }
        return { x: newX, y: newY };
      }
      return prev;
    });
  }, [gameOver, feedback, onAnswer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": setDirection({ x: 0, y: -1 }); break;
        case "ArrowDown": setDirection({ x: 0, y: 1 }); break;
        case "ArrowLeft": setDirection({ x: -1, y: 0 }); break;
        case "ArrowRight": setDirection({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (gameOver || feedback) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    gameLoopRef.current = setInterval(() => {
      // Move Player
      if (direction) {
        movePlayer(direction);
      }

      // Move Ghosts
      setGhosts((prevGhosts) => {
        return prevGhosts.map((ghost) => {
          const possibleMoves = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
          ].filter(m => {
            const nx = ghost.x + m.x;
            const ny = ghost.y + m.y;
            return nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && INITIAL_MAZE[ny][nx] !== 1;
          });

          if (possibleMoves.length === 0) return ghost;

          // Simple AI: Move towards player
          const bestMove = possibleMoves.reduce((best, current) => {
            const distBest = Math.abs(ghost.x + best.x - playerPos.x) + Math.abs(ghost.y + best.y - playerPos.y);
            const distCurrent = Math.abs(ghost.x + current.x - playerPos.x) + Math.abs(ghost.y + current.y - playerPos.y);
            return distCurrent < distBest ? current : best;
          }, possibleMoves[0]);

          // Randomize a bit to make it less perfect
          const finalMove = Math.random() > 0.7 ? possibleMoves[Math.floor(Math.random() * possibleMoves.length)] : bestMove;

          const newX = ghost.x + finalMove.x;
          const newY = ghost.y + finalMove.y;

          // Check collision with player
          if (newX === playerPos.x && newY === playerPos.y) {
            setGameOver(true);
            onAnswer(-1); // Trigger incorrect
          }

          return { ...ghost, x: newX, y: newY };
        });
      });
    }, 250);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [direction, playerPos, gameOver, feedback, movePlayer, onAnswer]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div 
        className="relative bg-brand-navy rounded-2xl border-4 border-brand-navy shadow-2xl overflow-hidden"
        style={{ 
          width: GRID_SIZE * CELL_SIZE, 
          height: GRID_SIZE * CELL_SIZE,
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {INITIAL_MAZE.map((row, y) => 
          row.map((cell, x) => (
            <div 
              key={`${x}-${y}`} 
              className={`w-full h-full flex items-center justify-center ${cell === 1 ? "bg-blue-900/50 border border-blue-500/20" : ""}`}
            >
              {cell >= 2 && cell <= 5 && (
                <div className="relative group">
                  <div className="w-6 h-6 bg-brand-orange rounded-full animate-pulse flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-brand-orange/50">
                    {String.fromCharCode(63 + cell)}
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-brand-navy px-2 py-1 rounded-lg text-[8px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                    {question.options[cell - 2]}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Player */}
        <motion.div
          animate={{ x: playerPos.x * CELL_SIZE, y: playerPos.y * CELL_SIZE }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute z-20"
          style={{ width: CELL_SIZE, height: CELL_SIZE, padding: 2 }}
        >
          <Avatar avatarString={avatarString} size="sm" className="w-full h-full border-2 border-white shadow-lg" />
        </motion.div>

        {/* Ghosts */}
        {ghosts.map((ghost, idx) => (
          <motion.div
            key={idx}
            animate={{ x: ghost.x * CELL_SIZE, y: ghost.y * CELL_SIZE }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="absolute z-10 flex items-center justify-center"
            style={{ width: CELL_SIZE, height: CELL_SIZE }}
          >
            <GhostIcon className={`w-6 h-6 ${ghost.color} fill-current animate-bounce`} />
          </motion.div>
        ))}

        {/* Feedback Overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${feedback === "correct" ? "bg-emerald-500/20" : "bg-red-500/20"}`}
            >
              <div className={`text-4xl font-black uppercase tracking-widest ${feedback === "correct" ? "text-emerald-500" : "text-red-500"}`}>
                {feedback === "correct" ? "BENAR!" : "UPS!"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button onClick={() => setDirection({ x: 0, y: -1 })} className="p-4 bg-white rounded-2xl shadow-md active:scale-95"><ChevronUp /></button>
        <div />
        <button onClick={() => setDirection({ x: -1, y: 0 })} className="p-4 bg-white rounded-2xl shadow-md active:scale-95"><ChevronLeft /></button>
        <button onClick={() => setDirection({ x: 0, y: 1 })} className="p-4 bg-white rounded-2xl shadow-md active:scale-95"><ChevronDown /></button>
        <button onClick={() => setDirection({ x: 1, y: 0 })} className="p-4 bg-white rounded-2xl shadow-md active:scale-95"><ChevronRight /></button>
      </div>

      <div className="text-center max-w-xs">
        <p className="text-brand-navy/60 text-xs font-bold uppercase tracking-widest mb-2">Gunakan Panah Keyboard atau Tombol di Atas</p>
        <p className="text-brand-navy/40 text-[10px] font-medium">Cari bola jawaban yang benar dan hindari hantu!</p>
      </div>
    </div>
  );
}
