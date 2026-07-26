import Link from "next/link";
import { Boxes, CalendarClock, Clock, TriangleAlert, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getEstoqueNormalizado } from "@/lib/queries/estoque";
import { EstoqueView } from "./estoque-view";

export default async function EstoquePage() {
  const supabase = await createClient();
  const { linhas, ultimaAtualizacao } = await getEstoqueNormalizado(supabase);
  const normalizados = linhas.map((l) => l.norm);
  const totalUnidades = normalizados.reduce((acc, n) => acc + n.normalizado, 0);
  const aguardandoBaixa = normalizados.filter((n) => n.aguardandoBaixa && !n.emRuptura);
  const pendenteTotal = aguardandoBaixa.reduce((acc, n) => acc + n.pendente, 0);
  const emRuptura = normalizados.filter((n) => n.emRuptura);
  const deficitTotal = emRuptura.reduce((acc, n) => acc + n.deficit, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            Posição do armazém, normalizada pelas vendas ainda não abatidas pelo operador logístico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Dados de exemplo</Badge>
          <Button nativeButton={false} render={<Link href="/estoque/importar" />}>
            <Upload data-icon="inline-start" />
            Importar estoque
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Estoque normalizado"
          value={formatNumber(totalUnidades)}
          hint="unidades, já descontando vendas pendentes de baixa"
          icon={Boxes}
        />
        <KpiCard
          label="Aguardando baixa"
          value={formatNumber(aguardandoBaixa.length)}
          hint={
            aguardandoBaixa.length > 0
              ? `${formatNumber(pendenteTotal)} un. vendidas ainda não abatidas no STRALOG`
              : "tudo abatido pelo operador logístico"
          }
          icon={Clock}
          tone={aguardandoBaixa.length > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Em ruptura"
          value={formatNumber(emRuptura.length)}
          hint={
            emRuptura.length > 0
              ? `déficit de ${formatNumber(deficitTotal)} un. — aguardando reposição`
              : "nenhum SKU vendido além do disponível"
          }
          icon={TriangleAlert}
          tone={emRuptura.length > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Última atualização"
          value={ultimaAtualizacao ?? "—"}
          hint="importação diária do STRALOG"
          icon={CalendarClock}
        />
      </div>

      <EstoqueView linhas={linhas} />
    </div>
  );
}
