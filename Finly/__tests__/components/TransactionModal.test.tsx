import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { TransactionModal } from '@/components/TransactionModal';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/src/services/categories', () => ({
  getCategories: jest.fn(),
}));

import { getCategories } from '@/src/services/categories';

const mockGetCategories = getCategories as jest.MockedFunction<typeof getCategories>;

const mockCategories = [
  { id_categoria: 1, nome: 'Alimentação', cor_hex: '#F59E0B', icone: 'coffee' },
];

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

function renderModal(visible = true) {
  return render(
    <TransactionModal
      visible={visible}
      onClose={mockOnClose}
      onSave={mockOnSave}
    />
  );
}

describe('TransactionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
    mockGetCategories.mockResolvedValue(mockCategories);
  });

  it('renderiza corretamente quando visível', async () => {
    const { getByText } = renderModal(true);
    expect(getByText('Nova Transação')).toBeTruthy();
    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());
  });

  it('não renderiza conteúdo quando invisível', () => {
    const { queryByText } = renderModal(false);
    expect(queryByText('Nova Transação')).toBeNull();
  });

  it('exibe botões Cancelar e Salvar', () => {
    const { getByText } = renderModal();
    expect(getByText('Cancelar')).toBeTruthy();
    expect(getByText('Salvar')).toBeTruthy();
  });

  it('exibe seletores de tipo Despesa e Receita', () => {
    const { getByText } = renderModal();
    expect(getByText('Despesa')).toBeTruthy();
    expect(getByText('Receita')).toBeTruthy();
  });

  it('chama onClose ao pressionar botão Cancelar', () => {
    const { getByText } = renderModal();
    fireEvent.press(getByText('Cancelar'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('exibe alerta de erro ao tentar salvar sem campos preenchidos', async () => {
    mockGetCategories.mockResolvedValue([]);
    const { getByText } = renderModal();

    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());

    await act(async () => {
      fireEvent.press(getByText('Salvar'));
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('chama onSave com dados corretos ao preencher e salvar', async () => {
    const { getByText, getByPlaceholderText } = renderModal();

    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());

    fireEvent.changeText(getByPlaceholderText('Ex: 150'), '100');
    fireEvent.changeText(getByPlaceholderText('Ex: Supermercado'), 'Mercado');

    await act(async () => {
      fireEvent.press(getByText('Salvar'));
    });

    expect(mockOnSave).toHaveBeenCalledWith({
      titulo: 'Mercado',
      tipo: 'DESPESA',
      valor: 100,
      categoria: 'Alimentação',
      id_categoria: 1,
      carteira: 'PESSOAL',
    });
  });

  it('muda tipo para Receita ao pressionar botão Receita', () => {
    const { getByText } = renderModal();

    fireEvent.press(getByText('Receita'));

    expect(getByText('Receita')).toBeTruthy();
  });
});
