import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TransactionItem } from '@/components/ui/TransactionItem';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

describe('TransactionItem', () => {
  const baseProps = {
    id: 1,
    titulo: 'Supermercado',
    valor: 150,
    tipo: 'DESPESA' as const,
    categoria: 'Alimentação',
    data: '2024-06-01',
  };

  it('exibe título e categoria', () => {
    const { getByText } = render(<TransactionItem {...baseProps} />);
    expect(getByText('Supermercado')).toBeTruthy();
    expect(getByText('Alimentação')).toBeTruthy();
  });

  it('exibe valor de despesa com sinal negativo', () => {
    const { getByText } = render(<TransactionItem {...baseProps} />);
    expect(getByText(/-/)).toBeTruthy();
  });

  it('exibe valor de receita com sinal positivo', () => {
    const { getByText, getAllByText } = render(
      <TransactionItem {...baseProps} tipo="RECEITA" titulo="Salário" categoria="Salário" valor={3000} />
    );
    expect(getByText(/\+/)).toBeTruthy();
    expect(getAllByText('Salário').length).toBeGreaterThanOrEqual(1);
  });

  it('exibe badge CONJUNTO para carteira 3', () => {
    const { getByText } = render(
      <TransactionItem {...baseProps} id_carteira={3} usuario_nome="Maria" />
    );
    expect(getByText('CONJUNTO')).toBeTruthy();
    expect(getByText(/Maria registrou/)).toBeTruthy();
  });

  it('chama onPress ao ser pressionável', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TransactionItem {...baseProps} onPress={onPress} />
    );
    fireEvent.press(getByText('Supermercado'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('chama onEdit e onDelete quando showActions', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <TransactionItem
        {...baseProps}
        showActions
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    const TouchableOpacity = require('react-native').TouchableOpacity;
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 2]);
    fireEvent.press(buttons[buttons.length - 1]);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
