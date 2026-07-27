import type { LucideIcon } from "lucide-react";
import { Users, Settings } from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

// Versao resumida: a base de clientes e o unico hub. Cada cliente carrega seu
// proprio acompanhamento (notas por data) e arquivos.
export const NAV_ITEMS: NavItem[] = [
  { href: "/clientes", label: "Clientes", icon: Users, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/configuracoes", label: "Configurações", icon: Settings, roles: ["admin"] },
];
