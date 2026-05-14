import admin from "firebase-admin";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// 1. Initialize External Firebase (Source)
const serviceAccount = JSON.parse(fs.readFileSync("./studylab-a77e6-firebase-adminsdk-fbsvc-e94e64c043.json", "utf-8"));
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}, "sourceApp");
const sourceDb = sourceApp.firestore();

// 2. Initialize AI Studio Firebase (Destination)
const destConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const destApp = initializeApp(destConfig);
const destDb = getFirestore(destApp, destConfig.firestoreDatabaseId);

async function migrateCollection(collectionName) {
  console.log(`Migrating collection: ${collectionName}...`);
  const snapshot = await sourceDb.collection(collectionName).get();
  let count = 0;
  
  for (const document of snapshot.docs) {
    const data = document.data();
    
    // Add schoolName if it doesn't exist
    if (!data.schoolName) {
      data.schoolName = "SMPN 1 Wedi";
    }

    // Convert Firestore Timestamps from Admin SDK to Client SDK format
    // Admin SDK uses _seconds and _nanoseconds, Client SDK uses seconds and nanoseconds
    // Actually, we can just save them as is, or reconstruct them.
    // Let's just pass the data, setDoc handles basic objects.
    // But we need to be careful with Timestamps.
    for (const key in data) {
      if (data[key] && typeof data[key] === 'object' && '_seconds' in data[key] && '_nanoseconds' in data[key]) {
        data[key] = new Date(data[key]._seconds * 1000 + data[key]._nanoseconds / 1000000);
      }
    }

    await setDoc(doc(destDb, collectionName, document.id), data);
    count++;
    
    // Check for subcollections
    const subcollections = await document.ref.listCollections();
    for (const subcol of subcollections) {
      const subSnapshot = await subcol.get();
      for (const subDoc of subSnapshot.docs) {
        const subData = subDoc.data();
        for (const key in subData) {
          if (subData[key] && typeof subData[key] === 'object' && '_seconds' in subData[key] && '_nanoseconds' in subData[key]) {
            subData[key] = new Date(subData[key]._seconds * 1000 + subData[key]._nanoseconds / 1000000);
          }
        }
        await setDoc(doc(destDb, `${collectionName}/${document.id}/${subcol.id}`, subDoc.id), subData);
      }
    }
  }
  console.log(`Migrated ${count} documents in ${collectionName}.`);
}

async function run() {
  try {
    const collections = ["users", "quizzes", "rooms", "materials", "assignments"];
    for (const coll of collections) {
      await migrateCollection(coll);
    }
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
