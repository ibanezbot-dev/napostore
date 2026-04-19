import { createClient } from '@supabase/supabase-js';

// ============================================================================
// MÓDULO DE CLIENTE DE BASE DE DATOS (FRONTEND/ESTÁNDAR)
// ============================================================================
// Este cliente está configurado para operar de forma segura usando la llave "ANÓNIMA" (Anon Key).
// Al usar esta llave, el acceso a los datos queda gobernado por las Políticas de Seguridad (RLS)
// establecidas en el dashboard de Supabase.
// Es seguro usar este archivo en componentes de cliente (Client Components) dentro de Next.js,
// aunque comúnmente en la aplicación principal se prefiere hacer llamadas directas al backend interno (/api/*)
// que a su vez se comunica de forma más robusta con Supabase.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Se crea y exporta el cliente público genérico de Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
