import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function GET() {
  const auth = getAdminAuth();
  return NextResponse.json({ 
    initialized: !!auth 
  });
}
