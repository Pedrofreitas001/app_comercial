"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSpreadsheet, TriangleAlert, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseEstoqueStralog, type EstoqueParseResult } from "@/lib/import/estoque-parser";
import { formatNumber } from "@/lib/format";

export function ImportarEstoqueView({ codigosCatalogo }: { codigosCatalogo: string[] }) {
  const router = useRouter();
  const catalogo = new Set(codigosCatalogo);
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [resultado, setResultado] = useState<EstoqueParseResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  async function processarArquivo(file: File) {
    setProcessando(true);
    setErro(null);
    setResultado(null);
    setNomeArquivo(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseEstoqueStralog(buffer);
      setResultado(parsed);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    } finally {
      setProcessando(false);
    }
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setArrastando(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processarArquivo(file);
  }

  function onFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) processarArquivo(file);
  }

  async function confirmarImportacao() {
    if (!resultado || !nomeArquivo) return;
    setConfirmando(true);
    try {
      const response = await fetch("/api/estoque/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arquivoNome: nomeArquivo, linhas: resultado.agregados }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao importar o estoque.");

      toast.success(`Estoque atualizado — ${data.importadas} SKUs`, {
        description:
          data.naoEncontrados > 0
            ? `${data.naoEncontrados} SKU(s) não encontrados no catálogo foram ignorados.`
            : undefined,
      });
      router.push("/estoque");
      router.refresh();
    } catch (e) {
      toast.error("Não foi possível importar o estoque", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setConfirmando(false);
    }
  }

  const naoEncontrados = resultado
    ? resultado.agregados.filter((a) => !catalogo.has(a.codigo))
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arquivo do dia</CardTitle>
          <CardDescription>
            Export do STRALOG (abas &quot;Filtrada&quot; ou &quot;Original&quot;). O sistema soma
            a quantidade disponível por SKU considerando só os lotes com status BOM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            id="estoque-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
              arrastando ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
            }`}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste o arquivo .xlsx aqui ou clique para escolher</p>
            <p className="text-xs text-muted-foreground">
              {nomeArquivo ? `Selecionado: ${nomeArquivo}` : "Nenhum arquivo selecionado"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFileInput}
            />
          </div>

          {processando && <p className="mt-3 text-sm text-muted-foreground">Lendo planilha...</p>}
          {erro && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p>{erro}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {resultado && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo da leitura</CardTitle>
              <CardDescription>Aba usada: {resultado.planilhaUsada}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Linhas lidas</p>
                  <p className="text-lg font-semibold tabular-nums">{formatNumber(resultado.linhasTotais)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Linhas válidas</p>
                  <p className="text-lg font-semibold tabular-nums">{formatNumber(resultado.linhasValidas)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Ignoradas (rodapé/inválidas)</p>
                  <p className="text-lg font-semibold tabular-nums text-muted-foreground">
                    {formatNumber(resultado.linhasIgnoradas)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">SKUs únicos (status BOM)</p>
                  <p className="text-lg font-semibold tabular-nums">{formatNumber(resultado.agregados.length)}</p>
                </div>
              </div>

              {naoEncontrados.length > 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {naoEncontrados.length} SKU(s) do arquivo não foram encontrados no catálogo de
                    produtos — confira o mapeamento SKU_Entrada / SKU_saída antes de confirmar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prévia — estoque por SKU</CardTitle>
              <CardDescription>
                Quantidade somada entre lotes; esta é a foto que vira o estoque disponível do dia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[420px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU (código STRALOG)</TableHead>
                      <TableHead>Produto na planilha</TableHead>
                      <TableHead className="text-center">Quantidade disponível</TableHead>
                      <TableHead>Catálogo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.agregados.map((row) => {
                      const encontrado = catalogo.has(row.codigo);
                      return (
                        <TableRow key={row.codigo}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{row.codigo}</TableCell>
                          <TableCell className="max-w-[320px] truncate font-medium">{row.produto}</TableCell>
                          <TableCell className="text-center font-medium tabular-nums">
                            {formatNumber(row.quantidade)} UN
                          </TableCell>
                          <TableCell>
                            {encontrado ? (
                              <Badge variant="outline" className="bg-success/10 text-success">
                                <CheckCircle2 data-icon="inline-start" />
                                Mapeado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-warning/10 text-warning">
                                <TriangleAlert data-icon="inline-start" />
                                Não encontrado
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.push("/estoque")}>
                  Cancelar
                </Button>
                <Button onClick={confirmarImportacao} disabled={confirmando}>
                  <FileSpreadsheet data-icon="inline-start" />
                  {confirmando ? "Confirmando..." : "Confirmar importação"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
