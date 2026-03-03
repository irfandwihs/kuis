import * as admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback to default if running on Google Cloud with right permissions
    try {
      return admin.initializeApp();
    } catch (e) {
      console.warn("Firebase Admin fallback initialization failed. Authentication deletion will not work until FIREBASE_SERVICE_ACCOUNT_KEY is set.");
      return null;
    }
  }
}

const app = getAdminApp();

export const adminAuth = app ? admin.auth(app) : null;
export const adminDb = app ? admin.firestore(app) : null;
