import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '@/src/types/api';

type TransactionItemProps = {
  transaction: Transaction;
  formatCurrency: (value: number) => string;
  formatDate: (dateStr: string) => string;
};

export function TransactionItem({ 
  transaction,
  formatCurrency,
  formatDate
}: TransactionItemProps) {
  const { titulo, categoria, tipo, valor, data_transacao } = transaction;
  const isRec = tipo === "RECEITA";
  
  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: isRec ? '#D1FAE5' : '#FEE2E2' }]}>
        <Text style={{fontSize: 16, color: isRec ? '#10B981' : '#EF4444'}}>{isRec ? '+' : '-'}</Text>
      </View>
      <View style={{flex: 1}}>
        <Text style={{fontWeight: 'bold', fontSize: 15, color: '#0F172A'}}>{titulo}</Text>
        <Text style={{color: '#64748B', fontSize: 12}}>
          {categoria || 'Sem categoria'} • {formatDate(data_transacao)}
        </Text>
      </View>
      <Text style={{fontWeight: 'bold', fontSize: 15, color: isRec ? '#10B981' : '#0F172A'}}>
        {isRec ? '+' : '-'} {formatCurrency(Number(valor))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12 },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
});
