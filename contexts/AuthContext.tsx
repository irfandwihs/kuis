"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  collection,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
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
  schoolName?: string;
  profileCompleted?: boolean;
  diamonds?: number;
  inventory?: Record<string, number>;
  water?: number;
  treeHeight?: number;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setRole: (
    role: Role,
    subjectOrClass?: string,
    schoolName?: string,
  ) => Promise<void>;
  updateProfile: (data: Partial<UserData>) => Promise<void>;
  buyItem: (itemId: string, price: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unsubscribeUserDoc: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            setUserData(data);

            if (!data.role && pathname !== "/onboarding") {
              router.push("/onboarding");
            } else if (data.role) {
              const isSiswaRoute =
                pathname.startsWith("/siswa") ||
                pathname.startsWith("/room/siswa");
              const isGuruRoute =
                pathname.startsWith("/guru") ||
                pathname.startsWith("/room/guru");

              if (data.role === "Guru" && isSiswaRoute) {
                router.push("/guru");
              } else if (data.role === "Siswa" && isGuruRoute) {
                router.push("/siswa");
              } else if (pathname === "/" || pathname === "/onboarding") {
                router.push(data.role === "Guru" ? "/guru" : "/siswa");
              }
            }
          } else {
            // Document doesn't exist for this UID. Let's check if the email exists under a different random ID
            // (e.g. manually added by admin before the user logged in for the first time)
            if (currentUser.email) {
              const q = query(collection(db, "users"), where("email", "==", currentUser.email));
              getDocs(q).then((snap) => {
                let existingData: any = null;
                let oldDocId: string | null = null;
                
                if (!snap.empty) {
                  // Found pre-existing document for this email
                  existingData = snap.docs[0].data();
                  oldDocId = snap.docs[0].id;
                }

                const newUserData: UserData = {
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: existingData?.displayName || currentUser.displayName,
                  role: existingData?.role || null,
                  subject: existingData?.subject || undefined,
                  schoolName: existingData?.schoolName || undefined,
                  xp: existingData?.xp || 0,
                  diamonds: existingData?.diamonds || 0,
                  quizzesPlayed: existingData?.quizzesPlayed || 0,
                  avatar: existingData?.avatar || "0",
                  inventory: existingData?.inventory || {},
                };

                // Save to the new correct UID document
                setDoc(userDocRef, newUserData).then(() => {
                  // Delete the old orphan document if it existed
                  if (oldDocId) {
                    deleteDoc(doc(db, "users", oldDocId)).catch(console.error);
                    // We should also theoretically update rooms/quizzes guruId here, 
                    // but usually pre-registered accounts haven't created content yet.
                  }
                });

                setUserData(newUserData);
                if (!newUserData.role && pathname !== "/onboarding") {
                  router.push("/onboarding");
                } else if (newUserData.role && pathname === "/") {
                  router.push(newUserData.role === "Guru" ? "/guru" : "/siswa");
                }
              }).catch(err => {
                console.error("Error finding duplicate accounts:", err);
              });
            } else {
               // Fallback if no email (e.g. anonymous)
               const newUserData: UserData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                role: null,
                xp: 0,
                diamonds: 0,
                quizzesPlayed: 0,
                avatar: "0",
                inventory: {},
              };
              setDoc(userDocRef, newUserData);
              setUserData(newUserData);
              if (pathname !== "/onboarding") {
                router.push("/onboarding");
              }
            }
          }
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
        if (pathname !== "/") {
          router.push("/");
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, [router, pathname]);

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

  const setRole = async (
    role: Role,
    subjectOrClass?: string,
    schoolName?: string,
  ) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const updatedData: Partial<UserData> = { role };
    if (role === "Guru" && subjectOrClass) {
      updatedData.subject = subjectOrClass;
    } else if (role === "Siswa" && subjectOrClass) {
      updatedData.studentClass = subjectOrClass;
    }
    if (schoolName) {
      updatedData.schoolName = schoolName;
    }
    await setDoc(userDocRef, updatedData, { merge: true });
    setUserData((prev) => (prev ? { ...prev, ...updatedData } : null));
    router.push(role === "Guru" ? "/guru" : "/siswa");
  };

  const updateProfile = async (data: Partial<UserData>) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(
      userDocRef,
      { ...data, profileCompleted: true },
      { merge: true },
    );
    setUserData((prev) =>
      prev ? { ...prev, ...data, profileCompleted: true } : null,
    );
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
      inventory: newInventory,
    });

    setUserData((prev) =>
      prev
        ? {
            ...prev,
            diamonds: (prev.diamonds || 0) - price,
            inventory: newInventory,
          }
        : null,
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInWithGoogle,
        logout,
        setRole,
        updateProfile,
        buyItem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
