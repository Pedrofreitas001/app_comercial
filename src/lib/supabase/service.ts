import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com a service_role key - ignora RLS por completo. So' pode ser
// usado em Route Handlers server-side (nunca em Server/Client Components),
// e cada rota que o usa precisa checar autenticacao/autorizacao ela mesma
// antes de gravar (ver src/app/api/estoque/importar/route.ts).
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
