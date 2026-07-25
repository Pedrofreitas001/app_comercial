import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NovaNegociacaoForm } from "./nova-negociacao-form";

export default function NovaNegociacaoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            nativeButton={false}
            render={<Link href="/negociacoes" />}
          >
            <ArrowLeft data-icon="inline-start" />
            Negociações
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Nova negociação</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os produtos negociados — o sistema acompanha o total e aponta ruptura na hora.
          </p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
      </div>
      <NovaNegociacaoForm />
    </div>
  );
}
