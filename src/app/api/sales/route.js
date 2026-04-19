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

// POST /api/sales — Registra una venta manual y DECREMENTA el stock (Solo Admin)
// ============================================================================
// Este endpoint es crucial. Implementa la lógica transaccional de ventas:
// 1. Busca el producto en BD.
// 2. Comprueba si hay suficiente Stock (cantidadProducto).
// 3. Reduce el stock (UPDATE).
// 4. Guarda el registro de la venta (INSERT).
// ============================================================================
export async function POST(request) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { productoId, cantidad, notas } = await request.json();

    if (!productoId || !cantidad || cantidad < 1) {
      return NextResponse.json({ error: 'Producto y cantidad son requeridos' }, { status: 400 });
    }

    // PASO 1 y 2: LECTURA DEL PRODUCTO EN LA BD
    // Consultamos el registro específico del producto para saber cuál es su stock actual
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('productos')
      .select('*')
      .eq('id', productoId) // Cláusula WHERE id = productoId
      .single();            // Esperamos un solo registro

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // VALIDACIÓN DE NEGOCIO: ¿Tenemos inventario para soportar la venta?
    if (product.cantidadProducto < cantidad) {
      return NextResponse.json({
        error: `Stock insuficiente. Solo hay ${product.cantidadProducto} unidades disponibles.`,
      }, { status: 400 });
    }

    // Calculamos el nuevo valor del stock (en memoria)
    const nuevoStock = product.cantidadProducto - cantidad;

    // PASO 3: DECREMENTAR EL STOCK EN LA BASE DE DATOS (UPDATE)
    // Actualizamos la tabla 'productos' reemplazando 'cantidadProducto' por el nuevo valor.
    const { error: updateError } = await supabaseAdmin
      .from('productos')
      .update({ cantidadProducto: nuevoStock })
      .eq('id', productoId); // MUY IMPORTANTE: El '.eq()' es el WHERE, evita que se actualicen todos los productos!!!

    if (updateError) throw updateError; // Corta la ejecución si falla el Update.

    // PASO 4: INSERTAR EL REGISTRO DE VENTA (HISTORIAL)
    // Creamos la entrada en la tabla 'ventas' a modo de log comercial (con cálculos de totales)
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('ventas')
      .insert([{
        producto_id: productoId, // Foreign Key lógica
        nombreProducto: product.nombreProducto, // Snapshot histórico del nombre
        cantidad, // Cantidad vendida
        precioUnitario: product.precioProducto, // Precio congelado al momento de venta
        total: product.precioProducto * cantidad, // Valor en caja generado
        notas: notas || '',
        stockRestante: nuevoStock, // Para auditar qué existencias quedaron después de la transacción
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
