"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export type Role = "Guru" | "Siswa" | "Umum" | null;

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  subject?: string;
  xp?: number;
  quizzesPlayed?: number;
  avatar?: string;
  studentClass?: string;
  studentAbsen?: string;
  profileCompleted?: boolean;
  diamonds?: number;
  inventory?: Record<string, number>;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: Role, subjectOrClass?: string) => Promise<void>;
  updateProfile: (data: Partial<UserData>) => Promise<void>;
  buyItem: (itemId: string, price: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check for primary account binding
        const primaryUid = localStorage.getItem("aksaraplay_primary_uid");
        if (primaryUid && primaryUid !== currentUser.uid && !isSwitchingAccount) {
          setPendingUser(currentUser);
          setIsSwitchingAccount(true);
          setLoading(false);
          return;
        }

        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        
        // Use onSnapshot for real-time updates
        unsubscribeSnapshot = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
            
            if (!data.role && pathname !== "/onboarding") {
              router.push("/onboarding");
            } else if (data.role) {
              const isSiswaRoute = pathname.startsWith("/siswa") || pathname.startsWith("/room/siswa");
              const isGuruRoute = pathname.startsWith("/guru") || pathname.startsWith("/room/guru");
              const isSiswaRole = data.role === "Siswa" || data.role === "Umum";

              if (data.role === "Guru" && isSiswaRoute) {
                router.push("/guru");
              } else if (isSiswaRole && isGuruRoute) {
                router.push("/siswa");
              } else if (pathname === "/" || pathname === "/onboarding") {
                router.push(data.role === "Guru" ? "/guru" : "/siswa");
              }
            }
          } else {
            // New user, create empty doc
            const newUserData: UserData = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: null,
              xp: 0,
              diamonds: 0,
              quizzesPlayed: 0,
              avatar: "0",
              inventory: {}
            };
            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
            if (pathname !== "/onboarding") {
              router.push("/onboarding");
            }
          }
          setLoading(false);
        });
      } else {
        setUserData(null);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
        if (pathname !== "/") {
          router.push("/");
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [router, pathname, isSwitchingAccount]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const setRole = async (role: Role, subjectOrClass?: string) => {
    if (!user) return;
    
    // Bind this account as primary on this device
    localStorage.setItem("aksaraplay_primary_uid", user.uid);
    localStorage.setItem("aksaraplay_primary_email", user.email || "");

    const userDocRef = doc(db, "users", user.uid);
    const updatedData: Partial<UserData> = { role };
    if (role === "Guru" && subjectOrClass) {
      updatedData.subject = subjectOrClass;
    } else if (role === "Siswa" && subjectOrClass) {
      updatedData.studentClass = subjectOrClass;
    }
    await setDoc(userDocRef, updatedData, { merge: true });
    setUserData((prev) => prev ? { ...prev, ...updatedData } : null);
    router.push(role === "Guru" ? "/guru" : "/siswa");
  };

  const updateProfile = async (data: Partial<UserData>) => {
    if (!user) return;

    // If updating student class/absen, check for uniqueness
    let finalRole = userData?.role;
    if (data.studentClass && data.studentAbsen && userData?.role === "Siswa") {
      const q = query(
        collection(db, "users"),
        where("studentClass", "==", data.studentClass),
        where("studentAbsen", "==", data.studentAbsen),
        limit(1)
      );
      const snapshot = await getDocs(q);
      const duplicate = snapshot.docs.find(doc => doc.id !== user.uid);
      
      if (duplicate) {
        // Class/Absen already taken by another email, downgrade to 'Umum'
        finalRole = "Umum";
      }
    }

    const userDocRef = doc(db, "users", user.uid);
    const updatePayload = { ...data, profileCompleted: true };
    if (finalRole !== userData?.role) {
      (updatePayload as any).role = finalRole;
    }

    await setDoc(userDocRef, updatePayload, { merge: true });
    setUserData((prev) => prev ? { ...prev, ...data, role: finalRole as Role, profileCompleted: true } : null);
  };

  const buyItem = async (itemId: string, price: number) => {
    if (!user || !userData) return;
    const currentDiamonds = userData.diamonds || 0;
    if (currentDiamonds < price) throw new Error("Diamond tidak cukup!");

    const userDocRef = doc(db, "users", user.uid);
    const newInventory = { ...(userData.inventory || {}) };
    newInventory[itemId] = (newInventory[itemId] || 0) + 1;

    await updateDoc(userDocRef, {
      diamonds: increment(-price),
      inventory: newInventory
    });

    setUserData(prev => prev ? {
      ...prev,
      diamonds: (prev.diamonds || 0) - price,
      inventory: newInventory
    } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      signInWithGoogle, 
      logout, 
      setRole, 
      updateProfile, 
      buyItem 
    }}>
      {children}
      
      {/* Account Switch Warning Modal */}
      {isSwitchingAccount && pendingUser && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl border-4 border-brand-orange">
            <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-brand-navy mb-2">Akun Berbeda Terdeteksi</h3>
            <p className="text-brand-navy/60 text-sm mb-6 font-medium">
              Anda sebelumnya menggunakan akun <span className="text-brand-navy font-bold">{localStorage.getItem("aksaraplay_primary_email")}</span> di perangkat ini. 
              Gunakan akun yang sama untuk melanjutkan petualangan Anda!
            </p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  await signOut(auth);
                  setIsSwitchingAccount(false);
                  setPendingUser(null);
                  signInWithGoogle();
                }}
                className="w-full bg-brand-orange text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-orange/20 active:scale-95 transition-all"
              >
                Gunakan Akun Utama
              </button>
              <button
                onClick={() => {
                  setUser(pendingUser);
                  setIsSwitchingAccount(false);
                  setPendingUser(null);
                  // Update primary account to this new one
                  localStorage.setItem("aksaraplay_primary_uid", pendingUser.uid);
                  localStorage.setItem("aksaraplay_primary_email", pendingUser.email || "");
                }}
                className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm"
              >
                Tetap Gunakan Akun Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
