import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/products — list all products with optional search and category filter
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    let query = supabaseAdmin.from('productos').select('*').order('created_at', { ascending: false });

    if (search) {
      query = query.or(
        `nombreProducto.ilike.%${search}%,descripcionProducto.ilike.%${search}%`
      );
    }

    if (category && category !== 'all') {
      query = query.eq('categoriaProducto', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ products: data });
  } catch (err) {
    console.error('GET /api/products error:', err);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

// POST /api/products — create a product (admin only)
export async function POST(request) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      nombreProducto,
      descripcionProducto,
      precioProducto,
      cantidadProducto,
      categoriaProducto,
      imagenProducto,
    } = body;

    if (!nombreProducto || precioProducto === undefined) {
      return NextResponse.json({ error: 'Nombre y precio son requeridos' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('productos')
      .insert([
        {
          nombreProducto,
          descripcionProducto: descripcionProducto || '',
          precioProducto: parseFloat(precioProducto),
          cantidadProducto: parseInt(cantidadProducto) || 0,
          categoriaProducto: categoriaProducto || '',
          imagenProducto: imagenProducto || '',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/products error:', err);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
