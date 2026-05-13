import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CategoryCardProps = {
  category: string;
  value: number;
  formatCurrency: (value: number) => string;
};

export function CategoryCard({ category, value, formatCurrency }: CategoryCardProps) {
  return (
    <View style={styles.catCard}>
      <Text style={styles.catTitle}>{category}</Text>
      <Text style={styles.catValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  catCard: { 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 16, 
    minWidth: 120, 
    shadowColor: '#000', 
    shadowOpacity: 0.03, 
    shadowRadius: 5, 
    elevation: 1 
  },
  catTitle: { 
    fontWeight: 'bold', 
    fontSize: 15, 
    color: '#0F172A', 
    marginBottom: 4 
  },
  catValue: { 
    color: '#64748B', 
    fontSize: 12 
  }
});
