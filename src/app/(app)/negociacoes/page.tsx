import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { getNegociacoes } from "@/lib/queries/negociacoes";
import { NegociacoesView } from "./negociacoes-view";
import { BonificacoesView } from "./bonificacoes-view";

export default async function NegociacoesPage() {
  const supabase = await createClient();
  const tickets = await getNegociacoes(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Negociações</h1>
          <p className="text-sm text-muted-foreground">
            Tickets negociados por vendedor e administração das bonificações acordadas.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/negociacoes/nova" />}>
          <Plus data-icon="inline-start" />
          Nova negociação
        </Button>
      </div>

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="bonificacoes">Bonificações</TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos">
          <NegociacoesView tickets={tickets} />
        </TabsContent>
        <TabsContent value="bonificacoes">
          <BonificacoesView tickets={tickets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
