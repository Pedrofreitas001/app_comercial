import { LayoutDashboard } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function DashboardPage() {
  return (
    <PagePlaceholder
      icon={LayoutDashboard}
      title="Dashboard"
      description="Cards de demanda perdida, gráficos e últimas negociações chegam na próxima etapa."
    />
  );
}
