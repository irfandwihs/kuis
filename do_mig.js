import { initializeApp as initAdminApp, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { initializeApp as initClientApp } from "firebase/app";
import { getFirestore as getClientFirestore, doc, setDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import fs from "fs";

// Source
const sourceKey = JSON.parse(fs.readFileSync("./source_key.json", "utf-8"));
const sourceApp = initAdminApp({ credential: cert(sourceKey) }, "source");
const sourceDb = getAdminFirestore(sourceApp);

// Destination
const destConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const destApp = initClientApp(destConfig);
const destDb = getClientFirestore(destApp, destConfig.firestoreDatabaseId);

// Converter for timestamps
function convertData(data) {
    if (!data) return data;
    const newData = {};
    for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
            newData[key] = value.toDate(); // JS Date works for client SDK
        } else if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
            newData[key] = convertData(value);
        } else if (Array.isArray(value)) {
            newData[key] = value.map(v => typeof v === 'object' && v && v.toDate ? v.toDate() : (typeof v === 'object' && v !== null ? convertData(v) : v));
        } else {
            newData[key] = value;
        }
    }
    return newData;
}

async function migrate() {
    const collections = ["users", "quizzes", "rooms", "materials", "assignments"];
    
    for (const coll of collections) {
        console.log(`Migrating ${coll}...`);
        const snapshot = await sourceDb.collection(coll).get();
        let count = 0;
        
        for (const adminDoc of snapshot.docs) {
            let data = convertData(adminDoc.data());
            
            // Add schoolName if missing
            if (!data.schoolName) {
                data.schoolName = "SMPN 1 Wedi";
            }
            
            await setDoc(doc(destDb, coll, adminDoc.id), data);
            count++;
            
            // Subcollections
            const subcollections = await adminDoc.ref.listCollections();
            for (const subcol of subcollections) {
                const subSnap = await subcol.get();
                let subCount = 0;
                for (const subDoc of subSnap.docs) {
                    let subData = convertData(subDoc.data());
                    await setDoc(doc(destDb, `${coll}/${adminDoc.id}/${subcol.id}`, subDoc.id), subData);
                    subCount++;
                }
                if (subCount > 0) {
                    console.log(`  - Migrated ${subCount} docs in subcollection ${coll}/${adminDoc.id}/${subcol.id}`);
                }
            }
        }
        console.log(`Done ${coll}: ${count} docs`);
    }
    console.log("MIGRATION COMPLETE");
    process.exit(0);
}

migrate().catch(console.error);
