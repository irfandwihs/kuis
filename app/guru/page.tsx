"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  Play,
  History,
  LogOut,
  Sparkles,
  BookOpen,
  Trash2,
  X,
  Eye,
  Trophy,
  Search,
  Filter,
  Home,
  FileText,
  Users,
  Link as LinkIcon,
  BarChart2,
  TrendingUp,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GoogleGenAI, Type } from "@google/genai";
import Avatar from "@/components/Avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Quiz {
  id: string;
  title: string;
  subject: string;
  questions: any[];
  quizType?: string;
  hiddenWord?: string;
}

interface Room {
  id: string;
  roomCode: string;
  quizId: string;
  status: string;
  quizTitle?: string;
  createdAt: any;
}

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

export default function GuruDashboard() {
  const { userData, logout } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizType, setQuizType] = useState<
    "multiple_choice" | "true_false" | "duck_hunt" | "hidden_word"
  >("multiple_choice");
  const [viewingQuiz, setViewingQuiz] = useState<Quiz | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [isViewingLeaderboard, setIsViewingLeaderboard] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState("");
  const [fullLeaderboard, setFullLeaderboard] = useState<any[]>([]);
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false);
  const [mainTab, setMainTab] = useState<
    "beranda" | "kuis" | "tugas" | "materi" | "analitik"
  >("beranda");

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<{
    classStats: any[];
    quizStats: any[];
    timeStats: any[];
    totalStudents: number;
    totalQuizzes: number;
    avgScore: number;
  } | null>(null);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);

  // Manual Quiz State
  const [isCreatingManualQuiz, setIsCreatingManualQuiz] = useState(false);
  const [manualQuizTitle, setManualQuizTitle] = useState("");
  const [manualQuizType, setManualQuizType] = useState<
    "multiple_choice" | "true_false" | "duck_hunt" | "hidden_word"
  >("multiple_choice");
  const [manualHiddenWord, setManualHiddenWord] = useState("");
  const [manualQuestions, setManualQuestions] = useState<any[]>([]);
  const [currentManualQuestion, setCurrentManualQuestion] = useState("");
  const [currentManualOptions, setCurrentManualOptions] = useState([
    "",
    "",
    "",
    "",
  ]);
  const [currentManualCorrectIdx, setCurrentManualCorrectIdx] = useState(0);

  // Material State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [materialType, setMaterialType] = useState<"text" | "link">("text");
  const [materialContent, setMaterialContent] = useState("");
  const [materialPoints, setMaterialPoints] = useState<string[]>([""]);
  const [materialLink, setMaterialLink] = useState("");
  const [showMaterialErrors, setShowMaterialErrors] = useState(false);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(
    null,
  );
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);

  const [viewingRoomLeaderboard, setViewingRoomLeaderboard] = useState<any[]>(
    [],
  );
  const [isFetchingRoomLeaderboard, setIsFetchingRoomLeaderboard] =
    useState(false);
  const [viewingRoomId, setViewingRoomId] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    if (!userData?.uid) return;
    try {
      const q = query(
        collection(db, "quizzes"),
        where("guruId", "==", userData.uid),
      );
      const snapshot = await getDocs(q);
      setQuizzes(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Quiz),
      );
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  }, [userData?.uid]);

  const fetchRooms = useCallback(async () => {
    if (!userData?.uid) return;
    try {
      const q = query(
        collection(db, "rooms"),
        where("guruId", "==", userData.uid),
      );
      const snapshot = await getDocs(q);
      setRooms(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Room),
      );
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  }, [userData?.uid]);

  const fetchMaterials = useCallback(async () => {
    if (!userData?.uid) return;
    try {
      const q = query(
        collection(db, "materials"),
        where("guruId", "==", userData.uid),
        orderBy("order", "asc"),
      );
      const snapshot = await getDocs(q);
      setMaterials(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Material),
      );
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  }, [userData?.uid]);

  const fetchTopStudents = useCallback(async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "Siswa"),
        orderBy("xp", "desc"),
        limit(5),
      );
      const snapshot = await getDocs(q);
      setTopStudents(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    } catch (error) {
      console.error("Error fetching top students:", error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!userData?.uid || rooms.length === 0) return;
    setIsFetchingAnalytics(true);
    try {
      const classMap: Record<string, { total: number; count: number }> = {};
      const quizMap: Record<string, { title: string; total: number; count: number }> = {};
      const timeMap: Record<string, { total: number; count: number }> = {};
      
      let totalScore = 0;
      let totalParticipants = 0;

      // Fetch leaderboards for all rooms
      const lbPromises = rooms.map(async (room) => {
        const lbRef = collection(db, "rooms", room.id, "leaderboard");
        const snapshot = await getDocs(lbRef);
        return { room, docs: snapshot.docs };
      });

      const results = await Promise.all(lbPromises);

      results.forEach(({ room, docs }) => {
        docs.forEach((doc) => {
          const data = doc.data();
          if (data.status === "finished") {
            const score = data.score || 0;
            const className = data.studentClass || "Tanpa Kelas";
            const quizTitle = room.quizTitle || "Kuis Tanpa Judul";
            const date = room.createdAt?.toDate()?.toLocaleDateString("id-ID", { month: "short", day: "numeric" }) || "Unknown";

            // Class Stats
            if (!classMap[className]) classMap[className] = { total: 0, count: 0 };
            classMap[className].total += score;
            classMap[className].count += 1;

            // Quiz Stats
            if (!quizMap[room.quizId]) quizMap[room.quizId] = { title: quizTitle, total: 0, count: 0 };
            quizMap[room.quizId].total += score;
            quizMap[room.quizId].count += 1;

            // Time Stats
            if (!timeMap[date]) timeMap[date] = { total: 0, count: 0 };
            timeMap[date].total += score;
            timeMap[date].count += 1;

            totalScore += score;
            totalParticipants += 1;
          }
        });
      });

      const classStats = Object.entries(classMap).map(([name, stats]) => ({
        name,
        avg: Math.round(stats.total / stats.count),
        count: stats.count
      })).sort((a, b) => b.avg - a.avg);

      const quizStats = Object.entries(quizMap).map(([id, stats]) => ({
        name: stats.title,
        avg: Math.round(stats.total / stats.count),
        count: stats.count
      })).sort((a, b) => a.avg - b.avg); // Sort by lowest average to see "difficult" topics

      const timeStats = Object.entries(timeMap).map(([date, stats]) => ({
        date,
        avg: Math.round(stats.total / stats.count)
      }));

      setAnalyticsData({
        classStats,
        quizStats,
        timeStats,
        totalStudents: totalParticipants,
        totalQuizzes: rooms.length,
        avgScore: totalParticipants > 0 ? Math.round(totalScore / totalParticipants) : 0
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsFetchingAnalytics(false);
    }
  }, [userData?.uid, rooms]);

  useEffect(() => {
    if (mainTab === "analitik" && !analyticsData) {
      fetchAnalytics();
    }
  }, [mainTab, analyticsData, fetchAnalytics]);
  const fetchFullLeaderboard = useCallback(async (classFilter: string) => {
    setIsFetchingLeaderboard(true);
    try {
      let q;
      if (classFilter) {
        q = query(
          collection(db, "users"),
          where("role", "==", "Siswa"),
          where("studentClass", "==", classFilter),
          orderBy("xp", "desc"),
        );
      } else {
        q = query(
          collection(db, "users"),
          where("role", "==", "Siswa"),
          orderBy("xp", "desc"),
          limit(50),
        );
      }
      const snapshot = await getDocs(q);
      setFullLeaderboard(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    } catch (error) {
      console.error("Error fetching full leaderboard:", error);
    } finally {
      setIsFetchingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    if (isViewingLeaderboard) {
      fetchFullLeaderboard(leaderboardFilter);
    }
  }, [isViewingLeaderboard, leaderboardFilter, fetchFullLeaderboard]);

  useEffect(() => {
    const loadData = async () => {
      if (userData?.uid) {
        setIsLoading(true);
        await Promise.all([
          fetchQuizzes(),
          fetchRooms(),
          fetchTopStudents(),
          fetchMaterials(),
        ]);
        setIsLoading(false);
      }
    };
    loadData();
  }, [userData, fetchQuizzes, fetchRooms, fetchTopStudents, fetchMaterials]);

  const fetchRoomLeaderboard = async (roomId: string) => {
    setIsFetchingRoomLeaderboard(true);
    setViewingRoomId(roomId);
    try {
      const lbRef = collection(db, "rooms", roomId, "leaderboard");
      const q = query(lbRef, orderBy("score", "desc"));
      const snapshot = await getDocs(q);
      setViewingRoomLeaderboard(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    } catch (error) {
      console.error("Error fetching room leaderboard:", error);
    } finally {
      setIsFetchingRoomLeaderboard(false);
    }
  };

  const generateQuizWithAI = async () => {
    if (!topic || !userData?.subject) return;

    // Collect all available Gemini API keys for rotation
    const apiKeys = [
      process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_2,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_3,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_4,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_5,
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      alert(
        "API Key Gemini belum dikonfigurasi. Silakan hubungi administrator.",
      );
      return;
    }

    setIsGenerating(true);

    let lastError = "";
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      try {
        const ai = new GoogleGenAI({ apiKey });

        let prompt = "";
        let optionsDescription = "";

        if (quizType === "true_false") {
          prompt = `Buatlah kuis Benar/Salah tentang ${topic} untuk kelas ${userData.subject} dalam Bahasa Indonesia. Sertakan ${numQuestions} pernyataan. Untuk setiap pertanyaan, berikan sebuah pernyataan. Pilihan jawaban (options) HARUS selalu ["Benar", "Salah"]. correctAnswerIndex adalah 0 jika pernyataan itu benar, dan 1 jika pernyataan itu salah.`;
          optionsDescription = 'Exactly 2 options: ["Benar", "Salah"]';
        } else if (quizType === "hidden_word") {
          prompt = `Buatlah kuis pilihan ganda tentang ${topic} untuk kelas ${userData.subject} dalam Bahasa Indonesia. Sertakan ${numQuestions} pertanyaan. Berikan 4 pilihan jawaban untuk setiap pertanyaan. SELAIN ITU, berikan satu KATA RAHASIA (hiddenWord) yang berkaitan erat dengan topik ${topic}. Kata rahasia ini sebaiknya terdiri dari 5 hingga 10 huruf tanpa spasi, gunakan huruf kapital semua.`;
          optionsDescription = "Exactly 4 options";
        } else {
          // Both multiple_choice and duck_hunt use 4 options
          prompt = `Buatlah kuis pilihan ganda tentang ${topic} untuk kelas ${userData.subject} dalam Bahasa Indonesia. Sertakan ${numQuestions} pertanyaan. Berikan 4 pilihan jawaban untuk setiap pertanyaan.`;
          optionsDescription = "Exactly 4 options";
        }

        const schemaProperties: any = {
          title: {
            type: Type.STRING,
            description: "A catchy title for the quiz",
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: optionsDescription,
                },
                correctAnswerIndex: {
                  type: Type.INTEGER,
                  description: "Index of the correct option",
                },
              },
              required: ["question", "options", "correctAnswerIndex"],
            },
          },
        };
        const schemaRequired = ["title", "questions"];

        if (quizType === "hidden_word") {
          schemaProperties.hiddenWord = {
            type: Type.STRING,
            description:
              "A secret word related to the topic, 5-10 letters, no spaces, uppercase",
          };
          schemaRequired.push("hiddenWord");
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: schemaProperties,
              required: schemaRequired,
            },
          },
        });

        const generatedData = JSON.parse(response.text || "{}");

        if (generatedData.title && generatedData.questions) {
          const quizData: any = {
            guruId: userData.uid,
            subject: userData.subject,
            title: generatedData.title,
            quizType: quizType, // Save the mode
            questions: generatedData.questions,
            createdAt: new Date(),
          };
          if (quizType === "hidden_word" && generatedData.hiddenWord) {
            quizData.hiddenWord = generatedData.hiddenWord;
          }
          await addDoc(collection(db, "quizzes"), quizData);
          await fetchQuizzes();
          setTopic("");
          setIsGenerating(false);
          return; // Success! Exit the function
        }
      } catch (error: any) {
        console.error(`Error with API Key ${i + 1}:`, error);
        lastError = error.message || "Unknown error";

        // If it's a rate limit error (429), try the next key
        if (
          lastError.includes("429") ||
          lastError.toLowerCase().includes("quota") ||
          lastError.toLowerCase().includes("limit")
        ) {
          if (i < apiKeys.length - 1) {
            console.warn(`API Key ${i + 1} hit rate limit. Trying next key...`);
            continue;
          }
        }

        // If it's not a rate limit error, or we're out of keys, break and show error
        break;
      }
    }

    setIsGenerating(false);
    alert(`Gagal membuat kuis: ${lastError}. Silakan coba lagi nanti.`);
  };

  const createRoom = async (quizId: string) => {
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const roomRef = await addDoc(collection(db, "rooms"), {
      roomCode,
      quizId,
      guruId: userData?.uid,
      status: "waiting",
      createdAt: new Date(),
    });
    router.push(`/room/guru/${roomCode}`);
  };

  const deleteRoom = async (roomId: string) => {
    if (deletingRoomId !== roomId) {
      setDeletingRoomId(roomId);
      setTimeout(() => setDeletingRoomId(null), 3000); // Reset after 3s
      return;
    }

    try {
      setDeletingRoomId(null);

      // 1. Bersihkan sub-koleksi leaderboard di dalam ruangan
      const leaderboardRef = collection(db, "rooms", roomId, "leaderboard");
      const leaderboardSnap = await getDocs(leaderboardRef);
      const deletePromises = leaderboardSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // 2. Hapus dokumen ruangan utama
      const roomRef = doc(db, "rooms", roomId);
      await deleteDoc(roomRef);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (error: any) {
      console.error("Error deleting room:", error);
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (deletingQuizId !== quizId) {
      setDeletingQuizId(quizId);
      setTimeout(() => setDeletingQuizId(null), 3000); // Reset after 3s
      return;
    }

    try {
      setDeletingQuizId(null);
      const quizRef = doc(db, "quizzes", quizId);
      await deleteDoc(quizRef);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (error: any) {
      console.error("Error deleting quiz:", error);
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (deletingMaterialId !== materialId) {
      setDeletingMaterialId(materialId);
      setTimeout(() => setDeletingMaterialId(null), 3000);
      return;
    }

    try {
      setDeletingMaterialId(null);
      const matRef = doc(db, "materials", materialId);
      await deleteDoc(matRef);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (error: any) {
      console.error("Error deleting material:", error);
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  const handleCreateMaterial = async () => {
    setShowMaterialErrors(true);

    if (!materialTitle.trim() || !materialDesc.trim()) {
      alert("Judul dan deskripsi harus diisi.");
      return;
    }

    if (materialType === "text" && materialPoints.every((p) => !p.trim())) {
      alert("Konten materi harus diisi minimal 1 poin.");
      return;
    }

    if (materialType === "link" && !materialLink.trim()) {
      alert("Link materi harus diisi.");
      return;
    }

    setIsUploadingMaterial(true);
    try {
      const newMaterial = {
        guruId: userData?.uid,
        subject: userData?.subject,
        title: materialTitle,
        description: materialDesc,
        content: "",
        points:
          materialType === "text"
            ? materialPoints.filter((p) => p.trim() !== "")
            : [],
        fileUrl: materialType === "link" ? materialLink : "",
        fileName: materialType === "link" ? "Link Eksternal" : "",
        order: materials.length + 1,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "materials"), newMaterial);
      await fetchMaterials();

      setIsCreatingMaterial(false);
      setShowMaterialErrors(false);
      setMaterialTitle("");
      setMaterialDesc("");
      setMaterialContent("");
      setMaterialPoints([""]);
      setMaterialLink("");
    } catch (error: any) {
      console.error("Error creating material:", error);
      alert(`Gagal membuat materi: ${error.message}`);
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  if (!userData) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-cream">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-brand-navy font-medium">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center pb-24 md:pb-32">
      <div className="w-full max-w-md md:max-w-4xl px-4 py-6 md:py-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-6 md:p-8 rounded-[32px] shadow-sm gap-4 border border-brand-navy/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-navy rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-navy/10">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-brand-navy tracking-tight">
                Dashboard Guru
              </h1>
              <p className="text-brand-navy/60 text-[10px] md:text-sm font-black uppercase tracking-widest">
                AksaraPlay • {userData.subject}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-brand-navy/40 hover:text-brand-orange transition-colors font-black text-[10px] md:text-xs uppercase tracking-widest"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </header>

        {mainTab === "kuis" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Quiz Generator */}
              <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5 relative overflow-hidden group flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-brand-orange/10 transition-colors" />

                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className="p-3 md:p-4 bg-brand-orange text-white rounded-2xl shadow-lg shadow-brand-orange/20">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-brand-navy tracking-tight">
                      Buat Kuis AI
                    </h2>
                    <p className="text-brand-navy/60 text-xs md:text-sm font-medium">
                      Gunakan AI untuk membuat kuis instan
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 flex-1">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                      Topik Pembelajaran
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="misal: Fotosintesis..."
                      className="w-full p-4 bg-brand-cream/50 border-2 border-transparent rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all font-bold text-brand-navy text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                      Jumlah Soal
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                      className="w-full p-4 bg-brand-cream/50 border-2 border-transparent rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all font-bold text-brand-navy text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                      Mode Permainan
                    </label>
                    <select
                      value={quizType}
                      onChange={(e) =>
                        setQuizType(
                          e.target.value as
                            | "multiple_choice"
                            | "true_false"
                            | "duck_hunt"
                            | "hidden_word",
                        )
                      }
                      className="w-full p-4 bg-brand-cream/50 border-2 border-transparent rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all font-bold text-brand-navy text-sm cursor-pointer appearance-none"
                    >
                      <option value="multiple_choice">
                        Pilihan Ganda (Classic)
                      </option>
                      <option value="true_false">Benar / Salah (Buzzer)</option>
                      <option value="duck_hunt">Berburu Bebek (Duck Hunt)</option>
                      <option value="hidden_word">Tebak Kata Tersembunyi</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateQuizWithAI}
                  disabled={isGenerating || !topic}
                  className="w-full bg-brand-navy text-white font-black text-base md:text-lg py-4 md:py-5 rounded-2xl hover:bg-brand-black hover:shadow-xl hover:shadow-brand-navy/20 transition-all disabled:opacity-50 flex justify-center items-center gap-3 active:scale-[0.98] mt-auto"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Meracik Soal...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                      Buat Kuis Sekarang
                    </>
                  )}
                </button>
              </section>

              {/* Manual Quiz Generator */}
              <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5 relative overflow-hidden group flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-navy/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-brand-navy/10 transition-colors" />

                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className="p-3 md:p-4 bg-brand-navy text-white rounded-2xl shadow-lg shadow-brand-navy/20">
                    <FileText className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-brand-navy tracking-tight">
                      Buat Kuis Manual
                    </h2>
                    <p className="text-brand-navy/60 text-xs md:text-sm font-medium">
                      Buat kuis dengan pertanyaan Anda sendiri
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-brand-navy/10 rounded-3xl mb-6 bg-brand-cream/30">
                  <FileText className="w-12 h-12 text-brand-navy/20 mb-4" />
                  <p className="text-brand-navy/60 text-sm font-bold mb-2">
                    Kustomisasi penuh untuk setiap soal
                  </p>
                  <p className="text-brand-navy/40 text-xs">
                    Pilih mode permainan, tambahkan pertanyaan, dan tentukan jawaban yang benar secara manual.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsCreatingManualQuiz(true);
                    setManualQuizType("multiple_choice");
                    setCurrentManualOptions(["", "", "", ""]);
                    setCurrentManualCorrectIdx(0);
                  }}
                  className="w-full bg-brand-cream text-brand-navy font-black text-base md:text-lg py-4 md:py-5 rounded-2xl hover:bg-brand-navy hover:text-white hover:shadow-xl hover:shadow-brand-navy/20 transition-all flex justify-center items-center gap-3 active:scale-[0.98] mt-auto"
                >
                  <Plus className="w-5 h-5 md:w-6 md:h-6" />
                  Buat Kuis Manual
                </button>
              </section>
            </div>

            {/* My Quizzes */}
            <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-black text-brand-navy flex items-center gap-3 tracking-tight">
                  <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-brand-orange" />
                  Koleksi Kuis
                </h2>
                <div className="flex items-center gap-2">
                  <span className="bg-brand-cream text-brand-navy/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">
                    {quizzes.length} Kuis
                  </span>
                </div>
              </div>

              {quizzes.length === 0 ? (
                <div className="text-center py-12 md:py-16 bg-brand-cream/30 rounded-[32px] border-2 border-dashed border-brand-navy/10">
                  <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-brand-navy/20 mx-auto mb-4" />
                  <p className="text-brand-navy/40 text-sm font-bold">
                    Belum ada kuis. Mulai dengan AI!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="group p-5 md:p-6 bg-white border-2 border-brand-navy/5 rounded-3xl hover:border-brand-orange hover:shadow-xl hover:shadow-brand-orange/5 transition-all relative"
                    >
                      <div className="mb-4 md:mb-6">
                        <h3 className="font-black text-lg md:text-xl text-brand-navy mb-1 group-hover:text-brand-orange transition-colors line-clamp-2">
                          {quiz.title}
                        </h3>
                        <p className="text-[10px] text-brand-navy/40 font-black uppercase tracking-widest mb-1">
                          {quiz.questions.length} Pertanyaan •{" "}
                          {quiz.quizType === "true_false"
                            ? "Benar/Salah"
                            : quiz.quizType === "duck_hunt"
                              ? "Duck Hunt"
                              : quiz.quizType === "hidden_word"
                                ? "Kata Tersembunyi"
                                : "Pilihan Ganda"}
                        </p>
                        {quiz.quizType === "hidden_word" && quiz.hiddenWord && (
                          <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest">
                            Kata: {quiz.hiddenWord}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingQuiz(quiz)}
                          className="flex-1 bg-brand-orange text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-brand-orange/90 transition-colors shadow-lg shadow-brand-orange/20 active:scale-95"
                        >
                          <Eye className="w-4 h-4" />
                          Lihat Soal
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuiz(quiz.id);
                          }}
                          className={`px-4 rounded-2xl transition-all flex items-center justify-center active:scale-95 ${
                            deletingQuizId === quiz.id
                              ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                              : "bg-red-50 text-red-500 hover:bg-red-100"
                          }`}
                          title={
                            deletingQuizId === quiz.id
                              ? "Klik lagi untuk konfirmasi"
                              : "Hapus Kuis"
                          }
                        >
                          {deletingQuizId === quiz.id ? (
                            <span className="text-[10px] font-black uppercase">
                              Yakin?
                            </span>
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {mainTab === "analitik" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {isFetchingAnalytics ? (
              <div className="bg-white p-12 rounded-[40px] shadow-sm border border-brand-navy/5 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-brand-navy font-black uppercase tracking-widest text-xs">Menganalisis Data...</p>
              </div>
            ) : analyticsData ? (
              <>
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-navy/5">
                    <p className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-1">Total Partisipan</p>
                    <h3 className="text-3xl font-black text-brand-navy">{analyticsData.totalStudents}</h3>
                    <p className="text-[10px] font-bold text-emerald-500 mt-1">Siswa Aktif</p>
                  </div>
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-navy/5">
                    <p className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-1">Rata-rata Skor</p>
                    <h3 className="text-3xl font-black text-brand-orange">{analyticsData.avgScore} XP</h3>
                    <p className="text-[10px] font-bold text-brand-navy/40 mt-1">Seluruh Kuis</p>
                  </div>
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-navy/5">
                    <p className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-1">Total Ruangan</p>
                    <h3 className="text-3xl font-black text-brand-navy">{analyticsData.totalQuizzes}</h3>
                    <p className="text-[10px] font-bold text-brand-navy/40 mt-1">Sesi Selesai</p>
                  </div>
                </div>

                {/* Class Performance Chart */}
                <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
                  <h2 className="text-xl md:text-2xl font-black text-brand-navy mb-6 flex items-center gap-3 tracking-tight">
                    <TrendingUp className="w-6 h-6 text-brand-orange" />
                    Rata-rata Nilai per Kelas
                  </h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.classStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="avg" fill="#FF5A1F" radius={[8, 8, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Difficult Topics */}
                  <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
                    <h2 className="text-xl font-black text-brand-navy mb-6 flex items-center gap-3 tracking-tight">
                      <PieChartIcon className="w-6 h-6 text-brand-orange" />
                      Materi Paling Menantang
                    </h2>
                    <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mb-6">
                      Berdasarkan rata-rata skor terendah
                    </p>
                    <div className="space-y-4">
                      {analyticsData.quizStats.slice(0, 5).map((quiz, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-brand-cream/30 rounded-2xl border border-brand-navy/5">
                          <div className="min-w-0">
                            <p className="font-black text-brand-navy text-sm truncate">{quiz.name}</p>
                            <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">{quiz.count} Partisipan</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-red-500 text-sm">{quiz.avg} XP</p>
                            <p className="text-[8px] font-bold text-brand-navy/30 uppercase tracking-widest">Rata-rata</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Performance Trend */}
                  <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
                    <h2 className="text-xl font-black text-brand-navy mb-6 flex items-center gap-3 tracking-tight">
                      <TrendingUp className="w-6 h-6 text-brand-orange" />
                      Tren Performa
                    </h2>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.timeStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10 }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10 }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="avg" 
                            stroke="#FF5A1F" 
                            strokeWidth={4} 
                            dot={{ fill: '#FF5A1F', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>

                <button 
                  onClick={fetchAnalytics}
                  className="w-full py-4 bg-brand-navy/5 text-brand-navy/40 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-brand-navy/10 transition-all"
                >
                  Perbarui Analitik
                </button>
              </>
            ) : (
              <div className="bg-white p-12 rounded-[40px] shadow-sm border border-brand-navy/5 text-center">
                <BarChart2 className="w-12 h-12 text-brand-navy/10 mx-auto mb-4" />
                <p className="text-brand-navy/40 font-bold">Belum ada data untuk dianalisis.</p>
                <button 
                  onClick={fetchAnalytics}
                  className="mt-4 px-6 py-3 bg-brand-navy text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        )}
        {mainTab === "beranda" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
              <h2 className="text-xl md:text-2xl font-black text-brand-navy mb-6 md:mb-8 flex items-center gap-3 tracking-tight">
                <History className="w-6 h-6 md:w-7 md:h-7 text-brand-orange" />
                Ruangan
              </h2>
              {rooms.length === 0 ? (
                <p className="text-brand-navy/40 text-center py-8 text-sm font-bold">
                  Belum ada ruangan.
                </p>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-5 bg-brand-cream/50 rounded-3xl border border-transparent hover:border-brand-orange/20 transition-all"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono font-black text-xl md:text-2xl tracking-widest text-brand-navy">
                          {room.roomCode}
                        </span>
                        <span
                          className={`text-[8px] md:text-[10px] px-2 md:px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                            room.status === "active"
                              ? "bg-brand-orange text-white"
                              : room.status === "waiting"
                                ? "bg-brand-navy text-white"
                                : "bg-brand-navy/20 text-brand-navy"
                          }`}
                        >
                          {room.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/room/guru/${room.roomCode}`)
                          }
                          className="flex-1 text-center py-2 text-xs font-black text-brand-orange hover:text-brand-orange/80 transition-colors uppercase tracking-widest"
                        >
                          {room.status === "finished"
                            ? "Laporan \u2192"
                            : "Pantau \u2192"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRoom(room.id);
                          }}
                          className={`p-2 rounded-xl transition-all z-10 ${
                            deletingRoomId === room.id
                              ? "bg-red-500 text-white shadow-lg shadow-red-500/20 scale-110"
                              : "text-brand-navy/20 hover:text-red-500"
                          }`}
                          title={
                            deletingRoomId === room.id
                              ? "Klik lagi untuk konfirmasi"
                              : "Hapus Ruangan"
                          }
                        >
                          {deletingRoomId === room.id ? (
                            <span className="text-[8px] font-black uppercase px-1">
                              Yakin?
                            </span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Student Ranking Monitoring */}
            <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-black text-brand-navy flex items-center gap-3 tracking-tight">
                  <Trophy className="w-6 h-6 md:w-7 md:h-7 text-brand-orange" />
                  Peringkat Global Siswa
                </h2>
                <button
                  onClick={() => setIsViewingLeaderboard(true)}
                  className="text-[10px] font-black text-brand-orange uppercase tracking-widest hover:underline"
                >
                  Lihat Semua
                </button>
              </div>
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mb-4 bg-brand-cream/50 p-3 rounded-xl">
                * Peringkat global dihitung berdasarkan akumulasi XP dari
                seluruh kuis yang telah dikerjakan siswa.
              </p>
              {topStudents.length === 0 ? (
                <p className="text-brand-navy/40 text-center py-8 text-sm font-bold">
                  Belum ada data peringkat.
                </p>
              ) : (
                <div className="space-y-4">
                  {topStudents.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-brand-cream/30 rounded-3xl border border-transparent hover:border-brand-orange/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                            index === 0
                              ? "bg-yellow-400 text-white"
                              : index === 1
                                ? "bg-slate-300 text-white"
                                : index === 2
                                  ? "bg-amber-600 text-white"
                                  : "bg-brand-navy/10 text-brand-navy"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <Avatar avatarString={student.avatar} size="sm" />
                        <div>
                          <p className="font-black text-brand-navy text-sm leading-tight">
                            {student.displayName}
                          </p>
                          <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                            {student.studentClass || "Siswa"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-brand-orange text-sm">
                          {student.xp} XP
                        </p>
                        <p className="text-[8px] font-bold text-brand-navy/30 uppercase tracking-widest">
                          Level {Math.floor((student.xp || 0) / 100) + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Room History / Quiz Results */}
            <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-black text-brand-navy flex items-center gap-3 tracking-tight">
                  <History className="w-6 h-6 md:w-7 md:h-7 text-brand-orange" />
                  Riwayat Ruangan & Hasil Kuis
                </h2>
                <span className="bg-brand-cream text-brand-navy/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {rooms.length} Ruangan
                </span>
              </div>

              {rooms.length === 0 ? (
                <div className="text-center py-12 bg-brand-cream/30 rounded-[32px] border-2 border-dashed border-brand-navy/10">
                  <History className="w-10 h-10 text-brand-navy/20 mx-auto mb-4" />
                  <p className="text-brand-navy/40 text-sm font-bold">
                    Belum ada riwayat kuis.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {[...rooms]
                    .sort(
                      (a, b) =>
                        (b.createdAt?.seconds || 0) -
                        (a.createdAt?.seconds || 0),
                    )
                    .map((room) => (
                      <div
                        key={room.id}
                        className="p-5 bg-brand-cream/30 rounded-3xl border border-brand-navy/5 hover:border-brand-orange/20 transition-all flex justify-between items-center group"
                      >
                        <div>
                          <h3 className="font-black text-brand-navy text-base mb-1">
                            {room.quizTitle || "Kuis Tanpa Judul"}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest">
                              Kode: {room.roomCode}
                            </span>
                            <span
                              className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                room.status === "finished"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-brand-orange/10 text-brand-orange"
                              }`}
                            >
                              {room.status === "finished" ? "Selesai" : "Aktif"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => fetchRoomLeaderboard(room.id)}
                          className="p-3 bg-white text-brand-navy/40 hover:text-brand-orange rounded-2xl shadow-sm transition-all group-hover:scale-110"
                          title="Lihat Peringkat"
                        >
                          <Trophy className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Room Leaderboard Modal */}
        {viewingRoomId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 md:p-8 border-b border-brand-navy/5 flex justify-between items-center bg-brand-cream/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-brand-navy tracking-tight">
                      Hasil Kuis Ruangan
                    </h2>
                    <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                      Peringkat Siswa di Ruangan Ini
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingRoomId(null)}
                  className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors text-brand-navy/40 hover:text-brand-navy"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                {isFetchingRoomLeaderboard ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest animate-pulse">
                      Memuat Peringkat...
                    </p>
                  </div>
                ) : viewingRoomLeaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-brand-navy/10 mx-auto mb-4" />
                    <p className="text-brand-navy/40 font-bold">
                      Belum ada siswa yang menyelesaikan kuis ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viewingRoomLeaderboard.map((entry, idx) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 bg-brand-cream/20 rounded-2xl border border-transparent"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                              idx === 0
                                ? "bg-yellow-400 text-white"
                                : idx === 1
                                  ? "bg-slate-300 text-white"
                                  : idx === 2
                                    ? "bg-amber-600 text-white"
                                    : "bg-brand-navy/5 text-brand-navy/40"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <Avatar avatarString={entry.avatar} size="sm" />
                          <div>
                            <p className="font-black text-brand-navy text-sm leading-tight">
                              {entry.siswaName}
                            </p>
                            <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                              {entry.studentClass || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-brand-orange text-sm">
                            {entry.score} XP
                          </p>
                          <p className="text-[8px] font-bold text-brand-navy/30 uppercase tracking-widest">
                            {entry.status === "finished" ? "Selesai" : "Aktif"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-brand-navy/5 bg-brand-cream/10">
                <button
                  onClick={() => {
                    const room = rooms.find((r) => r.id === viewingRoomId);
                    if (room) router.push(`/room/guru/${room.roomCode}`);
                  }}
                  className="w-full bg-brand-navy text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-black transition-all"
                >
                  Buka Detail Ruangan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Modal */}
        {isViewingLeaderboard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-brand-navy/5 flex items-center justify-between bg-brand-cream/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-brand-navy tracking-tight">
                      Papan Peringkat Global
                    </h2>
                    <p className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest">
                      Pantau kemajuan seluruh siswa
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewingLeaderboard(false)}
                  className="p-3 bg-white rounded-2xl text-brand-navy/20 hover:text-brand-orange transition-all shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 bg-white border-b border-brand-navy/5 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy/20" />
                  <select
                    value={leaderboardFilter}
                    onChange={(e) => setLeaderboardFilter(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-brand-cream/50 border-2 border-transparent rounded-2xl focus:border-brand-orange focus:bg-white outline-none text-brand-navy font-bold transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Semua Kelas</option>
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
                        Kelas {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center px-6 py-4 bg-brand-orange/5 rounded-2xl border border-brand-orange/10">
                  <p className="text-xs font-black text-brand-orange uppercase tracking-widest">
                    Total: {fullLeaderboard.length} Siswa
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isFetchingLeaderboard ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-xs font-black text-brand-navy/40 uppercase tracking-widest animate-pulse">
                      Memuat Data...
                    </p>
                  </div>
                ) : fullLeaderboard.length === 0 ? (
                  <div className="text-center py-20">
                    <Trophy className="w-16 h-16 text-brand-navy/10 mx-auto mb-4" />
                    <p className="text-brand-navy/40 font-bold">
                      Tidak ada data untuk filter ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fullLeaderboard.map((student, index) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-5 bg-brand-cream/20 rounded-[32px] border border-transparent hover:border-brand-orange/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                              index === 0
                                ? "bg-yellow-400 text-white shadow-lg shadow-yellow-400/20"
                                : index === 1
                                  ? "bg-slate-300 text-white shadow-lg shadow-slate-300/20"
                                  : index === 2
                                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                                    : "bg-white text-brand-navy/40 shadow-sm"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <Avatar avatarString={student.avatar} size="md" />
                          <div>
                            <p className="font-black text-brand-navy text-lg leading-tight">
                              {student.displayName}
                            </p>
                            <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                              Kelas {student.studentClass || "-"} • No Absen {student.studentAbsen || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-brand-orange" />
                            <p className="font-black text-brand-orange text-xl">
                              {student.xp}
                            </p>
                            <span className="text-[10px] font-black text-brand-orange/40 uppercase">
                              XP
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-widest">
                            Level {Math.floor((student.xp || 0) / 100) + 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

        {mainTab === "materi" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-brand-navy/5">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-black text-brand-navy flex items-center gap-3 tracking-tight">
                  <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-brand-orange" />
                  Materi Pembelajaran
                </h2>
                <button
                  onClick={() => {
                    setIsCreatingMaterial(true);
                    setShowMaterialErrors(false);
                  }}
                  className="bg-brand-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-black transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>

              {materials.length === 0 ? (
                <div className="text-center py-12 md:py-16 bg-brand-cream/30 rounded-[32px] border-2 border-dashed border-brand-navy/10">
                  <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-brand-navy/20 mx-auto mb-4" />
                  <p className="text-brand-navy/40 text-sm font-bold">
                    Belum ada materi. Tambahkan sekarang!
                  </p>
                </div>
              ) : (
                <div className="relative py-10">
                  {/* Duolingo-like path line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-brand-cream -translate-x-1/2 rounded-full hidden md:block" />

                  <div className="space-y-12 relative z-10">
                    {materials.map((mat, idx) => {
                      // Zig-zag logic: 0 -> center-left, 1 -> center-right, 2 -> center
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

                            {/* Action buttons on hover */}
                            <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMaterial(mat.id);
                                }}
                                className={`p-2 rounded-xl transition-all ${
                                  deletingMaterialId === mat.id
                                    ? "bg-red-500 text-white"
                                    : "bg-white text-red-500 shadow-lg hover:bg-red-50"
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-navy/10 flex justify-around items-center p-4 pb-safe z-50 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl">
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
          onClick={() => setMainTab("analitik")}
          className={`flex flex-col items-center gap-1 transition-colors ${mainTab === "analitik" ? "text-brand-orange" : "text-brand-navy/40 hover:text-brand-navy/60"}`}
        >
          <BarChart2
            className={`w-6 h-6 ${mainTab === "analitik" ? "fill-current" : ""}`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Analitik
          </span>
        </button>
      </nav>

      {/* Bottom Navigation - Desktop */}
      <nav className="hidden md:flex fixed bottom-0 left-0 right-0 bg-white border-t border-brand-navy/10 justify-center items-center gap-12 p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setMainTab("beranda")}
          className={`flex flex-col items-center gap-2 transition-all px-6 py-3 rounded-2xl ${
            mainTab === "beranda"
              ? "bg-brand-orange/10 text-brand-orange"
              : "text-brand-navy/40 hover:text-brand-navy/60 hover:bg-brand-navy/5"
          }`}
        >
          <Home
            className={`w-6 h-6 ${mainTab === "beranda" ? "fill-current" : ""}`}
          />
          <span className="text-xs font-black uppercase tracking-widest">
            Beranda
          </span>
        </button>
        <button
          onClick={() => setMainTab("kuis")}
          className={`flex flex-col items-center gap-2 transition-all px-6 py-3 rounded-2xl ${
            mainTab === "kuis"
              ? "bg-brand-orange/10 text-brand-orange"
              : "text-brand-navy/40 hover:text-brand-navy/60 hover:bg-brand-navy/5"
          }`}
        >
          <Play
            className={`w-6 h-6 ${mainTab === "kuis" ? "fill-current" : ""}`}
          />
          <span className="text-xs font-black uppercase tracking-widest">
            Kuis
          </span>
        </button>
        <button
          onClick={() => setMainTab("materi")}
          className={`flex flex-col items-center gap-2 transition-all px-6 py-3 rounded-2xl ${
            mainTab === "materi"
              ? "bg-brand-orange/10 text-brand-orange"
              : "text-brand-navy/40 hover:text-brand-navy/60 hover:bg-brand-navy/5"
          }`}
        >
          <BookOpen
            className={`w-6 h-6 ${mainTab === "materi" ? "fill-current" : ""}`}
          />
          <span className="text-xs font-black uppercase tracking-widest">
            Materi
          </span>
        </button>
        <button
          onClick={() => setMainTab("tugas")}
          className={`flex flex-col items-center gap-2 transition-all px-6 py-3 rounded-2xl ${
            mainTab === "tugas"
              ? "bg-brand-orange/10 text-brand-orange"
              : "text-brand-navy/40 hover:text-brand-navy/60 hover:bg-brand-navy/5"
          }`}
        >
          <FileText
            className={`w-6 h-6 ${mainTab === "tugas" ? "fill-current" : ""}`}
          />
          <span className="text-xs font-black uppercase tracking-widest">
            Tugas
          </span>
        </button>
        <button
          onClick={() => setMainTab("analitik")}
          className={`flex flex-col items-center gap-2 transition-all px-6 py-3 rounded-2xl ${
            mainTab === "analitik"
              ? "bg-brand-orange/10 text-brand-orange"
              : "text-brand-navy/40 hover:text-brand-navy/60 hover:bg-brand-navy/5"
          }`}
        >
          <BarChart2
            className={`w-6 h-6 ${mainTab === "analitik" ? "fill-current" : ""}`}
          />
          <span className="text-xs font-black uppercase tracking-widest">
            Analitik
          </span>
        </button>
      </nav>

      {/* Quiz Details Modal */}
      {viewingQuiz && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-brand-navy/5 flex justify-between items-center bg-brand-cream/30">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-brand-navy tracking-tight">
                  {viewingQuiz.title}
                </h2>
                <p className="text-brand-navy/40 text-[10px] font-black uppercase tracking-widest">
                  {viewingQuiz.questions.length} Pertanyaan •{" "}
                  {viewingQuiz.subject}
                </p>
              </div>
              <button
                onClick={() => setViewingQuiz(null)}
                className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors text-brand-navy/40 hover:text-brand-navy"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {viewingQuiz.questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="space-y-4 p-6 bg-brand-cream/30 rounded-3xl border border-brand-navy/5"
                >
                  <div className="flex gap-4">
                    <span className="w-8 h-8 bg-brand-navy text-white rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0">
                      {qIdx + 1}
                    </span>
                    <h3 className="font-bold text-brand-navy text-lg leading-tight">
                      {q.question}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                    {q.options.map((opt: string, oIdx: number) => (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl text-sm font-medium border ${
                          oIdx === q.correctAnswerIndex
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-white border-brand-navy/5 text-brand-navy/60"
                        }`}
                      >
                        <span className="font-black mr-2 opacity-40">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        {opt}
                        {oIdx === q.correctAnswerIndex && (
                          <span className="ml-2 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                            Benar
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 md:p-8 border-t border-brand-navy/5 bg-white">
              <button
                onClick={() => {
                  createRoom(viewingQuiz.id);
                  setViewingQuiz(null);
                }}
                className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-orange/90 shadow-xl shadow-brand-orange/20 transition-all active:scale-95"
              >
                <Play className="w-6 h-6 fill-current" />
                Buka Kelas Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Quiz Modal */}
      {isCreatingManualQuiz && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-brand-navy/5 flex justify-between items-center bg-brand-cream/30">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-brand-navy tracking-tight">
                  Buat Kuis Manual
                </h2>
                <p className="text-brand-navy/40 text-[10px] font-black uppercase tracking-widest">
                  Tambah soal satu per satu
                </p>
              </div>
              <button
                onClick={() => setIsCreatingManualQuiz(false)}
                className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors text-brand-navy/40 hover:text-brand-navy"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Left Column: Quiz Meta & Question List */}
              <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                      Judul Kuis
                    </label>
                    <input
                      type="text"
                      value={manualQuizTitle}
                      onChange={(e) => setManualQuizTitle(e.target.value)}
                      placeholder="Judul..."
                      className="w-full p-3 bg-brand-cream/50 border-2 border-transparent rounded-xl focus:border-brand-orange outline-none font-bold text-brand-navy text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                      Mode Permainan
                    </label>
                    <select
                      value={manualQuizType}
                      onChange={(e) => {
                        const type = e.target.value as any;
                        setManualQuizType(type);
                        if (type === "true_false") {
                          setCurrentManualOptions(["Benar", "Salah"]);
                          setCurrentManualCorrectIdx(0);
                        } else {
                          setCurrentManualOptions(["", "", "", ""]);
                          setCurrentManualCorrectIdx(0);
                        }
                      }}
                      className="w-full p-3 bg-brand-cream/50 border-2 border-transparent rounded-xl focus:border-brand-orange outline-none font-bold text-brand-navy text-sm appearance-none cursor-pointer"
                    >
                      <option value="multiple_choice">Pilihan Ganda</option>
                      <option value="true_false">Benar / Salah</option>
                      <option value="duck_hunt">Berburu Bebek</option>
                      <option value="hidden_word">
                        Tebak Kata Tersembunyi
                      </option>
                    </select>
                  </div>
                  {manualQuizType === "hidden_word" && (
                    <div>
                      <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                        Kata Rahasia
                      </label>
                      <input
                        type="text"
                        value={manualHiddenWord}
                        onChange={(e) =>
                          setManualHiddenWord(
                            e.target.value.toUpperCase().replace(/\s/g, ""),
                          )
                        }
                        placeholder="KATA (5-10 huruf)"
                        maxLength={10}
                        className="w-full p-3 bg-brand-cream/50 border-2 border-transparent rounded-xl focus:border-brand-orange outline-none font-bold text-brand-navy text-sm uppercase"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto bg-brand-cream/30 rounded-2xl p-4 border border-brand-navy/5 min-h-[200px]">
                  <h3 className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-3">
                    Daftar Soal ({manualQuestions.length})
                  </h3>
                  <div className="space-y-2">
                    {manualQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-brand-navy/5 text-xs font-bold text-brand-navy flex justify-between items-center group"
                      >
                        <span className="truncate pr-2">
                          {idx + 1}. {q.question}
                        </span>
                        <button
                          onClick={() => {
                            const newQ = [...manualQuestions];
                            newQ.splice(idx, 1);
                            setManualQuestions(newQ);
                          }}
                          className="text-red-500 opacity-50 hover:opacity-100 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {manualQuestions.length === 0 && (
                      <p className="text-xs text-brand-navy/40 text-center py-8">
                        Belum ada soal
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Add Question Form */}
              <div className="w-full md:w-2/3 bg-brand-cream/30 p-6 rounded-3xl border border-brand-navy/5 flex flex-col">
                <h3 className="text-lg font-black text-brand-navy mb-4">
                  Tambah Soal Baru
                </h3>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                      Pertanyaan
                    </label>
                    <textarea
                      value={currentManualQuestion}
                      onChange={(e) => setCurrentManualQuestion(e.target.value)}
                      placeholder="Ketik pertanyaan di sini..."
                      className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-brand-orange outline-none font-bold text-brand-navy text-sm resize-none h-24"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1 mb-2 block">
                      Pilihan Jawaban & Kunci
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentManualOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCurrentManualCorrectIdx(idx)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                              currentManualCorrectIdx === idx
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                : "bg-white border-brand-navy/20 text-transparent hover:border-emerald-500"
                            }`}
                          >
                            ✓
                          </button>
                          <input
                            type="text"
                            value={opt}
                            disabled={manualQuizType === "true_false"}
                            onChange={(e) => {
                              const newOpts = [...currentManualOptions];
                              newOpts[idx] = e.target.value;
                              setCurrentManualOptions(newOpts);
                            }}
                            placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                            className={`flex-1 p-3 bg-white border-2 border-transparent rounded-xl focus:border-brand-orange outline-none font-bold text-sm ${
                              currentManualCorrectIdx === idx
                                ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                                : "text-brand-navy"
                            } ${manualQuizType === "true_false" ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!currentManualQuestion.trim())
                      return alert("Pertanyaan tidak boleh kosong");
                    if (currentManualOptions.some((o) => !o.trim()))
                      return alert("Semua pilihan harus diisi");

                    setManualQuestions([
                      ...manualQuestions,
                      {
                        question: currentManualQuestion,
                        options: [...currentManualOptions],
                        correctAnswerIndex: currentManualCorrectIdx,
                      },
                    ]);

                    setCurrentManualQuestion("");
                    if (manualQuizType !== "true_false") {
                      setCurrentManualOptions(["", "", "", ""]);
                    }
                    setCurrentManualCorrectIdx(0);
                  }}
                  className="mt-6 w-full bg-brand-navy/5 text-brand-navy py-4 rounded-2xl font-black text-sm hover:bg-brand-navy/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Tambahkan ke Daftar Soal
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-brand-navy/5 bg-white flex justify-end gap-4">
              <button
                onClick={() => setIsCreatingManualQuiz(false)}
                className="px-6 py-4 rounded-2xl font-black text-sm text-brand-navy/40 hover:bg-brand-cream transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!manualQuizTitle.trim())
                    return alert("Judul kuis harus diisi");
                  if (manualQuestions.length === 0)
                    return alert("Tambahkan minimal 1 soal");
                  if (
                    manualQuizType === "hidden_word" &&
                    (!manualHiddenWord || manualHiddenWord.length < 5)
                  )
                    return alert("Kata rahasia harus 5-10 huruf");

                  const quizData: any = {
                    guruId: userData.uid,
                    subject: userData.subject,
                    title: manualQuizTitle,
                    quizType: manualQuizType,
                    questions: manualQuestions,
                    createdAt: new Date(),
                  };
                  if (manualQuizType === "hidden_word") {
                    quizData.hiddenWord = manualHiddenWord;
                  }

                  try {
                    await addDoc(collection(db, "quizzes"), quizData);
                    await fetchQuizzes();
                    setIsCreatingManualQuiz(false);
                    // Reset state
                    setManualQuizTitle("");
                    setManualQuestions([]);
                    setManualHiddenWord("");
                    setCurrentManualQuestion("");
                    setCurrentManualOptions(["", "", "", ""]);
                    setCurrentManualCorrectIdx(0);
                  } catch (e: any) {
                    alert("Gagal menyimpan kuis: " + e.message);
                  }
                }}
                className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-brand-orange/90 shadow-xl shadow-brand-orange/20 transition-all active:scale-95"
              >
                Simpan Kuis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Material Modal */}
      {isCreatingMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-brand-navy/5 flex justify-between items-center bg-brand-cream/30">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-brand-navy tracking-tight">
                  Tambah Materi Baru
                </h2>
                <p className="text-brand-navy/40 text-[10px] font-black uppercase tracking-widest">
                  Mata Pelajaran: {userData.subject}
                </p>
              </div>
              <button
                onClick={() => setIsCreatingMaterial(false)}
                className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors text-brand-navy/40 hover:text-brand-navy"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                  Judul Materi
                </label>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="Contoh: Pengenalan Algoritma"
                  className={`w-full p-4 bg-brand-cream/50 border-2 rounded-2xl focus:border-brand-orange outline-none font-bold text-brand-navy text-sm mt-2 transition-all ${
                    showMaterialErrors && !materialTitle.trim()
                      ? "border-red-500 bg-red-50"
                      : "border-transparent"
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                  Deskripsi Singkat
                </label>
                <input
                  type="text"
                  value={materialDesc}
                  onChange={(e) => setMaterialDesc(e.target.value)}
                  placeholder="Penjelasan singkat tentang materi ini..."
                  className={`w-full p-4 bg-brand-cream/50 border-2 rounded-2xl focus:border-brand-orange outline-none font-bold text-brand-navy text-sm mt-2 transition-all ${
                    showMaterialErrors && !materialDesc.trim()
                      ? "border-red-500 bg-red-50"
                      : "border-transparent"
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1 mb-2 block">
                  Tipe Materi
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setMaterialType("text")}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      materialType === "text"
                        ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20"
                        : "bg-brand-cream text-brand-navy/40 hover:bg-brand-navy/10"
                    }`}
                  >
                    Teks Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialType("link")}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      materialType === "link"
                        ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20"
                        : "bg-brand-cream text-brand-navy/40 hover:bg-brand-orange/10"
                    }`}
                  >
                    Link Google Drive
                  </button>
                </div>
              </div>

              {materialType === "text" ? (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                    Poin-poin Materi (Roadmap)
                  </label>
                  <div className="space-y-3">
                    {materialPoints.map((point, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-navy text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                          {idx + 1}
                        </div>
                        <textarea
                          value={point}
                          onChange={(e) => {
                            const newPoints = [...materialPoints];
                            newPoints[idx] = e.target.value;
                            setMaterialPoints(newPoints);
                          }}
                          placeholder={`Ketik poin materi ke-${idx + 1}...`}
                          className={`flex-1 p-4 bg-brand-cream/50 border-2 rounded-2xl focus:border-brand-orange outline-none font-medium text-brand-navy text-sm min-h-[80px] resize-none transition-all ${
                            showMaterialErrors && !point.trim()
                              ? "border-red-500 bg-red-50"
                              : "border-transparent"
                          }`}
                        />
                        <button
                          onClick={() => {
                            const newPoints = [...materialPoints];
                            newPoints.splice(idx, 1);
                            setMaterialPoints(newPoints);
                          }}
                          disabled={materialPoints.length === 1}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setMaterialPoints([...materialPoints, ""])}
                    className="w-full py-3 border-2 border-dashed border-brand-navy/10 rounded-2xl text-brand-navy/40 font-black text-[10px] uppercase tracking-widest hover:border-brand-orange hover:text-brand-orange transition-all"
                  >
                    + Tambah Poin Materi
                  </button>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest ml-1">
                    Link Google Drive / Eksternal
                  </label>
                  <input
                    type="url"
                    value={materialLink}
                    onChange={(e) => setMaterialLink(e.target.value)}
                    placeholder="Tempel link Google Drive di sini..."
                    className={`w-full p-4 bg-brand-cream/50 border-2 rounded-2xl focus:border-brand-orange outline-none font-bold text-brand-navy text-sm mt-2 transition-all ${
                      showMaterialErrors && !materialLink.trim()
                        ? "border-red-500 bg-red-50"
                        : "border-transparent"
                    }`}
                  />
                  <p className="mt-2 text-[10px] text-brand-navy/40 font-bold italic">
                    * Pastikan akses link sudah diatur ke &quot;Siapa saja yang
                    memiliki link&quot; di Google Drive.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 border-t border-brand-navy/5 bg-white">
              <button
                onClick={handleCreateMaterial}
                disabled={isUploadingMaterial}
                className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-orange/90 shadow-xl shadow-brand-orange/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isUploadingMaterial ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Materi"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
