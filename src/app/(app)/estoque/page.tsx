import { Boxes } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function EstoquePage() {
  return (
    <PagePlaceholder
      icon={Boxes}
      title="Estoque"
      description="Importação do export STRALOG e visualização do estoque atual chegam na próxima etapa."
    />
  );
}
