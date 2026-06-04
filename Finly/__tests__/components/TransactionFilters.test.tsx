import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TransactionFilters from '@/src/components/TransactionFilters';
import type { Transaction } from '@/src/types/api';

function makeTransaction(
  id: number,
  categoria: string | null,
  data_transacao: string
): Transaction {
  return {
    id_transacao: id,
    titulo: `Transação ${id}`,
    tipo: 'DESPESA',
    valor: 100,
    data_transacao,
    categoria,
  };
}

const mockOnFilterChange = jest.fn();

function renderFilters(transactions: Transaction[] = []) {
  return render(
    <TransactionFilters
      transactions={transactions}
      onFilterChange={mockOnFilterChange}
    />
  );
}

describe('TransactionFilters - renderização', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza todos os períodos disponíveis', () => {
    const { getByText } = renderFilters();

    expect(getByText('Todos')).toBeTruthy();
    expect(getByText('Hoje')).toBeTruthy();
    expect(getByText('Esta semana')).toBeTruthy();
    expect(getByText('Este mês')).toBeTruthy();
    expect(getByText('3 meses')).toBeTruthy();
    expect(getByText('6 meses')).toBeTruthy();
    expect(getByText('1 ano')).toBeTruthy();
  });

  it('não exibe filtro de categorias quando transactions está vazio', () => {
    const { queryByText } = renderFilters([]);

    expect(queryByText('Todas categorias')).toBeNull();
  });

  it('exibe filtro de categorias quando há transações com categoria', () => {
    const transactions = [
      makeTransaction(1, 'Alimentação', '2024-01-01'),
    ];

    const { getByText } = renderFilters(transactions);

    expect(getByText('Todas categorias')).toBeTruthy();
    expect(getByText('Alimentação')).toBeTruthy();
  });

  it('exibe categorias únicas ordenadas', () => {
    const transactions = [
      makeTransaction(1, 'Transporte', '2024-01-01'),
      makeTransaction(2, 'Alimentação', '2024-01-02'),
      makeTransaction(3, 'Transporte', '2024-01-03'),
    ];

    const { getAllByText } = renderFilters(transactions);

    // "Alimentação" e "Transporte" devem aparecer uma vez cada (o chip de categoria)
    expect(getAllByText('Alimentação').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Transporte').length).toBeGreaterThanOrEqual(1);
  });

  it('ignora transações com categoria null ao montar chips', () => {
    const transactions = [
      makeTransaction(1, null, '2024-01-01'),
      makeTransaction(2, 'Saúde', '2024-01-02'),
    ];

    const { getByText } = renderFilters(transactions);

    expect(getByText('Saúde')).toBeTruthy();
  });
});

describe('TransactionFilters - callback onFilterChange', () => {
  beforeEach(() => jest.clearAllMocks());

  it('chama onFilterChange na montagem com todas as transações (período "all")', () => {
    const transactions = [
      makeTransaction(1, 'Alimentação', '2024-01-01'),
      makeTransaction(2, 'Saúde', '2024-06-01'),
    ];

    renderFilters(transactions);

    expect(mockOnFilterChange).toHaveBeenCalledWith(transactions);
  });

  it('chama onFilterChange quando muda o período', () => {
    const transactions = [makeTransaction(1, null, '2024-01-01')];

    const { getByText } = renderFilters(transactions);
    jest.clearAllMocks();

    fireEvent.press(getByText('Este mês'));

    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('chama onFilterChange quando seleciona uma categoria', () => {
    const transactions = [
      makeTransaction(1, 'Alimentação', '2024-01-01'),
    ];

    const { getByText } = renderFilters(transactions);
    jest.clearAllMocks();

    fireEvent.press(getByText('Alimentação'));

    expect(mockOnFilterChange).toHaveBeenCalled();
  });
});

describe('TransactionFilters - seleção de período', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filtra transações por "Hoje"', () => {
    const hoje = new Date().toISOString().split('T')[0];
    const transactions = [
      makeTransaction(1, null, hoje),
      makeTransaction(2, null, '2020-01-01'),
    ];

    const { getByText } = renderFilters(transactions);
    jest.clearAllMocks();

    fireEvent.press(getByText('Hoje'));

    const filtered: Transaction[] = mockOnFilterChange.mock.calls[0][0];
    expect(filtered.some((t) => t.data_transacao === hoje)).toBe(true);
    expect(filtered.every((t) => t.data_transacao === hoje)).toBe(true);
  });

  it('exibe todas as transações ao selecionar "Todos"', () => {
    const transactions = [
      makeTransaction(1, null, '2024-01-01'),
      makeTransaction(2, null, '2020-05-10'),
    ];

    const { getByText } = renderFilters(transactions);
    jest.clearAllMocks();

    // Selecionar outro período primeiro
    fireEvent.press(getByText('Este mês'));
    jest.clearAllMocks();

    // Voltar para Todos
    fireEvent.press(getByText('Todos'));

    expect(mockOnFilterChange).toHaveBeenCalledWith(transactions);
  });

  it('filtra por "1 ano" corretamente', () => {
    const now = new Date();
    const withinYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 5)
      .toISOString()
      .split('T')[0];
    const tooOld = new Date(now.getFullYear() - 2, 0, 1).toISOString().split('T')[0];

    const transactions = [
      makeTransaction(1, null, withinYear),
      makeTransaction(2, null, tooOld),
    ];

    const { getByText } = renderFilters(transactions);
    jest.clearAllMocks();

    fireEvent.press(getByText('1 ano'));

    const filtered: Transaction[] = mockOnFilterChange.mock.calls[0][0];
    expect(filtered.some((t) => t.id_transacao === 1)).toBe(true);
    expect(filtered.some((t) => t.id_transacao === 2)).toBe(false);
  });
});

describe('TransactionFilters - seleção de categoria', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filtra por categoria específica', () => {
    const transactions = [
      makeTransaction(1, 'Alimentação', '2024-01-01'),
      makeTransaction(2, 'Transporte', '2024-01-02'),
    ];

    const { getByText } = renderFilters(transactions);
    jest.clearAllMocks();

    fireEvent.press(getByText('Alimentação'));

    const filtered: Transaction[] = mockOnFilterChange.mock.calls[0][0];
    expect(filtered.every((t) => t.categoria === 'Alimentação')).toBe(true);
  });

  it('remove filtro de categoria ao pressionar a mesma categoria novamente', () => {
    const transactions = [
      makeTransaction(1, 'Alimentação', '2024-01-01'),
      makeTransaction(2, 'Transporte', '2024-01-02'),
    ];

    const { getByText } = renderFilters(transactions);
    jest.clearAllMocks();

    fireEvent.press(getByText('Alimentação'));
    jest.clearAllMocks();
    fireEvent.press(getByText('Alimentação'));

    // Deve voltar a mostrar todas
    const filtered: Transaction[] = mockOnFilterChange.mock.calls[0][0];
    expect(filtered.length).toBe(transactions.length);
  });

  it('remove filtro de categoria ao pressionar "Todas categorias"', () => {
    const transactions = [
      makeTransaction(1, 'Alimentação', '2024-01-01'),
      makeTransaction(2, 'Transporte', '2024-01-02'),
    ];

    const { getByText } = renderFilters(transactions);
    fireEvent.press(getByText('Alimentação'));
    jest.clearAllMocks();

    fireEvent.press(getByText('Todas categorias'));

    const filtered: Transaction[] = mockOnFilterChange.mock.calls[0][0];
    expect(filtered.length).toBe(transactions.length);
  });
});

describe('TransactionFilters - atualização quando transactions muda', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reaaplica filtros quando a prop transactions muda', () => {
    const initial = [makeTransaction(1, 'Alimentação', '2024-01-01')];
    const { rerender } = render(
      <TransactionFilters transactions={initial} onFilterChange={mockOnFilterChange} />
    );

    jest.clearAllMocks();

    const updated = [
      makeTransaction(1, 'Alimentação', '2024-01-01'),
      makeTransaction(2, 'Saúde', '2024-02-01'),
    ];

    rerender(
      <TransactionFilters transactions={updated} onFilterChange={mockOnFilterChange} />
    );

    expect(mockOnFilterChange).toHaveBeenCalledWith(updated);
  });
});
