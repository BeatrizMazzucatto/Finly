import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renderiza o título', () => {
    const { getByText } = render(
      <Button title="Salvar" onPress={mockOnPress} />
    );
    expect(getByText('Salvar')).toBeTruthy();
  });

  it('chama onPress ao ser pressionado', () => {
    const { getByText } = render(
      <Button title="Entrar" onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Entrar'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('não chama onPress quando disabled', () => {
    const { getByText } = render(
      <Button title="Bloqueado" onPress={mockOnPress} disabled />
    );

    fireEvent.press(getByText('Bloqueado'));

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('não chama onPress quando loading', () => {
    const { UNSAFE_queryByType } = render(
      <Button title="Carregando" onPress={mockOnPress} loading />
    );

    const ActivityIndicator = require('react-native').ActivityIndicator;
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('exibe ActivityIndicator em vez do título quando loading', () => {
    const { queryByText, UNSAFE_queryByType } = render(
      <Button title="Carregando" onPress={mockOnPress} loading />
    );

    expect(queryByText('Carregando')).toBeNull();
    expect(UNSAFE_queryByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('renderiza com variante danger', () => {
    const { getByText } = render(
      <Button title="Excluir" onPress={mockOnPress} variant="danger" />
    );
    expect(getByText('Excluir')).toBeTruthy();
  });

  it('renderiza com variante outline', () => {
    const { getByText } = render(
      <Button title="Cancelar" onPress={mockOnPress} variant="outline" />
    );
    expect(getByText('Cancelar')).toBeTruthy();
  });

  it('renderiza com ícone à esquerda', () => {
    const { getByText } = render(
      <Button title="Adicionar" onPress={mockOnPress} icon="plus" />
    );
    expect(getByText('Adicionar')).toBeTruthy();
  });

  it('renderiza com ícone à direita', () => {
    const { getByText } = render(
      <Button
        title="Próximo"
        onPress={mockOnPress}
        icon="arrow-right"
        iconPosition="right"
      />
    );
    expect(getByText('Próximo')).toBeTruthy();
  });
});
