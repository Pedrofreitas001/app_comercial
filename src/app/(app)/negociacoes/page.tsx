import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NegociacaoStatusBadge } from "@/components/negociacao-status-badge";
import { formatBRL } from "@/lib/format";
import { mockNegociacoesRecentes } from "@/lib/mock-data";

export default function NegociacoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Negociações</h1>
          <p className="text-sm text-muted-foreground">
            Registro de negociações, itens negociados e demanda perdida.
          </p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor perdido</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockNegociacoesRecentes.map((neg, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{neg.cliente}</TableCell>
                  <TableCell className="text-muted-foreground">{neg.vendedor}</TableCell>
                  <TableCell className="text-muted-foreground">{neg.data}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {neg.valorPerdido > 0 ? formatBRL(neg.valorPerdido) : "—"}
                  </TableCell>
                  <TableCell>
                    <NegociacaoStatusBadge status={neg.status} />
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
