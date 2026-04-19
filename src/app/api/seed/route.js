import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

// This endpoint seeds the initial admin user if no admins exist.
// Call it once during setup: GET /api/seed
export async function GET() {
  try {
    const { data: existing } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'El admin ya existe, seed omitido' });
    }

    const password_hash = await bcrypt.hash('FaustoNap3405', 12);

    const { error } = await supabaseAdmin.from('admin_users').insert([
      { username: 'NapoStoreAdmin', password_hash },
    ]);

    if (error) throw error;

    return NextResponse.json({ message: 'Admin inicial creado correctamente' });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: 'Error en seed' }, { status: 500 });
  }
}
