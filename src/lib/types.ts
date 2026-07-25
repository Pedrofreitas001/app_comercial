export type UserRole = "admin" | "gerente" | "vendedor" | "leitura";

export interface UsuarioPerfil {
  id: string;
  nome_completo: string;
  email: string;
  role: UserRole;
  ativo: boolean;
}
