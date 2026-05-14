import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkUsers() {
  const q = query(collection(db, "users"), where("email", "==", "irfandwi.hs@gmail.com"));
  const snapshot = await getDocs(q);
  console.log("Found users:", snapshot.docs.length);
  snapshot.docs.forEach(doc => {
    console.log(`\nUID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

checkUsers().catch(console.error);
