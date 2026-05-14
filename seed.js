import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, Timestamp } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const GURU_ID = "TRAQpeRJejZZ4PL3QHSsI72nwPo1"; // The existing guru

async function seed() {
  console.log("Seeding data...");
  const classes = ["8A", "8B", "8C", "8D", "8E", "8F", "8G", "8H"];
  
  // Create students
  for (const cls of classes) {
    for (let i = 1; i <= 5; i++) {
      const studentId = `student_${cls}_${i}`;
      await setDoc(doc(db, "users", studentId), {
        displayName: `Siswa ${i} Kelas ${cls}`,
        email: `siswa${i}.${cls.toLowerCase()}@smpn1wedi.sch.id`,
        role: "Siswa",
        schoolName: "SMPN 1 Wedi",
        studentClass: cls,
        studentAbsen: i.toString(),
        xp: Math.floor(Math.random() * 1000),
        diamonds: Math.floor(Math.random() * 100),
        water: Math.floor(Math.random() * 50),
        treeHeight: Math.floor(Math.random() * 20),
        inventory: {},
        createdAt: Timestamp.now()
      });
    }
    console.log(`Seeded students for class ${cls}`);
  }

  // Create some quizzes
  const quiz1Id = "quiz_info_1";
  await setDoc(doc(db, "quizzes", quiz1Id), {
    guruId: GURU_ID,
    schoolName: "SMPN 1 Wedi",
    subject: "Informatika",
    title: "Pengenalan Jaringan Komputer",
    quizType: "multiple_choice",
    questions: [
      {
        question: "Apa kepanjangan dari LAN?",
        options: ["Local Area Network", "Large Area Network", "Long Area Network", "Light Area Network"],
        correctAnswerIndex: 0,
        type: "multiple_choice"
      },
      {
        question: "Perangkat yang digunakan untuk menghubungkan beberapa komputer dalam satu jaringan lokal adalah...",
        options: ["Modem", "Switch", "Router", "Repeater"],
        correctAnswerIndex: 1,
        type: "multiple_choice"
      }
    ],
    createdAt: Timestamp.now()
  });
  console.log("Seeded quiz 1");

  // Create some rooms and leaderboard
  const room1Id = "room_info_1";
  await setDoc(doc(db, "rooms", room1Id), {
    roomCode: "INF001",
    quizId: quiz1Id,
    quizTitle: "Pengenalan Jaringan Komputer",
    guruId: GURU_ID,
    schoolName: "SMPN 1 Wedi",
    targetClass: "8A",
    status: "finished",
    createdAt: Timestamp.now()
  });
  
  // Add leaderboard for room 1
  for (let i = 1; i <= 5; i++) {
    const studentId = `student_8A_${i}`;
    await setDoc(doc(db, "rooms", room1Id, "leaderboard", studentId), {
      displayName: `Siswa ${i} Kelas 8A`,
      score: Math.floor(Math.random() * 100),
      completedAt: Timestamp.now()
    });
  }
  console.log("Seeded room 1 and leaderboard");

  console.log("Seeding complete!");
}

seed().catch(console.error);
