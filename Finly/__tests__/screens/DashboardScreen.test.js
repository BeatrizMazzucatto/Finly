import React from 'react';
import { render } from '@testing-library/react-native';
import DashboardScreen from '@/src/screens/DashBoardScreen';

// Mock dos componentes filhos para isolar o DashboardScreen
jest.mock('@/src/components/Header', () => {
  const { View, Text } = require('react-native');
  return function MockHeader() {
    return (
      <View>
        <Text>Statistics</Text>
      </View>
    );
  };
});

jest.mock('@/src/components/Chart', () => {
  const { View, Text } = require('react-native');
  return function MockChart() {
    return (
      <View>
        <Text>Chart</Text>
      </View>
    );
  };
});

jest.mock('@/src/components/TopMovers', () => {
  const { View, Text } = require('react-native');
  return function MockTopMovers() {
    return (
      <View>
        <Text>Top Movers</Text>
        <Text>Food</Text>
        <Text>Health</Text>
        <Text>Car</Text>
      </View>
    );
  };
});

jest.mock('@/src/components/TransactionItem', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return function MockTransactionItem({ item }) {
    return (
      <View>
        <Text>{item.name}</Text>
        <Text>{item.category}</Text>
      </View>
    );
  };
});

jest.mock('@/src/data/transactions', () => [
  { id: '1', name: 'Starbucks', category: 'Food', value: 15.38 },
  { id: '2', name: 'H&M', category: 'Shopping', value: 258.65 },
  { id: '3', name: 'Spotify', category: 'Subscription', value: 9.99 },
]);

describe('DashboardScreen', () => {
  it('renderiza sem erros', () => {
    expect(() => render(<DashboardScreen />)).not.toThrow();
  });

  it('exibe o título "Transactions"', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Transactions')).toBeTruthy();
  });

  it('renderiza o componente Header', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Statistics')).toBeTruthy();
  });

  it('renderiza o componente Chart', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Chart')).toBeTruthy();
  });

  it('renderiza o componente TopMovers', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Top Movers')).toBeTruthy();
  });

  it('renderiza itens da lista de transações', () => {
    const { getByText } = render(<DashboardScreen />);

    expect(getByText('Starbucks')).toBeTruthy();
    expect(getByText('H&M')).toBeTruthy();
    expect(getByText('Spotify')).toBeTruthy();
  });

  it('renderiza categorias das transações', () => {
    const { getAllByText, getByText } = render(<DashboardScreen />);

    expect(getAllByText('Food').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Shopping')).toBeTruthy();
    expect(getByText('Subscription')).toBeTruthy();
  });

  it('lista contém todos os itens do mock (3 transações)', () => {
    const { getAllByText } = render(<DashboardScreen />);

    expect(getAllByText('Starbucks').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('H&M').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Spotify').length).toBeGreaterThanOrEqual(1);
  });
});