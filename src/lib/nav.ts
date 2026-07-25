import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Handshake,
  Users,
  Package,
  Boxes,
  TriangleAlert,
  Paperclip,
  FileBarChart,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/negociacoes", label: "Negociações", icon: Handshake, roles: ["admin", "gerente", "vendedor"] },
  { href: "/clientes", label: "Clientes", icon: Users, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/produtos", label: "Produtos", icon: Package, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/estoque", label: "Estoque", icon: Boxes, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/rupturas", label: "Rupturas", icon: TriangleAlert, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/arquivos", label: "Arquivos", icon: Paperclip, roles: ["admin", "gerente", "vendedor", "leitura"] },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart, roles: ["admin", "gerente", "leitura"] },
  { href: "/configuracoes", label: "Configurações", icon: Settings, roles: ["admin"] },
];
