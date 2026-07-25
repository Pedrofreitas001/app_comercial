import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockClientes } from "@/lib/mock-data";

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro e importação da base de clientes.</p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
      </div>

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
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{cliente.rede}</TableCell>
                  <TableCell className="text-muted-foreground">{cliente.canal}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cliente.cidade}/{cliente.estado}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cliente.status === "ativo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}
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
    </div>
  );
}
