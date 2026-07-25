import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NegociacoesView } from "./negociacoes-view";
import { BonificacoesView } from "./bonificacoes-view";

export default function NegociacoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Negociações</h1>
          <p className="text-sm text-muted-foreground">
            Tickets negociados por vendedor e administração das bonificações acordadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Dados de exemplo</Badge>
          <Button nativeButton={false} render={<Link href="/negociacoes/nova" />}>
            <Plus data-icon="inline-start" />
            Nova negociação
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="bonificacoes">Bonificações</TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos">
          <NegociacoesView />
        </TabsContent>
        <TabsContent value="bonificacoes">
          <BonificacoesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
