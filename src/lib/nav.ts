import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Handshake,
  Boxes,
  FolderOpen,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

// Navegacao enxuta de proposito: o dashboard e o hub, o resto e apoio.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/negociacoes", label: "Negociações", icon: Handshake, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/estoque", label: "Estoque", icon: Boxes, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/cadastros", label: "Cadastros", icon: FolderOpen, roles: ["admin", "gerente"] },
  { href: "/configuracoes", label: "Configurações", icon: Settings, roles: ["admin"] },
];
