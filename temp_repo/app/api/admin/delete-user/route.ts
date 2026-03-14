import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

const ADMIN_EMAIL = "irfandwi.hs@gmail.com";

export async function POST(request: Request) {
  try {
    const auth = getAdminAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized. Please set FIREBASE_SERVICE_ACCOUNT_KEY.' }, { status: 500 });
    }

    const { uid, idToken } = await request.json();

    if (!uid || !idToken) {
      return NextResponse.json({ error: 'Missing uid or idToken' }, { status: 400 });
    }

    // Verify the requester is the admin
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (verifyError: any) {
      console.error('Error verifying ID token:', verifyError);
      return NextResponse.json({ 
        error: `Gagal memverifikasi token admin: ${verifyError.message}. Ini biasanya terjadi jika FIREBASE_SERVICE_ACCOUNT_KEY salah atau kadaluwarsa.` 
      }, { status: 401 });
    }
    
    if (decodedToken.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized: Email tidak terdaftar sebagai admin.' }, { status: 403 });
    }

    // Delete the user from Authentication
    try {
      await auth.deleteUser(uid);
    } catch (deleteError: any) {
      console.error('Error deleting user from Auth:', deleteError);
      return NextResponse.json({ 
        error: `Gagal menghapus user dari Authentication: ${deleteError.message}. Periksa apakah Service Account memiliki izin 'Firebase Authentication Admin'.` 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user from Auth:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
