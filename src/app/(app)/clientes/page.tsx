import { createClient } from "@/lib/supabase/server";
import { getClientes } from "@/lib/queries/cadastros";
import { getResumoFupPorCliente } from "@/lib/queries/cliente-fup";
import { ClientesLista, type LinhaCliente } from "./clientes-lista";

export default async function ClientesPage() {
  const supabase = await createClient();
  const [clientes, resumos] = await Promise.all([getClientes(supabase), getResumoFupPorCliente(supabase)]);

  const linhas: LinhaCliente[] = clientes.map((c) => ({
    ...c,
    fup: resumos.get(c.id) ?? { notas: 0, arquivos: 0, ultimaNota: null },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Abra um cliente para registrar o acompanhamento da negociação e anexar arquivos.
        </p>
      </div>
      <ClientesLista clientes={linhas} />
    </div>
  );
}
