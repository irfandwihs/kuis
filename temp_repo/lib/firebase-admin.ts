import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

function getAdminApp() {
  if (adminApp) return adminApp;
  
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
    return null;
  }

  try {
    // Handle potential double-escaping or stringified JSON
    let serviceAccount;
    let sanitizedKey = serviceAccountKey.trim();
    
    // Remove leading/trailing quotes if they exist (common mistake in Vercel/Env vars)
    if ((sanitizedKey.startsWith("'") && sanitizedKey.endsWith("'")) || 
        (sanitizedKey.startsWith('"') && sanitizedKey.endsWith('"'))) {
      sanitizedKey = sanitizedKey.substring(1, sanitizedKey.length - 1);
    }
    
    try {
      serviceAccount = JSON.parse(sanitizedKey);
    } catch (e) {
      // If it's not valid JSON, maybe it's double escaped or has literal newlines
      try {
        serviceAccount = JSON.parse(sanitizedKey.replace(/\\n/g, '\n'));
      } catch (e2) {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not a valid JSON string.");
        return null;
      }
    }
    
    if (serviceAccount && serviceAccount.private_key) {
      // Log key info for debugging (SAFE: no full key logged)
      const keyPreview = serviceAccount.private_key.substring(0, 30);
      console.log(`Firebase Admin: Private key found. Preview: ${keyPreview}... Length: ${serviceAccount.private_key.length}`);
      
      // The private key must have actual newlines, not literal "\n" strings
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      
      // Sometimes the key might have escaped quotes at the beginning/end
      if (serviceAccount.private_key.startsWith('"') && serviceAccount.private_key.endsWith('"')) {
        serviceAccount.private_key = serviceAccount.private_key.substring(1, serviceAccount.private_key.length - 1);
      }
    }

    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.error("Service account object is missing required fields (project_id, private_key, client_email).");
      return null;
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return adminApp;
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin:", error.message);
    return null;
  }
}

export const getAdminAuth = () => {
  const app = getAdminApp();
  return app ? admin.auth(app) : null;
};

export const getAdminDb = () => {
  const app = getAdminApp();
  return app ? admin.firestore(app) : null;
};
