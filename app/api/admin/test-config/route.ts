import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const auth = getAdminAuth();
    if (!auth) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin SDK not initialized. FIREBASE_SERVICE_ACCOUNT_KEY might be missing or invalid JSON.' 
      });
    }

    // Try a simple operation to verify the credential
    // We'll just try to get a user that doesn't exist or just list 1 user
    try {
      await auth.listUsers(1);
      return NextResponse.json({ 
        success: true, 
        message: 'Firebase Admin SDK is correctly configured and authenticated.' 
      });
    } catch (authError: any) {
      console.error('Firebase Admin Auth Test Error:', authError);
      return NextResponse.json({ 
        success: false, 
        error: authError.message,
        code: authError.code,
        details: 'The Service Account Key was accepted by the SDK, but failed to authenticate with Google servers. This usually means the private_key is invalid or the project_id is wrong.'
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
