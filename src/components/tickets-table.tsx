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
          <TableHead className="w-[10%]">Código</TableHead>
          <TableHead className="w-[27%]">Cliente</TableHead>
          <TableHead className="w-[14%]">Vendedor</TableHead>
          <TableHead className="w-[9%]">Data</TableHead>
          <TableHead className="w-[11%] text-center">Total</TableHead>
          <TableHead className="w-[8%]">NF</TableHead>
          <TableHead className="w-[21%]">Status</TableHead>
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
