import { apiRequest, API_BASE_URL } from '@/src/services/api';

// Mock expo-constants and react-native Platform
jest.mock('expo-constants', () => ({
  default: { expoConfig: { hostUri: 'localhost:8081' } },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('API_BASE_URL', () => {
  it('é uma string não vazia', () => {
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL.length).toBeGreaterThan(0);
  });

  it('começa com http', () => {
    expect(API_BASE_URL).toMatch(/^http/);
  });
});

describe('apiRequest', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  function mockFetch(status: number, body: unknown) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response);
  }

  function mockFetchJsonError(status = 200) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockRejectedValue(new Error('JSON parse error')),
    } as unknown as Response);
  }

  it('retorna dados com sucesso (200)', async () => {
    const mockData = { id: 1, nome: 'Teste' };
    mockFetch(200, mockData);

    const result = await apiRequest('/test');
    expect(result).toEqual(mockData);
  });

  it('inclui Content-Type: application/json por padrão', async () => {
    mockFetch(200, {});

    await apiRequest('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('faz a chamada com o path correto', async () => {
    mockFetch(200, {});

    await apiRequest('/usuarios/login');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/usuarios/login'),
      expect.any(Object)
    );
  });

  it('lança erro com mensagem da API quando response não é ok', async () => {
    mockFetch(400, { erro: 'Credenciais inválidas' });

    await expect(apiRequest('/test')).rejects.toThrow(
      'Credenciais inválidas'
    );
  });

  it('lança erro com mensagem padrão quando body não tem campo "erro"', async () => {
    mockFetch(500, { message: 'Internal Server Error' });

    await expect(apiRequest('/test')).rejects.toThrow('Erro na API');
  });

  it('lança erro padrão quando body é null (parse falhou) e status não ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error('invalid json')),
    } as unknown as Response);

    await expect(apiRequest('/test')).rejects.toThrow('Erro na API');
  });

  it('retorna null quando JSON falha mas response é ok', async () => {
    mockFetchJsonError(200);

    const result = await apiRequest('/test');

    expect(result).toBeNull();
  });

  it('sobrescreve headers quando options.headers é fornecido', async () => {
    mockFetch(200, {});

    await apiRequest('/test', {
      headers: {
        Authorization: 'Bearer token123',
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token123',
        }),
      })
    );
  });

  it('passa o método HTTP correto', async () => {
    mockFetch(200, {});

    await apiRequest('/test', {
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('lança quando fetch rejeita (sem conexão)', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('Network request failed'));

    await expect(apiRequest('/test')).rejects.toThrow(
      'Network request failed'
    );
  });

  it('lança erro com campo "erro" como string quando status não ok', async () => {
    mockFetch(422, { erro: 'Campos obrigatórios ausentes' });

    await expect(apiRequest('/test')).rejects.toThrow(
      'Campos obrigatórios ausentes'
    );
  });

  it('lança erro padrão quando campo "erro" não é string', async () => {
    mockFetch(422, { erro: 123 });

    await expect(apiRequest('/test')).rejects.toThrow('Erro na API');
  });
});