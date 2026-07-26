import { Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardView } from "./dashboard-view";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão comercial</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento das negociações da semana.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Dados de exemplo</Badge>
          <Button nativeButton={false} render={<Link href="/negociacoes/nova" />}>
            <Plus data-icon="inline-start" />
            Nova negociação
          </Button>
        </div>
      </div>
      <DashboardView />
    </div>
  );
}
