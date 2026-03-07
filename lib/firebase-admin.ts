import * as admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Admin features will be limited.");
    return null;
  }

  console.log("FIREBASE_SERVICE_ACCOUNT_KEY detected, length:", serviceAccountKey.length);

  try {
    // Handle potential double-escaping of newlines in Vercel
    const sanitizedKey = serviceAccountKey.replace(/\\n/g, '\n');
    const serviceAccount = JSON.parse(sanitizedKey);
    
    // Ensure the private key has correct newline characters
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin:", error.message);
    // If JSON.parse failed, try parsing the original key without sanitization
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (innerError: any) {
      console.error("Final attempt to initialize Firebase Admin failed:", innerError.message);
      return null;
    }
  }
}

const app = getAdminApp();

export const adminAuth = app ? admin.auth(app) : null;
export const adminDb = app ? admin.firestore(app) : null;
