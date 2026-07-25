import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBRL } from "@/lib/format";
import { mockClientes, mockProdutos } from "@/lib/mock-data";

export default function CadastrosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cadastros</h1>
          <p className="text-sm text-muted-foreground">
            Base de clientes e mapa de SKUs, alimentados por importação das planilhas.
          </p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
      </div>

      <Tabs defaultValue="clientes">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Rede</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockClientes.map((cliente) => (
                    <TableRow key={cliente.codigo}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{cliente.codigo}</TableCell>
                      <TableCell className="max-w-[300px] truncate font-medium">{cliente.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{cliente.rede}</TableCell>
                      <TableCell className="text-muted-foreground">{cliente.canal}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {cliente.cidade}/{cliente.estado}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            cliente.status === "ativo"
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {cliente.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Preço de tabela</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProdutos.map((produto) => (
                    <TableRow key={produto.sku}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{produto.sku}</TableCell>
                      <TableCell className="max-w-[320px] truncate font-medium">{produto.descricao}</TableCell>
                      <TableCell className="text-muted-foreground">{produto.categoria}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {produto.preco != null ? (
                          formatBRL(produto.preco)
                        ) : (
                          <span className="italic text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-success/10 text-success">
                          Ativo
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
