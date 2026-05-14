import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const collections = ["users", "quizzes", "rooms", "materials", "assignments"];
  for (const coll of collections) {
    const snap = await getDocs(collection(db, coll));
    console.log(`${coll}: ${snap.docs.length} documents`);
    if (snap.docs.length > 0) {
      console.log(`Sample from ${coll}:`, snap.docs[0].data());
    }
  }
}

check().catch(console.error);
