import { Boxes, CalendarClock, PackageX, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import { formatNumber } from "@/lib/format";
import { mockEstoque, mockEstoqueDataReferencia } from "@/lib/mock-data";
import { EstoqueView } from "./estoque-view";

export default function EstoquePage() {
  const totalUnidades = mockEstoque.reduce((acc, row) => acc + row.quantidade, 0);
  const skusDisponiveis = mockEstoque.filter((row) => row.quantidade > 0).length;
  const skusBaixos = mockEstoque.filter((row) => row.quantidade > 0 && row.quantidade <= 30).length;
  const skusZerados = mockEstoque.filter((row) => row.quantidade === 0).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            Posição sincronizada do armazém — somente leitura, atualizada por importação.
          </p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="SKUs com estoque"
          value={formatNumber(skusDisponiveis)}
          hint={`${formatNumber(totalUnidades)} unidades no total`}
          icon={Boxes}
        />
        <KpiCard
          label="SKUs com estoque baixo"
          value={formatNumber(skusBaixos)}
          hint="30 unidades ou menos"
          icon={TriangleAlert}
          tone={skusBaixos > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="SKUs zerados"
          value={formatNumber(skusZerados)}
          hint="risco direto de ruptura"
          icon={PackageX}
          tone={skusZerados > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Última atualização"
          value={mockEstoqueDataReferencia}
          hint="importação diária do STRALOG"
          icon={CalendarClock}
        />
      </div>

      <EstoqueView />
    </div>
  );
}
