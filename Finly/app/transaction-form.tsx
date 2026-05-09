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
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { CATEGORIAS } from "@/constants/categories";
import { formatMoneyInput } from "@/utils/formatters";

const CARTEIRA_KEY = "finly_id_carteira";

interface Categoria {
  id_categoria: number;
  nome: string;
  cor_hex: string;
}

export default function TransactionFormScreen() {
  const { user } = useAuth();
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

  useEffect(() => {
    async function loadCategorias() {
      try {
        const data = await apiRequest<Categoria[]>("/categorias");
        setCategorias(Array.isArray(data) ? data : []);
      } catch {
        setCategorias(CATEGORIAS.map((cat) => ({
          id_categoria: cat.id,
          nome: cat.nome,
          cor_hex: cat.cor,
        })));
      } finally {
        setLoadingCats(false);
      }
    }
    loadCategorias();
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!titulo.trim()) errs.titulo = "Título é obrigatório";
    const num = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    if (isNaN(num) || num === 0) errs.valor = "Insira um valor válido";
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
      const valorNum = Math.abs(parseFloat(valor.replace(/\./g, "").replace(",", ".")));
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
        await apiRequest(`/transacoes/${params.id_transacao}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        Alert.alert("Sucesso", "Transação atualizada!");
      } else {
        await apiRequest("/transacoes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        Alert.alert("Sucesso", "Transação cadastrada!");
      }
      router.back();
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = categorias.find((c) => c.id_categoria === idCategoria);
  const categoryIcon = CATEGORIAS.find((c) => c.nome === selectedCategory?.nome)?.icon || "tag";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? "Editar Transação" : "Nova Transação"}
        </Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tipo Toggle */}
        <View style={styles.tipoContainer}>
          <Pressable
            style={[
              styles.tipoButton,
              tipo === "DESPESA" && styles.tipoButtonExpense,
            ]}
            onPress={() => setTipo("DESPESA")}
          >
            <Feather 
              name="arrow-down-circle" 
              size={20} 
              color={tipo === "DESPESA" ? Colors.error : Colors.textMuted} 
            />
            <Text style={[
              styles.tipoText,
              tipo === "DESPESA" && styles.tipoTextExpense,
            ]}>
              Despesa
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tipoButton,
              tipo === "RECEITA" && styles.tipoButtonIncome,
            ]}
            onPress={() => setTipo("RECEITA")}
          >
            <Feather 
              name="arrow-up-circle" 
              size={20} 
              color={tipo === "RECEITA" ? Colors.income : Colors.textMuted} 
            />
            <Text style={[
              styles.tipoText,
              tipo === "RECEITA" && styles.tipoTextIncome,
            ]}>
              Receita
            </Text>
          </Pressable>
        </View>

        {/* Valor */}
        <View style={styles.valorContainer}>
          <Text style={[
            styles.valorPrefix,
            { color: tipo === "DESPESA" ? Colors.error : Colors.income },
          ]}>
            {tipo === "DESPESA" ? "-" : "+"} R$
          </Text>
          <TextInput
            style={[
              styles.valorInput,
              { color: tipo === "DESPESA" ? Colors.error : Colors.income },
            ]}
            placeholder="0,00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={valor}
            onChangeText={handleValorChange}
          />
        </View>
        {errors.valor && <Text style={styles.errorText}>{errors.valor}</Text>}

        {/* Título */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DESCRIÇÃO</Text>
          <View style={[styles.inputContainer, errors.titulo && styles.inputError]}>
            <Feather name="edit-3" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ex: Mercado, Salário..."
              placeholderTextColor={Colors.textMuted}
              value={titulo}
              onChangeText={setTitulo}
            />
          </View>
          {errors.titulo && <Text style={styles.errorText}>{errors.titulo}</Text>}
        </View>

        {/* Data */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DATA</Text>
          <View style={[styles.inputContainer, errors.data && styles.inputError]}>
            <Feather name="calendar" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={data.includes("-") ? data.split("-").reverse().join("/") : data}
              onChangeText={handleDataChange}
              maxLength={10}
            />
          </View>
          {errors.data && <Text style={styles.errorText}>{errors.data}</Text>}
        </View>

        {/* Categoria */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CATEGORIA</Text>
          {loadingCats ? (
            <ActivityIndicator style={{ marginVertical: Spacing.lg }} />
          ) : (
            <View style={styles.categoriasGrid}>
              {categorias.slice(0, 12).map((cat) => {
                const catInfo = CATEGORIAS.find((c) => c.nome === cat.nome);
                const isSelected = idCategoria === cat.id_categoria;
                return (
                  <Pressable
                    key={cat.id_categoria}
                    style={[
                      styles.categoriaItem,
                      isSelected && { 
                        backgroundColor: (catInfo?.cor || cat.cor_hex) + "20",
                        borderColor: catInfo?.cor || cat.cor_hex,
                      },
                    ]}
                    onPress={() => setIdCategoria(cat.id_categoria)}
                  >
                    <View style={[
                      styles.categoriaIcon,
                      { backgroundColor: (catInfo?.cor || cat.cor_hex) + "20" },
                    ]}>
                      <Feather 
                        name={catInfo?.icon || "tag"} 
                        size={18} 
                        color={catInfo?.cor || cat.cor_hex} 
                      />
                    </View>
                    <Text style={[
                      styles.categoriaText,
                      isSelected && { color: catInfo?.cor || cat.cor_hex, fontWeight: FontWeight.semibold },
                    ]} numberOfLines={1}>
                      {cat.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {errors.categoria && <Text style={styles.errorText}>{errors.categoria}</Text>}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSalvar}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <>
              <Feather name="check" size={20} color={Colors.textInverse} />
              <Text style={styles.saveButtonText}>
                {isEditing ? "Salvar Alterações" : "Salvar Transação"}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  tipoContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  tipoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  tipoButtonExpense: {
    backgroundColor: Colors.expenseLight,
    borderColor: Colors.expense,
  },
  tipoButtonIncome: {
    backgroundColor: Colors.incomeLight,
    borderColor: Colors.income,
  },
  tipoText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  tipoTextExpense: {
    color: Colors.expense,
  },
  tipoTextIncome: {
    color: Colors.income,
  },
  valorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  valorPrefix: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
  },
  valorInput: {
    fontSize: 48,
    fontWeight: FontWeight.bold,
    textAlign: "center",
    minWidth: 150,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  categoriasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoriaItem: {
    width: "31%",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoriaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  categoriaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    ...Shadow.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  cancelButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },
});