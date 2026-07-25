import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportarEstoqueView } from "./importar-view";

export default function ImportarEstoquePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          nativeButton={false}
          render={<Link href="/estoque" />}
        >
          <ArrowLeft data-icon="inline-start" />
          Estoque
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Importar estoque do dia</h1>
        <p className="text-sm text-muted-foreground">
          Suba o export do STRALOG para atualizar a posição de estoque usada nas negociações.
        </p>
      </div>
      <ImportarEstoqueView />
    </div>
  );
}
