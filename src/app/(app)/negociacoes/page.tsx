import { Badge } from "@/components/ui/badge";
import { NegociacoesView } from "./negociacoes-view";

export default function NegociacoesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Negociações</h1>
          <p className="text-sm text-muted-foreground">
            Todos os tickets negociados — filtre por vendedor, status ou busque por cliente e NF.
          </p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
      </div>
      <NegociacoesView />
    </div>
  );
}
