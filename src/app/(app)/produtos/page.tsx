import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL } from "@/lib/format";
import { mockProdutos } from "@/lib/mock-data";

export default function ProdutosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">Cadastro e importação do mapa de SKUs (DIM_V1).</p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProdutos.map((produto) => (
                <TableRow key={produto.sku}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{produto.sku}</TableCell>
                  <TableCell className="font-medium">{produto.descricao}</TableCell>
                  <TableCell className="text-muted-foreground">{produto.categoria}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {produto.marca ?? <span className="italic">não informado</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {produto.preco != null ? formatBRL(produto.preco) : <span className="italic text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-success/15 text-success">
                      Ativo
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
