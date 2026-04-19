import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/admin-users — list all admin users (admin only)
export async function GET(request) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ users: data });
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

// POST /api/admin-users — Crea un nuevo administrador (Solo Admin)
// ============================================================================
// Endpoint para gestionar la creación de usuarios con permisos de admin.
// ============================================================================
export async function POST(request) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    // Seguridad: Hasheo de contraseña antes de guardarla en la base de datos
    const password_hash = await bcrypt.hash(password, 12);

    // INSERCIÓN EN LA BD
    // Se inserta en la tabla 'admin_users' el usuario junto con la contraseña cifrada.
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .insert([{ username, password_hash }]) // Se manda la contraseña ya convertida en Hash
      .select('id, username, created_at')    // Explicitamente seleccionamos NO DEVOLVER el hash de vuelta, solo estos 3 campos.
      .single();

    if (error) {
      // Manejo del error de violación de restricción UNIQUE de PostgreSQL (código '23505')
      if (error.code === '23505') {
        return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin-users error:', err);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
