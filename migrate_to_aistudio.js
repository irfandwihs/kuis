const admin = require("firebase-admin");
const fs = require("fs");

// 1. Ganti path ini dengan path ke file Service Account Key dari project Firebase LAMA Anda (sumber data)
const sourceServiceAccountPath = "./path-to-your-old-project-service-account.json";

// 2. Ganti path ini dengan path ke file Service Account Key dari project Firebase BARU Anda (tujuan data)
const destServiceAccountPath = "./path-to-your-new-project-service-account.json";

// Inisialisasi Firebase App Sumber (Lama)
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(require(sourceServiceAccountPath))
}, "sourceApp");
const sourceDb = sourceApp.firestore();

// Inisialisasi Firebase App Tujuan (Baru)
const destApp = admin.initializeApp({
  credential: admin.credential.cert(require(destServiceAccountPath))
}, "destApp");
const destDb = destApp.firestore();

async function migrateCollection(collectionName) {
  console.log(`\nMemulai migrasi koleksi: ${collectionName}...`);
  const snapshot = await sourceDb.collection(collectionName).get();
  let count = 0;
  
  for (const document of snapshot.docs) {
    const data = document.data();
    
    // Tambahkan schoolName jika belum ada
    if (!data.schoolName) {
      data.schoolName = "SMPN 1 Wedi";
    }

    // Simpan dokumen ke database tujuan
    await destDb.collection(collectionName).doc(document.id).set(data);
    count++;
    
    // Cek dan migrasi sub-koleksi jika ada (seperti leaderboard di rooms, atau history di users)
    const subcollections = await document.ref.listCollections();
    for (const subcol of subcollections) {
      const subSnapshot = await subcol.get();
      for (const subDoc of subSnapshot.docs) {
        const subData = subDoc.data();
        await destDb.collection(`${collectionName}/${document.id}/${subcol.id}`).doc(subDoc.id).set(subData);
      }
    }
  }
  console.log(`Berhasil memigrasi ${count} dokumen di koleksi ${collectionName}.`);
}

async function run() {
  try {
    // Daftar koleksi yang ingin dimigrasi
    const collections = ["users", "quizzes", "rooms", "materials", "assignments"];
    for (const coll of collections) {
      await migrateCollection(coll);
    }
    console.log("\nMigrasi selesai sepenuhnya!");
    process.exit(0);
  } catch (error) {
    console.error("\nMigrasi gagal:", error);
    process.exit(1);
  }
}

run();
