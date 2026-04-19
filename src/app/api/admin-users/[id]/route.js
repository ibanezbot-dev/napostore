import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthFromRequest } from '@/lib/auth';

// PUT /api/admin-users/[id] — update password (admin only)
export async function PUT(request, { params }) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await params;
    const { password, username } = await request.json();

    const updateData = {};

    if (username) {
      updateData.username = username;
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error('PUT /api/admin-users/[id] error:', err);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE /api/admin-users/[id] (admin only, cannot delete self)
export async function DELETE(request, { params }) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await params;

    // Prevent self-deletion
    if (String(auth.id) === String(id)) {
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('admin_users').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin-users/[id] error:', err);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
