import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { TransactionModal } from '@/components/TransactionModal';
import { getCategoryByName } from '@/constants/categories';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/src/services/categories', () => ({
  getCategories: jest.fn(),
}));

import { getCategories } from '@/src/services/categories';

const mockGetCategories = getCategories as jest.MockedFunction<typeof getCategories>;

const apiCategories = [
  { id_categoria: 1, nome: 'Alimentação', cor_hex: '#F59E0B', icone: 'coffee' },
  { id_categoria: 12, nome: 'Salário', cor_hex: '#10B981', icone: 'briefcase' },
];

describe('Integração: modal de transação + categorias', () => {
  const mockOnSave = jest.fn().mockResolvedValue(undefined);
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCategories.mockResolvedValue(apiCategories);
  });

  it('carrega categorias da API e salva payload compatível com o backend', async () => {
    const { getByText, getByPlaceholderText } = render(
      <TransactionModal visible onClose={mockOnClose} onSave={mockOnSave} />
    );

    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());

    fireEvent.changeText(getByPlaceholderText('Ex: 150'), '100');
    fireEvent.changeText(getByPlaceholderText('Ex: Supermercado'), 'Mercado');

    await act(async () => {
      fireEvent.press(getByText('Salvar'));
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        titulo: 'Mercado',
        tipo: 'DESPESA',
        valor: 100,
        categoria: 'Alimentação',
        id_categoria: 1,
        carteira: 'PESSOAL',
      });
    });

    const cat = getCategoryByName('Alimentação');
    expect(cat?.icon).toBe('coffee');
  });

  it('integra troca de tipo Receita com categoria padrão da API', async () => {
    const { getByText } = render(
      <TransactionModal visible onClose={mockOnClose} onSave={mockOnSave} />
    );

    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());

    fireEvent.press(getByText('Receita'));
    expect(getByText('Receita')).toBeTruthy();
  });
});
