export interface User {
  id_usuario: number;
  nome: string;
  email: string;
  id_carteira_pessoal?: number | null;
  id_carteira_conjunta?: number | null;
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
