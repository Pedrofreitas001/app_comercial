"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { UsuarioPerfil } from "@/lib/types";

const ROLE_LABEL: Record<UsuarioPerfil["role"], string> = {
  admin: "Administrador",
  gerente: "Gerente",
  vendedor: "Vendedor",
  leitura: "Leitura",
};

function initials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ usuario }: { usuario: UsuarioPerfil }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto gap-2 px-2" />}>
        <Avatar className="size-7">
          <AvatarFallback className="text-xs">{initials(usuario.nome_completo)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline">{usuario.nome_completo}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-medium">{usuario.nome_completo}</span>
          <span className="text-xs text-muted-foreground">{usuario.email}</span>
          <Badge variant="secondary" className="mt-1 w-fit">
            {ROLE_LABEL[usuario.role]}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
