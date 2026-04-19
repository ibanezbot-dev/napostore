import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, username: auth.username });
}
