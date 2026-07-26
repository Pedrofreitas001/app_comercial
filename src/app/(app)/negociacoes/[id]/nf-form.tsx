"use client";

import { useState } from "react";
import { Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function NfForm({ ticketId, nfInicial }: { ticketId: string; nfInicial: string | null }) {
  const [nf, setNf] = useState(nfInicial ?? "");
  const [salva, setSalva] = useState(Boolean(nfInicial));
  const [salvando, setSalvando] = useState(false);

  async function handleSave() {
    if (!nf.trim()) {
      toast.error("Informe o número da NF antes de salvar.");
      return;
    }
    setSalvando(true);
    const supabase = createClient();
    const { error } = await supabase.from("negociacoes").update({ nf_numero: nf.trim() }).eq("id", ticketId);
    setSalvando(false);

    if (error) {
      toast.error("Não foi possível vincular a NF", { description: error.message });
      return;
    }
    setSalva(true);
    toast.success(`NF ${nf} vinculada ao pedido`);
  }

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1.5">
        <Label htmlFor="nf" className="text-xs text-muted-foreground">
          Nota fiscal
        </Label>
        <div className="relative">
          <FileText className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="nf"
            value={nf}
            onChange={(event) => {
              setNf(event.target.value);
              setSalva(false);
            }}
            placeholder="Nº da NF"
            className="w-40 pl-8"
          />
        </div>
      </div>
      <Button
        onClick={handleSave}
        variant={salva ? "secondary" : "default"}
        disabled={salvando || (salva && nf === (nfInicial ?? ""))}
      >
        {salva ? (
          <>
            <Check data-icon="inline-start" />
            Vinculada
          </>
        ) : salvando ? (
          "Salvando..."
        ) : (
          "Vincular NF"
        )}
      </Button>
    </div>
  );
}
