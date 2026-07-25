import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientesTable } from "./clientes-table";
import { ProdutosTable } from "./produtos-table";

export default function CadastrosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cadastros</h1>
          <p className="text-sm text-muted-foreground">
            Base de clientes e mapa de SKUs — importados de base_cliente.xlsx e DIM_V1.xlsx.
          </p>
        </div>
        <Badge variant="secondary">Base real do cliente</Badge>
      </div>

      <Tabs defaultValue="clientes">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes">
          <ClientesTable />
        </TabsContent>

        <TabsContent value="produtos">
          <ProdutosTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
