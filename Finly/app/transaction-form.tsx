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
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { getCategories } from "@/src/services/categories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { formatMoneyInput, parseMoneyInput } from "@/utils/formatters";

const CARTEIRA_KEY = "finly_id_carteira";

interface Categoria {
  id_categoria: number;
  nome: string;
  cor_hex: string;
  icone: string;
}

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
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
    id_carteira?: string;
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
  const [isConjunta, setIsConjunta] = useState(false);

  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  useEffect(() => {
    if (params.id_carteira) {
      setIsConjunta(Number(params.id_carteira) === user?.id_carteira_conjunta);
    } else {
      AsyncStorage.getItem(CARTEIRA_KEY).then((val) => {
        if (val) {
          setIsConjunta(Number(val) === user?.id_carteira_conjunta);
        }
      });
    }
  }, [params.id_carteira, user?.id_carteira_conjunta]);

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

  async function loadCategorias() {
    setLoadingCats(true);
    try {
      const carteiraId = isConjunta ? user?.id_carteira_conjunta : user?.id_carteira_pessoal;
      const loaded = await getCategories(carteiraId);
      setCategorias(loaded);
    } catch {
      setCategorias([]);
    }
    setLoadingCats(false);
  }

  useEffect(() => {
    loadCategorias();
  }, [isConjunta]);

  useEffect(() => {
    if (!idCategoria && params.categoria_nome && categorias.length > 0) {
      const match = categorias.find(c => c.nome === params.categoria_nome);
      if (match) setIdCategoria(match.id_categoria);
    }
  }, [categorias, idCategoria, params.categoria_nome]);

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
      const idCarteira = isConjunta ? user?.id_carteira_conjunta : user?.id_carteira_pessoal;

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

  const selectedCategory = categorias.find((c) => c.id_categoria === idCategoria);
  const categoryIcon = selectedCategory?.icone || "tag";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.closeButton} />
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
              tipo === "DESPESA" && styles.tipoButtonActiveExpense,
            ]}
            onPress={() => setTipo("DESPESA")}
          >
            <Text style={[
              styles.tipoText,
              tipo === "DESPESA" && styles.tipoTextActiveExpense,
            ]}>
              Despesa
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tipoButton,
              tipo === "RECEITA" && styles.tipoButtonActiveIncome,
            ]}
            onPress={() => setTipo("RECEITA")}
          >
            <Text style={[
              styles.tipoText,
              tipo === "RECEITA" && styles.tipoTextActiveIncome,
            ]}>
              Receita
            </Text>
          </Pressable>
        </View>

        {/* Valor */}
        <TextInput
          style={styles.valorInput}
          placeholder="R$ 0,00"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={valor ? (valor.startsWith("R$") ? valor : `R$ ${valor}`) : ""}
          onChangeText={(text) => handleValorChange(text.replace(/^R\$\s?/, ""))}
        />
        {errors.valor && <Text style={styles.errorText}>{errors.valor}</Text>}

        {/* Context Selector: Pessoal vs Conjunto */}
        {!!user?.id_carteira_conjunta && (
          <View style={styles.inputGroup}>
          <Text style={styles.label}>TIPO DE LANÇAMENTO</Text>
          <View style={{ gap: 10, marginBottom: 12 }}>
            {/* Option 1: Pessoal */}
            <Pressable
              style={[
                styles.contextCard,
                !isConjunta && styles.contextCardActivePersonal,
              ]}
              onPress={() => setIsConjunta(false)}
            >
              <View style={[
                styles.contextIconContainer,
                { backgroundColor: !isConjunta ? Colors.primaryLight : "#F1F5F9" }
              ]}>
                <Feather 
                  name="user" 
                  size={20} 
                  color={!isConjunta ? Colors.primary : Colors.textGray} 
                />
              </View>
              <View style={styles.contextTextContainer}>
                <Text style={[
                  styles.contextTitle,
                  !isConjunta && { color: Colors.primary, fontWeight: FontWeight.bold }
                ]}>
                  Lançamento Pessoal
                </Text>
                <Text style={styles.contextSubtitle}>Somente minha carteira</Text>
              </View>
              <View style={[
                styles.contextRadio,
                !isConjunta && { borderColor: Colors.primary, backgroundColor: Colors.primary }
              ]}>
                {!isConjunta && <View style={styles.contextRadioInner} />}
              </View>
            </Pressable>

            {/* Option 2: Conjunto */}
            <Pressable
              style={[
                styles.contextCard,
                isConjunta && styles.contextCardActiveJoint,
              ]}
              onPress={() => setIsConjunta(true)}
            >
              <View style={[
                styles.contextIconContainer,
                { backgroundColor: isConjunta ? Colors.jointLight : "#F1F5F9" }
              ]}>
                <Feather 
                  name="users" 
                  size={20} 
                  color={isConjunta ? Colors.jointPrimary : Colors.textGray} 
                />
              </View>
              <View style={styles.contextTextContainer}>
                <Text style={[
                  styles.contextTitle,
                  isConjunta && { color: Colors.jointPrimary, fontWeight: FontWeight.bold }
                ]}>
                  Lançamento Conjunto
                </Text>
                <Text style={styles.contextSubtitle}>Compartilhado com Família</Text>
              </View>
              <View style={[
                styles.contextRadio,
                isConjunta && { borderColor: Colors.jointPrimary, backgroundColor: Colors.jointPrimary }
              ]}>
                {isConjunta && <View style={styles.contextRadioInner} />}
              </View>
            </Pressable>
          </View>
        </View>
        )}

        {/* Título */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DESCRIÇÃO</Text>
          <View style={[styles.inputContainer, errors.titulo && styles.inputError]}>
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
              {categorias.map((cat) => {
                const isSelected = idCategoria === cat.id_categoria;
                return (
                  <Pressable
                    key={cat.id_categoria}
                    style={[
                      styles.categoriaItem,
                      isSelected && { 
                        backgroundColor: cat.cor_hex + "20",
                        borderColor: cat.cor_hex,
                      },
                    ]}
                    onPress={() => setIdCategoria(cat.id_categoria)}
                  >
                    <View style={[
                      styles.categoriaIcon,
                      { backgroundColor: cat.cor_hex + "20" },
                    ]}>
                      <Feather 
                        name={cat.icone as any} 
                        size={18} 
                        color={cat.cor_hex} 
                      />
                    </View>
                    <Text style={[
                      styles.categoriaText,
                      isSelected && { color: cat.cor_hex, fontWeight: FontWeight.semibold },
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
        <Pressable style={styles.cancelButton} onPress={dismiss}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>

        <Pressable
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSalvar}
          disabled={saving}
        >
          <LinearGradient
            colors={isConjunta ? ["#9333EA", "#C084FC"] : ["#4F46E5", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveGradient}
          >
            {saving ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? "Salvar" : "Salvar"}
              </Text>
            )}
          </LinearGradient>
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
    backgroundColor: "#F1F5F9",
    borderRadius: BorderRadius.xl, // 20px
    padding: 6,
    marginBottom: 24,
  },
  tipoButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  tipoButtonActiveExpense: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  tipoButtonActiveIncome: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  tipoText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.textGray,
  },
  tipoTextActiveExpense: {
    color: Colors.error,
  },
  tipoTextActiveIncome: {
    color: Colors.success,
  },
  valorInput: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    width: "100%",
    marginBottom: 20,
    paddingVertical: 10,
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
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
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
    flexDirection: "row",
    padding: Spacing.xl,
    paddingBottom: 35,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    ...Shadow.md,
  },
  saveGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  contextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  contextCardActivePersonal: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "05",
  },
  contextCardActiveJoint: {
    borderColor: Colors.jointPrimary,
    backgroundColor: Colors.jointPrimary + "05",
  },
  contextIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  contextTextContainer: {
    flex: 1,
    gap: 2,
  },
  contextTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  contextSubtitle: {
    fontSize: 12,
    color: Colors.textGray,
  },
  contextRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  contextRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
});