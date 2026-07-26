import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getNegociacoes } from "@/lib/queries/negociacoes";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const supabase = await createClient();
  const tickets = await getNegociacoes(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão comercial</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento das negociações da semana.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/negociacoes/nova" />}>
          <Plus data-icon="inline-start" />
          Nova negociação
        </Button>
      </div>
      <DashboardView todosTickets={tickets} />
    </div>
  );
}
