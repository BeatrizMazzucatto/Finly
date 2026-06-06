import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { useTransactionSync } from '@/src/services/transactions';
import { TransactionItem } from '@/components/ui/TransactionItem';

jest.mock('@/src/services/api', () => ({
  API_BASE_URL: 'http://localhost:3000',
  apiRequest: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

import { apiRequest } from '@/src/services/api';

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const apiTransactions = [
  {
    id_transacao: 10,
    titulo: 'Supermercado',
    tipo: 'DESPESA' as const,
    valor: 250,
    data_transacao: '2024-06-01',
    categoria: 'Alimentação',
    id_carteira: 1,
  },
  {
    id_transacao: 11,
    titulo: 'Salário',
    tipo: 'RECEITA' as const,
    valor: 5000,
    data_transacao: '2024-06-05',
    categoria: 'Salário',
    id_carteira: 1,
  },
];

function TransactionsListProbe({ userId }: { userId: number }) {
  const { transactions, loading } = useTransactionSync(userId);

  if (loading) return <Text testID="loading">loading</Text>;

  return (
    <View>
      {transactions.map((tx) => (
        <TransactionItem
          key={tx.id_transacao}
          id={tx.id_transacao}
          titulo={tx.titulo}
          valor={tx.valor}
          tipo={tx.tipo}
          categoria={tx.categoria ?? 'Outros'}
          data={tx.data_transacao}
        />
      ))}
    </View>
  );
}

describe('Integração: sincronização e exibição de transações', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue(apiTransactions);
  });

  it('busca transações na API e renderiza lista de TransactionItem', async () => {
    const { findByText, findAllByText, queryByTestId } = render(<TransactionsListProbe userId={1} />);

    expect(await findByText('Supermercado')).toBeTruthy();
    expect((await findAllByText('Salário')).length).toBeGreaterThanOrEqual(1);
    expect(queryByTestId('loading')).toBeNull();
    expect(mockApiRequest).toHaveBeenCalledWith('/transacoes/1');
  });

  it('retorna lista vazia quando API responde com mensagem em vez de array', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Nenhuma transação' });

    const { queryByText, queryByTestId } = render(<TransactionsListProbe userId={2} />);

    await waitFor(() => expect(queryByTestId('loading')).toBeNull());
    expect(queryByText('Supermercado')).toBeNull();
  });

  it('atualiza lista após novo polling', async () => {
    jest.useFakeTimers();
    mockApiRequest
      .mockResolvedValueOnce([apiTransactions[0]])
      .mockResolvedValueOnce(apiTransactions);

    const { getByText, getAllByText, queryByText } = render(<TransactionsListProbe userId={1} />);

    await waitFor(() => expect(getByText('Supermercado')).toBeTruthy());
    expect(queryByText('Salário')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await waitFor(() => expect(getAllByText('Salário').length).toBeGreaterThanOrEqual(1));
    expect(mockApiRequest).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
