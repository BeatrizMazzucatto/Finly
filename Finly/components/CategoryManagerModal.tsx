import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator, Alert, Platform, AlertButton } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from "@/constants/theme";
import { Category, createCategory, updateCategory, deleteCategory } from "@/src/services/categories";

interface CategoryManagerModalProps {
  visible: boolean;
  onClose: () => void;
  categorias: Category[];
  idCarteira: number;
  onCategoriesChanged: () => void;
}

const ICONS = [
  // Básicos e Comuns
  "coffee", "shopping-cart", "shopping-bag", "home", "file-text", 
  "truck", "droplet", "heart", "plus-square", "book", 
  "film", "tv", "music", "camera", "monitor", "smartphone",
  
  // Vestuário e Pessoal
  "scissors", "smile", "user", "users", "watch", "gift", "umbrella",
  
  // Finanças e Negócios
  "dollar-sign", "trending-up", "award", "briefcase", "credit-card", 
  "pocket", "pie-chart", "bar-chart", "activity", "percent",
  
  // Tecnologia e Utilidades
  "navigation", "map-pin", "repeat", "tag", "tool", "zap", 
  "star", "settings", "shield", "key", "box", "wifi", 
  "battery", "mic", "headphones", "link", "paperclip", "folder",
  
  // Tempo e Natureza
  "calendar", "clock", "sun", "moon", "cloud", "wind"
];

const COLORS = [
  "#3B82F6", "#3A8F31", "#F59E0B", "#D6492B", 
  "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6"
];

const showAlert = (title: string, message: string, options?: AlertButton[]) => {
  if (Platform.OS === "web") {
    if (options && options.length > 1) {
      const confirm = window.confirm(`${title}\n\n${message}`);
      if (confirm) {
        options.find(o => o.style === 'destructive' || o.text === 'Apagar')?.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, options);
  }
};

export function CategoryManagerModal({ visible, onClose, categorias, idCarteira, onCategoriesChanged }: CategoryManagerModalProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("tag");
  const [corHex, setCorHex] = useState(COLORS[0]);

  const openForm = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setNome(cat.nome);
      setIcone(cat.icone || "tag");
      setCorHex(cat.cor_hex || COLORS[0]);
    } else {
      setEditingCategory(null);
      setNome("");
      setIcone("tag");
      setCorHex(COLORS[0]);
    }
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingCategory(null);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      showAlert("Erro", "Nome da categoria é obrigatório.");
      return;
    }
    setLoading(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id_categoria, { nome, icone, cor_hex: corHex });
      } else {
        await createCategory({ nome, icone, cor_hex: corHex, id_carteira: idCarteira });
      }
      onCategoriesChanged();
      closeForm();
    } catch (err: any) {
      showAlert("Erro", err.message || "Erro ao salvar categoria.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    showAlert("Excluir Categoria", "Tem certeza que deseja excluir esta categoria?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          setLoading(true);
          try {
            await deleteCategory(id);
            onCategoriesChanged();
          } catch (err: any) {
            showAlert("Erro", err.message || "Erro ao excluir categoria. Ela pode estar em uso.");
          } finally {
            setLoading(false);
          }
      }}
    ]);
  };

  if (isFormVisible) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={closeForm} style={styles.iconButton}>
              <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.label}>NOME</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Assinaturas"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>COR</Text>
            <View style={styles.colorGrid}>
              {COLORS.map(color => (
                <Pressable
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color }, corHex === color && styles.colorSelected]}
                  onPress={() => setCorHex(color)}
                >
                  {corHex === color && <Feather name="check" size={16} color="white" />}
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>ÍCONE</Text>
            <View style={styles.iconGrid}>
              {ICONS.map(icon => (
                <Pressable
                  key={icon}
                  style={[styles.iconCell, icone === icon && { backgroundColor: corHex + '30', borderColor: corHex }]}
                  onPress={() => setIcone(icon)}
                >
                  <Feather name={icon as any} size={24} color={icone === icon ? corHex : Colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Pressable style={[styles.saveButton, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Gerenciar Categorias</Text>
          <Pressable onPress={onClose} style={styles.iconButton}>
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView style={styles.content}>
          {categorias.map(cat => (
            <View key={cat.id_categoria} style={styles.catRow}>
              <View style={[styles.catIconContainer, { backgroundColor: cat.cor_hex + '20' }]}>
                <Feather name={cat.icone as any} size={20} color={cat.cor_hex} />
              </View>
              <Text style={styles.catName}>{cat.nome}</Text>
              {cat.id_carteira && (
                <View style={styles.actionRow}>
                  <Pressable onPress={() => openForm(cat)} style={styles.actionBtn}>
                    <Feather name="edit-2" size={18} color={Colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(cat.id_categoria)} style={styles.actionBtn}>
                    <Feather name="trash-2" size={18} color={Colors.error} />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={styles.addButton} onPress={() => openForm()}>
            <Feather name="plus" size={20} color="white" />
            <Text style={styles.saveButtonText}>Criar Nova Categoria</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  iconButton: { padding: Spacing.sm },
  content: { flex: 1, padding: Spacing.lg },
  catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  catIconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  catName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { padding: Spacing.sm },
  footer: { padding: Spacing.xl, backgroundColor: Colors.surface, borderTopWidth: 1, borderColor: Colors.border },
  addButton: { flexDirection: 'row', backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, ...Shadow.sm },
  saveButton: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  saveButtonText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  input: { backgroundColor: '#F1F5F9', borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorSelected: { borderWidth: 2, borderColor: Colors.textPrimary },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  iconCell: { width: 50, height: 50, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }
});
