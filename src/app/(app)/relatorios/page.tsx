import { FileBarChart } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function RelatoriosPage() {
  return (
    <PagePlaceholder
      icon={FileBarChart}
      title="Relatórios"
      description="Exportação em Excel/CSV/PDF com filtros chega na próxima etapa."
    />
  );
}
