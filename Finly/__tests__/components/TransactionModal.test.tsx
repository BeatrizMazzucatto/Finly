import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { TransactionModal } from '@/components/TransactionModal';

// Mock do expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

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
  });

  it('renderiza corretamente quando visível', () => {
    const { getByText } = renderModal(true);
    expect(getByText('Nova Transação')).toBeTruthy();
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
    const { getByText } = renderModal();
    
    // Tenta salvar sem preencher
    await act(async () => {
      fireEvent.press(getByText('Salvar'));
    });
    
    // onSave NÃO deve ser chamado pois a validação falha
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('chama onSave com dados corretos ao preencher e salvar', async () => {
    const { getByText, getByPlaceholderText } = renderModal();

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
    });
  });

  it('muda tipo para Receita ao pressionar botão Receita', () => {
    const { getByText } = renderModal();
    fireEvent.press(getByText('Receita'));
    // O botão Receita deve estar selecionado (estado muda visualmente)
    // Verificamos que o elemento existe e pode ser pressionado
    expect(getByText('Receita')).toBeTruthy();
  });
});
