import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTransactionSync } from '@/src/services/transactions';

jest.mock('@/src/services/api', () => ({
  API_BASE_URL: 'http://localhost:3000',
  apiRequest: jest.fn(),
}));

import { apiRequest } from '@/src/services/api';

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const mockTransaction = {
  id_transacao: 1,
  titulo: 'Mercado',
  tipo: 'DESPESA' as const,
  valor: 100,
  data_transacao: '2024-06-01',
  categoria: 'Alimentação',
};

describe('useTransactionSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue([mockTransaction]);
  });

  it('carrega transações na montagem', async () => {
    const { result } = renderHook(() => useTransactionSync(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApiRequest).toHaveBeenCalledWith('/transacoes/1');
    expect(result.current.transactions).toEqual([mockTransaction]);
    expect(result.current.lastSync).toBeInstanceOf(Date);
  });

  it('não busca quando userId é undefined', () => {
    renderHook(() => useTransactionSync(undefined));
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it('sincroniza novamente no intervalo de polling', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useTransactionSync(1, 5000));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiRequest).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await waitFor(() => expect(mockApiRequest).toHaveBeenCalledTimes(2));
    jest.useRealTimers();
  });

  it('refresh força nova busca', async () => {
    const { result } = renderHook(() => useTransactionSync(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockApiRequest).toHaveBeenCalledTimes(2);
  });

  it('mantém transações anteriores quando polling falha', async () => {
    mockApiRequest
      .mockResolvedValueOnce([mockTransaction])
      .mockRejectedValueOnce(new Error('offline'));

    jest.useFakeTimers();
    const { result } = renderHook(() => useTransactionSync(1, 5000));

    await waitFor(() => expect(result.current.transactions).toHaveLength(1));

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await waitFor(() => expect(mockApiRequest).toHaveBeenCalledTimes(2));
    expect(result.current.transactions).toEqual([mockTransaction]);
    jest.useRealTimers();
  });
});
