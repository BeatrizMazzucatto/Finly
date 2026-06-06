import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renderiza label quando fornecido', () => {
    const { getByText } = render(
      <Input label="E-mail" placeholder="seu@email.com" />
    );
    expect(getByText('E-mail')).toBeTruthy();
  });

  it('renderiza placeholder', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Digite seu nome" />
    );
    expect(getByPlaceholderText('Digite seu nome')).toBeTruthy();
  });

  it('exibe mensagem de erro', () => {
    const { getByText } = render(
      <Input label="Senha" error="Senha obrigatória" />
    );
    expect(getByText('Senha obrigatória')).toBeTruthy();
  });

  it('exibe hint quando não há erro', () => {
    const { getByText } = render(
      <Input label="Senha" hint="Mínimo 6 caracteres" />
    );
    expect(getByText('Mínimo 6 caracteres')).toBeTruthy();
  });

  it('prioriza erro sobre hint', () => {
    const { getByText, queryByText } = render(
      <Input error="Campo inválido" hint="Dica útil" />
    );
    expect(getByText('Campo inválido')).toBeTruthy();
    expect(queryByText('Dica útil')).toBeNull();
  });

  it('aceita digitação do usuário', () => {
    const mockOnChange = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Valor" onChangeText={mockOnChange} />
    );

    fireEvent.changeText(getByPlaceholderText('Valor'), '150,00');

    expect(mockOnChange).toHaveBeenCalledWith('150,00');
  });

  it('renderiza com ícone', () => {
    const { getByPlaceholderText } = render(
      <Input icon="mail" placeholder="E-mail" />
    );
    expect(getByPlaceholderText('E-mail')).toBeTruthy();
  });

  it('não renderiza label quando omitido', () => {
    const { queryByText } = render(
      <Input placeholder="Sem label" />
    );
    expect(queryByText('E-mail')).toBeNull();
  });
});
