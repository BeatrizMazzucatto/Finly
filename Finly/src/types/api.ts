export interface User {
  id_usuario: number;
  nome: string;
  email: string;
}

export interface Transaction {
  id_transacao: number;
  id_carteira?: number;
  id_usuario?: number;
  usuario_nome?: string;
  titulo: string;
  tipo: "RECEITA" | "DESPESA";
  valor: number;
  data_transacao: string;
  categoria: string | null;
}
