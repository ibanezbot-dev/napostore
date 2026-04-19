import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 });
    }

    // Fetch admin user from DB
    const { data: adminUser, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !adminUser) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Sign JWT
    const token = await signToken({ id: adminUser.id, username: adminUser.username });

    // Set cookie
    const response = NextResponse.json({ ok: true, username: adminUser.username });
    response.cookies.set('napostore_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
