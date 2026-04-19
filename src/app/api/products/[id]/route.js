import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/products/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    return NextResponse.json({ product: data });
  } catch (err) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// PUT /api/products/[id] — update (admin only)
export async function PUT(request, { params }) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      nombreProducto,
      descripcionProducto,
      precioProducto,
      cantidadProducto,
      categoriaProducto,
      imagenProducto,
    } = body;

    const { data, error } = await supabaseAdmin
      .from('productos')
      .update({
        nombreProducto,
        descripcionProducto,
        precioProducto: parseFloat(precioProducto),
        cantidadProducto: parseInt(cantidadProducto),
        categoriaProducto,
        imagenProducto,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data });
  } catch (err) {
    console.error('PUT /api/products/[id] error:', err);
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

// DELETE /api/products/[id] (admin only)
export async function DELETE(request, { params }) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await params;

    // Also delete image from Supabase Storage if it exists
    const { data: product } = await supabaseAdmin
      .from('productos')
      .select('imagenProducto')
      .eq('id', id)
      .single();

    if (product?.imagenProducto) {
      const urlParts = product.imagenProducto.split('/product-images/');
      if (urlParts.length > 1) {
        await supabaseAdmin.storage.from('product-images').remove([urlParts[1]]);
      }
    }

    const { error } = await supabaseAdmin.from('productos').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/products/[id] error:', err);
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
