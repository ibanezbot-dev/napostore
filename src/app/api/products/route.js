import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/products — Lista todos los productos (Público)
// ============================================================================
// Este endpoint maneja la obtención de la lista de productos. 
// Permite filtrado opcional mediante parámetros en la URL (?search=...&category=...).
// ============================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    // 1. INICIO DE LA CONSULTA A LA BD
    // Utilizamos 'supabaseAdmin' para interactuar sin restricciones.
    // 'from('productos')' selecciona la tabla.
    // 'select('*')' es equivalente a 'SELECT * FROM productos'.
    // 'order(...)' ordena los resultados para que los más nuevos aparezcan primero.
    let query = supabaseAdmin.from('productos').select('*').order('created_at', { ascending: false });

    // 2. FILTRADO POR BÚSQUEDA TIPO TEXTO (LIKE)
    if (search) {
      // .or() se utiliza para buscar coincidencias parciales (ilike) tanto en el nombre como en la descripción.
      query = query.or(
        `nombreProducto.ilike.%${search}%,descripcionProducto.ilike.%${search}%`
      );
    }

    // 3. FILTRADO EXACTO POR CATEGORÍA
    if (category && category !== 'all') {
      // .eq() significa "equals" (igual a). Equivalente a: WHERE categoriaProducto = 'category'
      query = query.eq('categoriaProducto', category);
    }

    // 4. EJECUCIÓN DE LA CONSULTA
    // Se ejecuta la promesa. Desestructuramos para extraer 'data' (los registros) y 'error' (en caso de fallo).
    const { data, error } = await query;
    if (error) throw error; // Si la BD arroja un error, lo lanzamos al bloque catch.

    // 5. RESPUESTA AL FRONTEND
    // Retornamos un JSON (NextResponse.json) con los datos recopilados de la BD en formato de array.
    return NextResponse.json({ products: data });
  } catch (err) {
    console.error('GET /api/products error:', err);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

// POST /api/products — Crea un nuevo producto
// ============================================================================
// Endpoint protegido, exclusivo para administradores.
// ============================================================================
export async function POST(request) {
  // Verificación de Autenticación (Middleware en código).
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json(); // Extraer el cuerpo de la petición.
    const {
      nombreProducto,
      descripcionProducto,
      precioProducto,
      cantidadProducto,
      categoriaProducto,
      imagenProducto,
    } = body;

    // Validación básica previa a tocar la Base de Datos.
    if (!nombreProducto || precioProducto === undefined) {
      return NextResponse.json({ error: 'Nombre y precio son requeridos' }, { status: 400 });
    }

    // INTERACCIÓN CON LA BASE DE DATOS (CREATE / INSERT)
    // Usamos el cliente Administrador para evitar bloqueos por RLS.
    const { data, error } = await supabaseAdmin
      .from('productos')     // Seleccionamos la tabla destino: 'productos'
      .insert([              // Pasamos un Array de objetos para insertar (en este caso 1 solo registro)
        {
          nombreProducto,
          descripcionProducto: descripcionProducto || '',
          precioProducto: parseFloat(precioProducto),      // Parseo asegurando tipo Numérico real
          cantidadProducto: parseInt(cantidadProducto) || 0, // Parseo asegurando Entero
          categoriaProducto: categoriaProducto || '',
          imagenProducto: imagenProducto || '',
        },
      ])
      .select()   // Es VITAL encadenar `.select()` después de un `.insert()` para que Supabase nos devuelva el registro recién insertado (con su nuevo 'id' autogenerado).
      .single();  // `.single()` obliga a devolver un solo objeto en lugar de un Array (ya que solo insertamos 1 ítem).

    if (error) throw error;

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/products error:', err);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
