import { createClient } from '@supabase/supabase-js';

// ============================================================================
// MÓDULO DE CONEXIÓN A LA BASE DE DATOS (MODO ADMINISTRADOR SERVIDOR)
// ============================================================================
// Este cliente se usa ÚNICAMENTE en el backend (API Routes de Next.js u operaciones de servidor).
// Utiliza la llave "SERVICE ROLE", lo que significa que tiene acceso total e irrestricto
// a toda la base de datos de Supabase, ignorando las Políticas de Seguridad de Nivel de Fila (RLS).
// ⚠️ ¡PELIGRO!: ESTA LLAVE JAMÁS DEBE EXPONERSE EN EL NAVEGADOR (FRONTEND).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan las variables de entorno del servidor de Supabase');
}

// Se exporta la instancia "supabaseAdmin" configurada específicamente para el backend.
// Se deshabilita el guardado y refresco automático de las sesiones locales,
// ya que un entorno de servidor no necesita persistir tokens como lo haría un navegador web.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
