"use client";

import { useRef, useState } from "react";
import { File, FileSpreadsheet, FileText, Image as ImageIcon, Paperclip, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArquivoTicket } from "@/lib/mock-data";

function tipoDe(nome: string): string {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "PDF";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "Imagem";
  if (["xlsx", "xls", "csv"].includes(ext)) return "Excel";
  if (["doc", "docx"].includes(ext)) return "Word";
  return "Arquivo";
}

function iconeDe(tipo: string) {
  if (tipo === "PDF") return FileText;
  if (tipo === "Imagem") return ImageIcon;
  if (tipo === "Excel") return FileSpreadsheet;
  return File;
}

function tamanhoLegivel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ArquivosPanel({ arquivos: iniciais, autor }: { arquivos: ArquivoTicket[]; autor: string }) {
  const [arquivos, setArquivos] = useState(iniciais);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function adicionarArquivos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const hoje = new Date();
    const data = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
    const novos: ArquivoTicket[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).slice(2),
      nome: file.name,
      tipo: tipoDe(file.name),
      tamanho: tamanhoLegivel(file.size),
      autor,
      data,
    }));
    setArquivos((prev) => [...novos, ...prev]);
    toast.success(`${novos.length} arquivo(s) anexado(s)`, {
      description: "Exemplo — o upload real acontece quando o Supabase Storage estiver conectado.",
    });
  }

  function remover(id: string) {
    setArquivos((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="size-4 text-muted-foreground" />
          Arquivos
        </CardTitle>
        <CardDescription>PDF, imagem, planilha, print de WhatsApp, e-mail exportado...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            adicionarArquivos(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            arrastando ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
          }`}
        >
          <UploadCloud className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Arraste um arquivo ou clique para escolher</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => adicionarArquivos(e.target.files)}
          />
        </div>

        {arquivos.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">Nenhum arquivo anexado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {arquivos.map((arquivo) => {
              const Icone = iconeDe(arquivo.tipo);
              return (
                <li key={arquivo.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <Icone className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{arquivo.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {arquivo.tipo} · {arquivo.tamanho} · {arquivo.autor} · {arquivo.data}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => remover(arquivo.id)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
