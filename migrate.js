import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function migrateData() {
  const collectionsToUpdate = ["users", "quizzes", "rooms", "materials", "assignments"];
  
  for (const collName of collectionsToUpdate) {
    console.log(`Updating collection: ${collName}`);
    try {
      const querySnapshot = await getDocs(collection(db, collName));
      let count = 0;
      for (const document of querySnapshot.docs) {
        await updateDoc(doc(db, collName, document.id), {
          school: "SMPN 1 Wedi"
        });
        count++;
      }
      console.log(`Updated ${count} documents in ${collName}`);
    } catch (e) {
      console.error(`Error updating ${collName}:`, e);
    }
  }
  console.log("Migration complete.");
  process.exit(0);
}

migrateData();
