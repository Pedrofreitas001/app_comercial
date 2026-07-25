import { Handshake } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function NegociacoesPage() {
  return (
    <PagePlaceholder
      icon={Handshake}
      title="Negociações"
      description="Registro de negociações, itens e demanda perdida chega na próxima etapa."
    />
  );
}
