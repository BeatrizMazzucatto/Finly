import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Chip } from '@/components/ui/Chip';
import { Colors } from '@/constants/theme';

describe('Chip', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renderiza o label', () => {
    const { getByText } = render(<Chip label="Receitas" />);
    expect(getByText('Receitas')).toBeTruthy();
  });

  it('chama onPress quando pressionável', () => {
    const { getByText } = render(
      <Chip label="Despesas" onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Despesas'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renderiza como View estático sem onPress', () => {
    const { getByText } = render(<Chip label="Fixo" />);
    expect(getByText('Fixo')).toBeTruthy();
  });

  it('aplica estilo selecionado para chip padrão', () => {
    const { getByText } = render(
      <Chip label="Todos" selected onPress={mockOnPress} />
    );

    const label = getByText('Todos');
    expect(label.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: Colors.textInverse }),
      ])
    );
  });

  it('aplica estilo especial para chip "Conjuntas" selecionado', () => {
    const { getByText } = render(
      <Chip label="Conjuntas" selected onPress={mockOnPress} />
    );

    const label = getByText('Conjuntas');
    expect(label.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: Colors.textInverse }),
      ])
    );
  });

  it('aplica estilo especial para chip "Conjuntas" não selecionado', () => {
    const { getByText } = render(
      <Chip label="Conjuntas" onPress={mockOnPress} />
    );

    const label = getByText('Conjuntas');
    expect(label.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: Colors.jointPrimary }),
      ])
    );
  });

  it('renderiza com ícone', () => {
    const { getByText } = render(
      <Chip label="Filtro" icon="filter" onPress={mockOnPress} />
    );
    expect(getByText('Filtro')).toBeTruthy();
  });
});
