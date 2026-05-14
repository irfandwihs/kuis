import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const q = collection(db, "users");
  const snapshot = await getDocs(q);
  console.log("Total Users:", snapshot.docs.length);
  snapshot.docs.forEach(doc => {
    console.log("-", doc.id, doc.data().role, doc.data().schoolName, doc.data().subject);
  });
}

check().catch(console.error);
