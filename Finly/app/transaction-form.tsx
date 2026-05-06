import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";

const CARTEIRA_KEY = "finly_id_carteira";

interface Categoria {
  id_categoria: number;
  nome: string;
  cor_hex: string;
}

export default function TransactionFormScreen() {
  const { user } = useAuth();
  // Parâmetros passados quando vem de edição (US03)
  const params = useLocalSearchParams<{
    id_transacao?: string;
    titulo?: string;
    valor?: string;
    tipo?: string;
    categoria_nome?: string;
    id_categoria?: string;
    data_transacao?: string;
  }>();

  const isEditing = !!params.id_transacao;

  // Campos do formulário
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

  // Detecta tipo automaticamente pelo valor (US02)
  function handleValorChange(text: string) {
    setValor(text);
    const num = parseFloat(text.replace(",", "."));
    if (!isNaN(num)) {
      setTipo(num >= 0 ? "RECEITA" : "DESPESA");
    }
  }

  // Formata data digitada para YYYY-MM-DD
  function handleDataChange(text: string) {
    // Aceita formato DD/MM/AAAA e converte
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
    // Se já está em YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    // Se está em DD/MM/YYYY
    const parts = input.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return null;
  }

  useEffect(() => {
    async function loadCategorias() {
      try {
        const data = await apiRequest<Categoria[]>("/categorias");
        setCategorias(Array.isArray(data) ? data : []);
      } catch {
        // Fallback com categorias do schema
        setCategorias([
          { id_categoria: 1, nome: "Alimentação", cor_hex: "#FF6B6B" },
          { id_categoria: 2, nome: "Mercado", cor_hex: "#FF8787" },
          { id_categoria: 5, nome: "Transporte", cor_hex: "#4D96FF" },
          { id_categoria: 7, nome: "Saúde", cor_hex: "#FF4A4A" },
          { id_categoria: 10, nome: "Lazer e Diversão", cor_hex: "#9D4EDD" },
          { id_categoria: 17, nome: "Salário", cor_hex: "#118AB2" },
          { id_categoria: 19, nome: "Renda Extra", cor_hex: "#2A9D8F" },
        ]);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCategorias();
  }, []);

  // US11 — Validação de dados
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!titulo.trim()) errs.titulo = "Título é obrigatório";
    const num = parseFloat(valor.replace(",", "."));
    if (isNaN(num) || num === 0) errs.valor = "Insira um valor válido";
    if (!idCategoria) errs.categoria = "Selecione uma categoria";
    const dataISO = parseDataToISO(data);
    if (!dataISO) errs.data = "Data inválida. Use DD/MM/AAAA";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSalvar() {
    if (!validate()) return;
    if (!user) return;

    setSaving(true);
    try {
      const dataISO = parseDataToISO(data)!;
      const valorNum = Math.abs(parseFloat(valor.replace(",", ".")));

      // Busca id_carteira salvo no onboarding ou usa padrão 1
      const carteiraStored = await AsyncStorage.getItem(CARTEIRA_KEY);
      const idCarteira = carteiraStored ? Number(carteiraStored) : 1;

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
        // US03 — Editar transação
        await apiRequest(`/transacoes/${params.id_transacao}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        Alert.alert("Sucesso", "Transação atualizada!");
      } else {
        // US02 — Cadastrar transação
        await apiRequest("/transacoes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        Alert.alert("Sucesso", "Transação cadastrada!");
      }
      router.back();
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Não foi possível salvar."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isEditing ? "Editar Transação" : "Nova Transação"}
        </Text>

        {/* Tipo — RECEITA ou DESPESA */}
        <Text style={styles.label}>TIPO</Text>
        <View style={styles.tipoRow}>
          <Pressable
            style={[styles.tipoBtn, tipo === "DESPESA" && styles.tipoBtnDespesa]}
            onPress={() => setTipo("DESPESA")}
          >
            <Text style={[styles.tipoBtnText, tipo === "DESPESA" && styles.tipoBtnTextActive]}>
              Despesa
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tipoBtn, tipo === "RECEITA" && styles.tipoBtnReceita]}
            onPress={() => setTipo("RECEITA")}
          >
            <Text style={[styles.tipoBtnText, tipo === "RECEITA" && styles.tipoBtnTextActive]}>
              Receita
            </Text>
          </Pressable>
        </View>

        {/* Título */}
        <Text style={styles.label}>TÍTULO *</Text>
        <TextInput
          style={[styles.input, errors.titulo && styles.inputError]}
          placeholder="Ex: Mercado, Salário..."
          value={titulo}
          onChangeText={setTitulo}
        />
        {errors.titulo && <Text style={styles.errorText}>{errors.titulo}</Text>}

        {/* Valor */}
        <Text style={styles.label}>VALOR (R$) *</Text>
        <TextInput
          style={[styles.input, errors.valor && styles.inputError]}
          placeholder="0,00"
          keyboardType="numeric"
          value={valor}
          onChangeText={handleValorChange}
        />
        {errors.valor && <Text style={styles.errorText}>{errors.valor}</Text>}

        {/* Data */}
        <Text style={styles.label}>DATA *</Text>
        <TextInput
          style={[styles.input, errors.data && styles.inputError]}
          placeholder="DD/MM/AAAA"
          keyboardType="numeric"
          value={
            // Se vier no formato ISO, converte para exibição
            data.includes("-")
              ? data.split("-").reverse().join("/")
              : data
          }
          onChangeText={handleDataChange}
          maxLength={10}
        />
        {errors.data && <Text style={styles.errorText}>{errors.data}</Text>}

        {/* Categoria */}
        <Text style={styles.label}>CATEGORIA *</Text>
        {loadingCats ? (
          <ActivityIndicator style={{ marginBottom: 16 }} />
        ) : (
          <>
            <View style={styles.categoriasGrid}>
              {categorias.map((cat) => (
                <Pressable
                  key={cat.id_categoria}
                  style={[
                    styles.categoriaChip,
                    idCategoria === cat.id_categoria && {
                      backgroundColor: cat.cor_hex,
                      borderColor: cat.cor_hex,
                    },
                  ]}
                  onPress={() => setIdCategoria(cat.id_categoria)}
                >
                  <Text
                    style={[
                      styles.categoriaChipText,
                      idCategoria === cat.id_categoria && { color: "#FFFFFF" },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.nome}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.categoria && (
              <Text style={styles.errorText}>{errors.categoria}</Text>
            )}
          </>
        )}

        {/* Botões */}
        <Pressable
          style={[styles.btnSalvar, saving && styles.btnDisabled]}
          onPress={handleSalvar}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnSalvarText}>
              {isEditing ? "Salvar Alterações" : "Salvar Transação"}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.btnCancelar} onPress={() => router.back()}>
          <Text style={styles.btnCancelarText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  content: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 24,
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
  },
  inputError: {
    borderColor: "#B91C1C",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    marginTop: 4,
  },
  tipoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  tipoBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tipoBtnDespesa: {
    backgroundColor: "#FEE2E2",
    borderColor: "#B91C1C",
  },
  tipoBtnReceita: {
    backgroundColor: "#DCFCE7",
    borderColor: "#15803D",
  },
  tipoBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tipoBtnTextActive: {
    color: "#0F172A",
  },
  categoriasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  categoriaChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    maxWidth: "48%",
  },
  categoriaChipText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  btnSalvar: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 28,
  },
  btnDisabled: { opacity: 0.7 },
  btnSalvarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  btnCancelar: {
    alignItems: "center",
    padding: 14,
    marginTop: 8,
  },
  btnCancelarText: {
    color: "#64748B",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});