import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("../../firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const q = query(collection(db, "users"), where("schoolName", "==", "SMPN 1 Wedi"), where("role", "==", "Siswa"));
  const snapshot = await getDocs(q);
  console.log("Students in SMPN 1 Wedi:", snapshot.docs.length);
  const classes = new Set();
  snapshot.docs.forEach(doc => {
    classes.add(doc.data().studentClass);
  });
  console.log("Classes:", Array.from(classes));
  
  const q2 = query(collection(db, "quizzes"), where("schoolName", "==", "SMPN 1 Wedi"));
  const snap2 = await getDocs(q2);
  console.log("Quizzes in SMPN 1 Wedi:", snap2.docs.length);
  snap2.docs.forEach(doc => {
    console.log("-", doc.data().title, doc.data().subject);
  });
}

check().catch(console.error);
