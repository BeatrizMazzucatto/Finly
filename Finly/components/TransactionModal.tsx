import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { getCategories, Category } from "@/src/services/categories";

export type TransactionPayload = {
  titulo: string;
  tipo: "RECEITA" | "DESPESA";
  valor: number;
  categoria: string;
  id_categoria: number;
  carteira: "PESSOAL" | "CONJUNTA";
};

type TransactionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: TransactionPayload) => Promise<void>;
  hasJointWallet?: boolean;
};

export function TransactionModal({ visible, onClose, onSave, hasJointWallet = false }: TransactionModalProps) {
  const [txTipo, setTxTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [txValor, setTxValor] = useState("");
  const [txTitulo, setTxTitulo] = useState("");
  const [txCarteira, setTxCarteira] = useState<"PESSOAL" | "CONJUNTA">("PESSOAL");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Reseta os campos toda vez que o modal é fechado
  useEffect(() => {
    if (!visible) {
      setTxValor("");
      setTxTitulo("");
      setTxTipo("DESPESA");
      setTxCarteira("PESSOAL");
      setSelectedCategoryId(null);
    }
  }, [visible]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const loaded = await getCategories();
        setCategories(loaded);
        if (loaded.length > 0) {
          setSelectedCategoryId(loaded[0].id_categoria);
        }
      } catch {
        setCategories([]);
      }
    }
    if (visible) loadCategories();
  }, [visible]);
    if (!visible) {
      setTxValor("");
      setTxTitulo("");
      setTxTipo("DESPESA");
      setTxCategoria("Alimentação");
      setTxCarteira("PESSOAL");
    }
  }, [visible]);

  const handleClose = () => {
    // Reseta imediatamente antes de fechar
    setTxValor("");
    setTxTitulo("");
    setTxTipo("DESPESA");
    setTxCategoria("Alimentação");
    setTxCarteira("PESSOAL");
    onClose();
  };

  const handleSave = async () => {
    if (!txValor || !txTitulo || !selectedCategoryId) {
      Alert.alert("Erro", "Preencha valor, título e categoria");
      return;
    }

    const selectedCategory = categories.find((category) => category.id_categoria === selectedCategoryId);

    try {
      await onSave({
        titulo: txTitulo,
        tipo: txTipo,
        valor: Number(txValor),
        categoria: selectedCategory?.nome ?? "Outros",
        id_categoria: selectedCategoryId,
        carteira: txCarteira,
      });

      // Reset state after successful save
      setTxValor("");
      setTxTitulo("");
      setTxTipo("DESPESA");
      setTxCarteira("PESSOAL");
      if (categories.length > 0) {
        setSelectedCategoryId(categories[0].id_categoria);
      }
    } catch (err) {
      // Error handling is managed by the parent, but we won't reset state if it fails
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Transação</Text>
            <Pressable onPress={handleClose} hitSlop={15}>
              <Feather name="x" size={24} color="#64748B" />
            </Pressable>
          </View>
          
          <View style={styles.typeSelector}>
            <Pressable style={[styles.typeBtn, txTipo === 'DESPESA' && styles.typeBtnActiveDesp]} onPress={() => setTxTipo('DESPESA')}>
              <Text style={{color: txTipo === 'DESPESA' ? 'white' : '#64748B', fontWeight: 'bold'}}>Despesa</Text>
            </Pressable>
            <Pressable style={[styles.typeBtn, txTipo === 'RECEITA' && styles.typeBtnActiveRec]} onPress={() => setTxTipo('RECEITA')}>
              <Text style={{color: txTipo === 'RECEITA' ? 'white' : '#64748B', fontWeight: 'bold'}}>Receita</Text>
            </Pressable>
          </View>
          
          {hasJointWallet && (
            <>
              <Text style={styles.label}>Para qual conta?</Text>
              <View style={styles.typeSelector}>
                <Pressable style={[styles.typeBtn, txCarteira === 'PESSOAL' && styles.typeBtnActivePersonal]} onPress={() => setTxCarteira('PESSOAL')}>
                  <Text style={{color: txCarteira === 'PESSOAL' ? 'white' : '#64748B', fontWeight: 'bold'}}>Minha Conta</Text>
                </Pressable>
                <Pressable style={[styles.typeBtn, txCarteira === 'CONJUNTA' && styles.typeBtnActiveJoint]} onPress={() => setTxCarteira('CONJUNTA')}>
                  <Text style={{color: txCarteira === 'CONJUNTA' ? 'white' : '#64748B', fontWeight: 'bold'}}>Conta Conjunta</Text>
                </Pressable>
              </View>
            </>
          )}

          <Text style={styles.label}>Valor</Text>
          <TextInput style={styles.input} placeholder="Ex: 150" value={txValor} onChangeText={setTxValor} keyboardType="numeric" />

          <Text style={styles.label}>Título da Transação</Text>
          <TextInput style={styles.input} placeholder="Ex: Supermercado" value={txTitulo} onChangeText={setTxTitulo} />

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const selected = selectedCategoryId === category.id_categoria;
              return (
                <Pressable
                  key={category.id_categoria}
                  style={[styles.categoryPill, selected && styles.categoryPillSelected]}
                  onPress={() => setSelectedCategoryId(category.id_categoria)}
                >
                  <Feather name={category.icone as any} size={18} color={selected ? '#fff' : category.cor_hex} />
                  <Text style={[styles.categoryPillText, selected && { color: '#fff' }]} numberOfLines={1}>
                    {category.nome}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.btnMain, styles.btnCancel]} onPress={handleClose}>
              <Text style={[styles.btnMainText, {color: '#0F172A'}]}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.btnMain} onPress={handleSave}>
              <Text style={styles.btnMainText}>Salvar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20},
  modalTitle: {fontSize: 20, fontWeight: 'bold'},
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#F1F5F9' },
  typeBtnActiveDesp: { backgroundColor: '#EF4444' },
  typeBtnActiveRec: { backgroundColor: '#10B981' },
  typeBtnActivePersonal: { backgroundColor: '#4F46E5' },
  typeBtnActiveJoint: { backgroundColor: '#9333EA' },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20, color: '#0F172A' },
  actionRow: {flexDirection: 'row', gap: 12, marginTop: 10},
  btnMain: { flex: 1, backgroundColor: '#4F46E5', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { backgroundColor: '#F1F5F9' },
  btnMainText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 100,
    marginRight: 10,
    marginBottom: 10,
  },
  categoryPillSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryPillText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    flexShrink: 1,
  },
});
