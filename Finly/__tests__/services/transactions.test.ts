import {
  getTransactionsByUser,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/src/services/transactions';

jest.mock('@/src/services/api', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '@/src/services/api';

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const mockTransaction = {
  id_transacao: 1,
  titulo: 'Supermercado',
  tipo: 'DESPESA' as const,
  valor: 150.0,
  data_transacao: '2024-06-01',
  categoria: 'Alimentação',
};

describe('getTransactionsByUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna array de transações em caso de sucesso', async () => {
    mockApiRequest.mockResolvedValue([mockTransaction]);

    const result = await getTransactionsByUser(1);

    expect(result).toEqual([mockTransaction]);
  });

  it('chama apiRequest com a rota correta incluindo userId', async () => {
    mockApiRequest.mockResolvedValue([]);

    await getTransactionsByUser(42);

    expect(mockApiRequest).toHaveBeenCalledWith('/transacoes/42');
  });

  it('retorna array vazio quando API retorna mensagem (sem transações)', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Nenhuma transação encontrada' });

    const result = await getTransactionsByUser(99);

    expect(result).toEqual([]);
  });

  it('retorna array vazio para qualquer resposta não-array', async () => {
    mockApiRequest.mockResolvedValue(null as any);

    const result = await getTransactionsByUser(1);

    expect(result).toEqual([]);
  });

  it('retorna múltiplas transações', async () => {
    const transactions = [
      { ...mockTransaction, id_transacao: 1 },
      { ...mockTransaction, id_transacao: 2, titulo: 'Farmácia' },
    ];
    mockApiRequest.mockResolvedValue(transactions);

    const result = await getTransactionsByUser(1);

    expect(result).toHaveLength(2);
    expect(result[0].id_transacao).toBe(1);
    expect(result[1].id_transacao).toBe(2);
  });

  it('propaga erro quando apiRequest rejeita', async () => {
    mockApiRequest.mockRejectedValue(new Error('Erro na API'));

    await expect(getTransactionsByUser(1)).rejects.toThrow('Erro na API');
  });
});

describe('createTransaction', () => {
  beforeEach(() => jest.clearAllMocks());

  const payload = {
    id_carteira: 1,
    id_usuario: 1,
    id_categoria: 2,
    titulo: 'Supermercado',
    tipo: 'DESPESA' as const,
    valor: 150.0,
    data_transacao: '2024-06-01',
  };

  it('chama apiRequest com POST em /transacoes', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Criado', id_transacao: 99 });

    await createTransaction(payload);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/transacoes',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('serializa o payload no body', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'ok', id_transacao: 1 });

    await createTransaction(payload);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/transacoes',
      expect.objectContaining({ body: JSON.stringify(payload) })
    );
  });

  it('retorna mensagem e id_transacao em caso de sucesso', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Criado com sucesso', id_transacao: 55 });

    const result = await createTransaction(payload);

    expect(result).toEqual({ mensagem: 'Criado com sucesso', id_transacao: 55 });
  });

  it('propaga erro da API', async () => {
    mockApiRequest.mockRejectedValue(new Error('Erro ao criar transação'));

    await expect(createTransaction(payload)).rejects.toThrow('Erro ao criar transação');
  });
});

describe('updateTransaction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('chama apiRequest com PUT e o id correto', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Atualizado' });

    await updateTransaction(10, { titulo: 'Editado' });

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/transacoes/10',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('serializa o payload parcial no body', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'ok' });
    const partial = { valor: 200 };

    await updateTransaction(5, partial);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/transacoes/5',
      expect.objectContaining({ body: JSON.stringify(partial) })
    );
  });

  it('retorna mensagem de sucesso', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Atualizado com sucesso' });

    const result = await updateTransaction(1, { titulo: 'Novo título' });

    expect(result).toEqual({ mensagem: 'Atualizado com sucesso' });
  });

  it('propaga erro da API', async () => {
    mockApiRequest.mockRejectedValue(new Error('Não encontrado'));

    await expect(updateTransaction(999, {})).rejects.toThrow('Não encontrado');
  });
});

describe('deleteTransaction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('chama apiRequest com DELETE e o id correto', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Deletado' });

    await deleteTransaction(7);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/transacoes/7',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('retorna mensagem de sucesso', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Transação removida' });

    const result = await deleteTransaction(3);

    expect(result).toEqual({ mensagem: 'Transação removida' });
  });

  it('propaga erro da API', async () => {
    mockApiRequest.mockRejectedValue(new Error('Erro ao deletar'));

    await expect(deleteTransaction(1)).rejects.toThrow('Erro ao deletar');
  });
});
