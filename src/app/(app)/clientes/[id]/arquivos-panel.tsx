"use client";

import { useRef, useState } from "react";
import { File, FileSpreadsheet, FileText, Image as ImageIcon, Paperclip, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { ArquivoCliente } from "@/lib/queries/cliente-fup";

const BUCKET = "cliente-arquivos";

function tipoDe(nome: string): string {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "PDF";
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

// Remove acento/espaço/caractere especial do nome — o Storage rejeita boa
// parte deles na key do objeto.
function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

interface Props {
  clienteId: string;
  arquivos: ArquivoCliente[];
  autor: string;
  usuarioId: string;
  podeEscrever: boolean;
}

export function ArquivosPanel({ clienteId, arquivos: iniciais, autor, usuarioId, podeEscrever }: Props) {
  const [arquivos, setArquivos] = useState(iniciais);
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function adicionarArquivos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setEnviando(true);
    const supabase = createClient();
    const hoje = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const dataFormatada = `${p(hoje.getDate())}/${p(hoje.getMonth() + 1)}/${hoje.getFullYear()}`;
    const novos: ArquivoCliente[] = [];

    for (const file of Array.from(files)) {
      // path começa com o cliente_id para manter os anexos separados por
      // cliente dentro do bucket.
      const path = `${clienteId}/${Date.now()}-${nomeSeguro(file.name)}`;
      const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(path, file);
      if (erroUpload) {
        toast.error(`Falha ao enviar ${file.name}`, { description: erroUpload.message });
        continue;
      }

      const { data, error: erroInsert } = await supabase
        .from("cliente_arquivos")
        .insert({
          cliente_id: clienteId,
          nome: file.name,
          tipo: tipoDe(file.name),
          storage_path: path,
          tamanho_bytes: file.size,
          usuario_id: usuarioId,
        })
        .select("id")
        .single();

      if (erroInsert || !data) {
        // registro falhou: remove o objeto pra não deixar arquivo órfão no bucket
        await supabase.storage.from(BUCKET).remove([path]);
        toast.error(`Falha ao registrar ${file.name}`, { description: erroInsert?.message });
        continue;
      }

      novos.push({
        id: data.id,
        nome: file.name,
        tipo: tipoDe(file.name),
        tamanho: tamanhoLegivel(file.size),
        autor,
        data: dataFormatada,
      });
    }

    setEnviando(false);
    if (novos.length > 0) {
      setArquivos((prev) => [...novos, ...prev]);
      toast.success(`${novos.length} arquivo(s) anexado(s)`);
    }
  }

  async function remover(id: string) {
    const supabase = createClient();
    const { data: arquivo } = await supabase.from("cliente_arquivos").select("storage_path").eq("id", id).single();
    const { error } = await supabase.from("cliente_arquivos").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover o arquivo", { description: error.message });
      return;
    }
    if (arquivo?.storage_path) {
      await supabase.storage.from(BUCKET).remove([arquivo.storage_path]);
    }
    setArquivos((prev) => prev.filter((a) => a.id !== id));
    toast.success("Arquivo removido");
  }

  async function baixar(id: string, nome: string) {
    const supabase = createClient();
    const { data: arquivo } = await supabase.from("cliente_arquivos").select("storage_path").eq("id", id).single();
    if (!arquivo?.storage_path) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(arquivo.storage_path, 60);
    if (error || !data) {
      toast.error(`Não foi possível abrir ${nome}`, { description: error?.message });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
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
      {/* Mesma altura mínima do painel de notas, pra os dois cards ficarem
          alinhados na grade lado a lado. */}
      <CardContent className="flex min-h-[560px] flex-col gap-5">
        {podeEscrever && (
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
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-12 text-center transition-colors ${
              arrastando ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
            }`}
          >
            <UploadCloud className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">
              {enviando ? "Enviando..." : "Arraste um arquivo ou clique para escolher"}
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => adicionarArquivos(e.target.files)}
            />
          </div>
        )}

        {arquivos.length === 0 ? (
          <p className="flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
            Nenhum arquivo anexado ainda.
          </p>
        ) : (
          <ul className="flex-1 space-y-2">
            {arquivos.map((arquivo) => {
              const Icone = iconeDe(arquivo.tipo);
              return (
                <li key={arquivo.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <Icone className="size-4 shrink-0 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => baixar(arquivo.id, arquivo.nome)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium underline-offset-4 hover:underline">{arquivo.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {arquivo.tipo} · {arquivo.tamanho} · {arquivo.autor} · {arquivo.data}
                    </p>
                  </button>
                  {podeEscrever && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      onClick={() => remover(arquivo.id)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
