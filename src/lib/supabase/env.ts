// Falha cedo e com mensagem util quando as variaveis nao estao no ambiente.
// Sem isso o erro que aparece e' o genérico do supabase-js ("Your project's
// URL and Key are required...") num digest opaco, sem dizer QUAL variavel
// falta nem ONDE configurar.
function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} não está definida. ` +
        "Em produção, configure em Vercel > Project Settings > Environment Variables " +
        "(marcando o ambiente Production) e faça um novo deploy — variáveis NEXT_PUBLIC_* " +
        "são embutidas no build, então adicionar sem redeployar não resolve. " +
        "Localmente, preencha .env.local.",
    );
  }
  return valor;
}

export function supabaseUrl(): string {
  return obrigatoria("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return obrigatoria("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseServiceRoleKey(): string {
  return obrigatoria("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
