import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { AppFooter } from "@/components/app-footer";
import { UserMenu } from "@/components/user-menu";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import type { UsuarioPerfil } from "@/lib/types";

async function getUsuarioPerfil(): Promise<UsuarioPerfil> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email, role, ativo")
    .eq("id", user.id)
    .single();

  if (!usuario) {
    redirect("/login");
  }

  return usuario as UsuarioPerfil;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioPerfil();

  return (
    <SidebarProvider>
      <AppSidebar role={usuario.role} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1" />
          <UserMenu usuario={usuario} />
        </header>
        <main className="flex-1 p-6">{children}</main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
