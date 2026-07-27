export type UserRole = "admin" | "gerente" | "vendedor" | "leitura";

export interface UsuarioPerfil {
  id: string;
  nome_completo: string;
  email: string;
  role: UserRole;
  ativo: boolean;
}

// Cliente da base real (base_cliente.xlsx importada em `clientes`).
export interface Cliente {
  codigo: string;
  nome: string; // razão social
  nomeResumido: string; // nome curto editável — evita a razão social gigante nas telas
  nomeFantasia: string | null;
  rede: string | null;
  canal: string | null;
  cidade: string | null;
  estado: string | null;
  cnpj: string | null;
  vendedorNomeOrigem: string | null;
  gerenteNomeOrigem: string | null;
  tipoFrete: string | null;
  tabelaPreco: string | null;
  status: "ativo" | "inativo";
}
