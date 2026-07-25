import { Paperclip } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function ArquivosPage() {
  return (
    <PagePlaceholder
      icon={Paperclip}
      title="Arquivos"
      description="Consulta central dos anexos das negociações chega na próxima etapa."
    />
  );
}
