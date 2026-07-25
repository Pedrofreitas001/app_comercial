import { TriangleAlert } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function RupturasPage() {
  return (
    <PagePlaceholder
      icon={TriangleAlert}
      title="Rupturas"
      description="Visão filtrada de itens com demanda perdida por falta de estoque chega na próxima etapa."
    />
  );
}
