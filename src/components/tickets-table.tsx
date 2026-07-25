import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NegociacaoStatusBadge } from "@/components/negociacao-status-badge";
import { formatBRL } from "@/lib/format";
import { ticketTotais, type MockTicket } from "@/lib/mock-data";

export function TicketsTable({ tickets }: { tickets: MockTicket[] }) {
  if (tickets.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma negociação encontrada com os filtros atuais.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Vendedor</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-center">Total</TableHead>
          <TableHead>NF</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => {
          const totais = ticketTotais(ticket);
          return (
            <TableRow key={ticket.id}>
              <TableCell>
                <Link
                  href={`/negociacoes/${ticket.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {ticket.codigo}
                </Link>
              </TableCell>
              <TableCell className="max-w-[260px] truncate font-medium">{ticket.cliente}</TableCell>
              <TableCell className="text-muted-foreground">{ticket.vendedor}</TableCell>
              <TableCell className="text-muted-foreground">{ticket.data}</TableCell>
              <TableCell className="text-center font-medium tabular-nums">
                {formatBRL(totais.totalFinal)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ticket.nf ?? <span className="text-xs italic">pendente</span>}
              </TableCell>
              <TableCell>
                <NegociacaoStatusBadge status={ticket.status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
