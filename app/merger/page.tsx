"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";

export default function MergerPage() {
  const { user } = useAuth();
  const [duplicateAccounts, setDuplicateAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const findDuplicates = async () => {
    if (!user?.email) return;
    setLoading(true);
    addLog(`Mencari akun dengan email: ${user.email}`);
    try {
      const q = query(collection(db, "users"), where("email", "==", user.email));
      const snap = await getDocs(q);
      const accounts = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
      setDuplicateAccounts(accounts);
      addLog(`Ditemukan ${accounts.length} akun dengan email tersebut.`);
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.email) {
      findDuplicates();
    }
  }, [user?.email]);

  const doMerge = async () => {
    if (!user) return;
    setLoading(true);
    addLog("--- Memulai Proses Merger ---");
    
    // Auth ID is the main one
    const mainId = user.uid;
    const others = duplicateAccounts.filter(a => a.docId !== mainId);
    
    if (others.length === 0) {
      addLog("Tidak ada akun duplikat untuk di-merger.");
      setLoading(false);
      return;
    }

    try {
      const mainAcc = duplicateAccounts.find(a => a.docId === mainId) || { docId: mainId, email: user.email };
      let mergedData = { ...mainAcc };

      // Reconcile user data
      for (const other of others) {
        if (!mergedData.role && other.role) mergedData.role = other.role;
        if (!mergedData.schoolName && other.schoolName) mergedData.schoolName = other.schoolName;
        if (!mergedData.subject && other.subject) mergedData.subject = other.subject;
        if ((other.xp || 0) > (mergedData.xp || 0)) mergedData.xp = other.xp; 
        addLog(`Memindahkan data dasar dari DOC: ${other.docId}`);
      }

      // Update main doc
      await setDoc(doc(db, "users", mainId), mergedData, { merge: true });
      addLog(`Data profil utama diperbarui (UID: ${mainId}).`);

      // Update references in quizzes
      for (const other of others) {
        addLog(`Mencari kuis milik ${other.docId}...`);
        const qzQ = query(collection(db, "quizzes"), where("guruId", "==", other.docId));
        const qzSnap = await getDocs(qzQ);
        if (qzSnap.docs.length > 0) {
          const batch = writeBatch(db);
          qzSnap.docs.forEach(d => {
            batch.update(doc(db, "quizzes", d.id), { guruId: mainId });
          });
          await batch.commit();
          addLog(`${qzSnap.docs.length} Kuis dipindahkan ke akun utama.`);
        }

        addLog(`Mencari ruangan milik ${other.docId}...`);
        const rmQ = query(collection(db, "rooms"), where("guruId", "==", other.docId));
        const rmSnap = await getDocs(rmQ);
        if (rmSnap.docs.length > 0) {
          const batch = writeBatch(db);
          rmSnap.docs.forEach(d => {
            batch.update(doc(db, "rooms", d.id), { guruId: mainId, hostId: mainId });
          });
          await batch.commit();
          addLog(`${rmSnap.docs.length} Ruangan dipindahkan ke akun utama.`);
        }

        // Delete duplicate user doc
        await deleteDoc(doc(db, "users", other.docId));
        addLog(`Menghapus dokumen duplikat: ${other.docId}`);
      }

      addLog("--- MERGER SELESAI ---");
      findDuplicates(); // refresh
    } catch (err: any) {
      addLog(`Error saat merger: ${err.message}`);
    }
    setLoading(false);
  };

  if (!user) return <div className="p-10">Harap login...</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Penggabungan Akun (Merge)</h1>
        <p className="mb-4">Email Anda: <strong>{user.email}</strong></p>
        
        {duplicateAccounts.length > 1 && (
          <div className="bg-amber-100 text-amber-800 p-4 rounded-xl mb-6">
            Peringatan: Ditemukan <strong>{duplicateAccounts.length}</strong> akun dengan email ini di database!
          </div>
        )}

        {duplicateAccounts.map((acc, i) => (
          <div key={acc.docId} className={`p-4 border rounded-xl mb-3 ${acc.docId === user.uid ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
            <p><strong>Database ID:</strong> {acc.docId} {acc.docId === user.uid && <span className="text-green-600 text-xs font-bold">(Akun Aktif Login)</span>}</p>
            <p>Role: {acc.role || 'Belum di-set'}</p>
            <p>Sekolah: {acc.schoolName || '-'}</p>
            <p>XP: {acc.xp || 0}</p>
          </div>
        ))}

        <button 
          onClick={doMerge}
          disabled={loading || duplicateAccounts.length <= 1}
          className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Klik untuk Gabungkan Akun Sekarang"}
        </button>

        {log.length > 0 && (
          <div className="mt-8 bg-black text-green-400 font-mono text-xs p-4 rounded-xl h-64 overflow-y-auto">
            {log.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
