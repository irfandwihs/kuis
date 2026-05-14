import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Starting cleanup and migration...");
  
  // 1. Delete Dummy Data
  const classes = ["8A", "8B", "8C", "8D", "8E", "8F", "8G", "8H"];
  for (const cls of classes) {
    for (let i = 1; i <= 5; i++) {
      try {
        await deleteDoc(doc(db, "users", `student_${cls}_${i}`));
      } catch (e) {}
    }
  }
  try { await deleteDoc(doc(db, "quizzes", "quiz_info_1")); } catch (e) {}
  
  for (let i = 1; i <= 5; i++) {
    try { await deleteDoc(doc(db, "rooms", "room_info_1", "leaderboard", `student_8A_${i}`)); } catch (e) {}
  }
  try { await deleteDoc(doc(db, "rooms", "room_info_1")); } catch (e) {}
  
  console.log("Dummy data deleted.");

  // 2. Migrate existing data to have schoolName
  const collectionsToMigrate = ["users", "quizzes", "rooms", "materials", "assignments"];
  for (const collName of collectionsToMigrate) {
    const snap = await getDocs(collection(db, collName));
    let count = 0;
    for (const d of snap.docs) {
      if (!d.data().schoolName) {
        await updateDoc(doc(db, collName, d.id), { schoolName: "SMPN 1 Wedi" });
        count++;
      }
    }
    console.log(`Migrated ${count} documents in ${collName} to have schoolName: "SMPN 1 Wedi"`);
  }
  console.log("Migration complete.");
}

run().catch(console.error);
