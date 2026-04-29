export interface User {
  id_usuario: number;
  nome: string;
  email: string;
}

export interface Transaction {
  id_transacao: number;
  titulo: string;
  tipo: "RECEITA" | "DESPESA";
  valor: number;
  data_transacao: string;
  categoria: string | null;
}
