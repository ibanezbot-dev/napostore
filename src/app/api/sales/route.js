import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/sales — list all sales (admin only)
export async function GET(request) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from('ventas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ sales: data });
  } catch (err) {
    console.error('GET /api/sales error:', err);
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 });
  }
}

// POST /api/sales — register a sale and decrement stock (admin only)
export async function POST(request) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { productoId, cantidad, notas } = await request.json();

    if (!productoId || !cantidad || cantidad < 1) {
      return NextResponse.json({ error: 'Producto y cantidad son requeridos' }, { status: 400 });
    }

    // Fetch current product
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('productos')
      .select('*')
      .eq('id', productoId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (product.cantidadProducto < cantidad) {
      return NextResponse.json({
        error: `Stock insuficiente. Solo hay ${product.cantidadProducto} unidades disponibles.`,
      }, { status: 400 });
    }

    const nuevoStock = product.cantidadProducto - cantidad;

    // Decrement stock
    const { error: updateError } = await supabaseAdmin
      .from('productos')
      .update({ cantidadProducto: nuevoStock })
      .eq('id', productoId);

    if (updateError) throw updateError;

    // Insert sale record
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('ventas')
      .insert([{
        producto_id: productoId,
        nombreProducto: product.nombreProducto,
        cantidad,
        precioUnitario: product.precioProducto,
        total: product.precioProducto * cantidad,
        notas: notas || '',
        stockRestante: nuevoStock,
      }])
      .select()
      .single();

    if (saleError) throw saleError;

    return NextResponse.json({
      sale,
      stockRestante: nuevoStock,
      sinStock: nuevoStock === 0,
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/sales error:', err);
    return NextResponse.json({ error: 'Error al registrar venta' }, { status: 500 });
  }
}
