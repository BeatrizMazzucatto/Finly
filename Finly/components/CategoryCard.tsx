import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getCategoryIcon, getCategoryColor } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatters';

type CategoryCardProps = {
  category: string;
  value: number;
};

export const CategoryCard = memo(function CategoryCard({ category, value }: CategoryCardProps) {
  const iconName = getCategoryIcon(category);
  const color = getCategoryColor(category);

  return (
    <View style={styles.catCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Feather name={iconName} size={22} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.catTitle} numberOfLines={2}>{category}</Text>
        <Text style={styles.catValue}>{formatCurrency(value)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  catCard: { 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 20, 
    width: 145,
    minHeight: 130,
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, 
    elevation: 2,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  catTitle: { 
    fontWeight: '600', 
    fontSize: 14, 
    color: '#475569', 
    marginBottom: 6,
    lineHeight: 18,
  },
  catValue: { 
    color: '#0F172A', 
    fontSize: 16,
    fontWeight: '800'
  }
});
