import { useState, useEffect } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { getCategories } from "@/src/services/categories";
import { formatMoneyInput, parseMoneyInput } from "@/utils/formatters";

const CARTEIRA_KEY = "finly_id_carteira";

export interface Categoria {
  id_categoria: number;
  nome: string;
  cor_hex: string;
  icone: string;
}

interface TransactionFormParams {
  id_transacao?: string;
  titulo?: string;
  valor?: string;
  tipo?: string;
  categoria_nome?: string;
  id_categoria?: string;
  data_transacao?: string;
  id_carteira?: string;
  carteira?: string;
}

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export function useTransactionFormViewModel(params: TransactionFormParams) {
  const { user } = useAuth();
  
  const isEditing = !!params.id_transacao;

  const [titulo, setTitulo] = useState(params.titulo ?? "");
  const [valor, setValor] = useState(params.valor ?? "");
  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">(
    (params.tipo as "RECEITA" | "DESPESA") ?? "DESPESA"
  );
  const [idCategoria, setIdCategoria] = useState<number | null>(
    params.id_categoria ? Number(params.id_categoria) : null
  );
  const [data, setData] = useState(
    params.data_transacao ?? new Date().toISOString().split("T")[0]
  );
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConjunta, setIsConjunta] = useState(false);

  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const forceCarteira = params.carteira;

  useEffect(() => {
    if (forceCarteira) {
      setIsConjunta(forceCarteira === "CONJUNTA");
    } else if (params.id_carteira) {
      setIsConjunta(Number(params.id_carteira) === 3);
    } else {
      AsyncStorage.getItem(CARTEIRA_KEY).then((val) => {
        if (val) {
          setIsConjunta(Number(val) === 3);
        }
      });
    }
  }, [params.id_carteira, forceCarteira]);

  useEffect(() => {
    async function loadCategorias() {
      try {
        const loaded = await getCategories([user?.id_carteira_pessoal || null, user?.id_carteira_conjunta || null]);
        setCategorias(loaded);
      } catch {
        setCategorias([]);
      }
      setLoadingCats(false);
    }
    loadCategorias();
  }, [user]);

  function handleValorChange(text: string) {
    setValor(formatMoneyInput(text));
  }

  function handleDataChange(text: string) {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 8) {
      let formatted = digits;
      if (digits.length > 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
      } else if (digits.length > 2) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      }
      setData(formatted);
    }
  }

  function parseDataToISO(input: string): string | null {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const parts = input.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return null;
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!titulo.trim()) errs.titulo = "Título é obrigatório";
    const num = parseMoneyInput(valor);
    if (num <= 0) errs.valor = "Insira um valor válido";
    if (!idCategoria) errs.categoria = "Selecione uma categoria";
    const dataISO = parseDataToISO(data);
    if (!dataISO) errs.data = "Data inválida";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSalvar() {
    if (!validate()) return;
    if (!user) return;

    setSaving(true);
    try {
      const dataISO = parseDataToISO(data)!;
      const valorNum = Math.abs(parseMoneyInput(valor));
      const idCarteira = isConjunta ? (user.id_carteira_conjunta || 3) : (user.id_carteira_pessoal || 1);

      const payload = {
        id_carteira: idCarteira,
        id_usuario: user.id_usuario,
        id_categoria: idCategoria,
        titulo: titulo.trim(),
        tipo,
        valor: valorNum,
        data_transacao: dataISO,
        status: "PAGO",
      };

      if (isEditing) {
        await apiRequest(`/transacoes/${params.id_transacao}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showAlert("Sucesso", "Transação atualizada!");
      } else {
        await apiRequest("/transacoes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showAlert("Sucesso", "Transação cadastrada!");
      }
      dismiss();
    } catch (err) {
      showAlert("Erro", err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  function handleSelectCategoria(cat: Categoria) {
    setIdCategoria(cat.id_categoria);
    const name = cat.nome.toLowerCase();
    if (name.includes('salário') || name.includes('salario') || name.includes('investimento') || name.includes('rendimento')) {
      setTipo("RECEITA");
    }
  }

  const selectedCategory = categorias.find((c) => c.id_categoria === idCategoria);

  return {
    isEditing,
    isConjunta,
    titulo, setTitulo,
    valor, handleValorChange,
    tipo, setTipo,
    idCategoria, handleSelectCategoria,
    data, handleDataChange,
    categorias, loadingCats,
    saving, errors,
    handleSalvar, dismiss,
    selectedCategory
  };
}
