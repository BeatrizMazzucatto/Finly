import { login } from '@/src/services/auth';

// Mock do módulo api
jest.mock('@/src/services/api', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '@/src/services/api';

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('auth.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('chama apiRequest com a rota correta', async () => {
    const mockUser = { id_usuario: 1, nome: 'João', email: 'joao@test.com' };
    mockApiRequest.mockResolvedValue(mockUser);

    await login({ email: 'joao@test.com', senha: '123456' });

    expect(mockApiRequest).toHaveBeenCalledWith('/usuarios/login', expect.any(Object));
  });

  it('chama apiRequest com método POST', async () => {
    mockApiRequest.mockResolvedValue({});

    await login({ email: 'test@test.com', senha: 'pass' });

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/usuarios/login',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('serializa o payload no body', async () => {
    mockApiRequest.mockResolvedValue({});
    const payload = { email: 'user@test.com', senha: 'secret' };

    await login(payload);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/usuarios/login',
      expect.objectContaining({ body: JSON.stringify(payload) })
    );
  });

  it('retorna o usuário autenticado em caso de sucesso', async () => {
    const mockUser = { id_usuario: 42, nome: 'Maria', email: 'maria@test.com' };
    mockApiRequest.mockResolvedValue(mockUser);

    const result = await login({ email: 'maria@test.com', senha: '12345' });

    expect(result).toEqual(mockUser);
  });

  it('propaga erro quando apiRequest rejeita', async () => {
    mockApiRequest.mockRejectedValue(new Error('Credenciais inválidas'));

    await expect(login({ email: 'wrong@test.com', senha: 'wrong' })).rejects.toThrow(
      'Credenciais inválidas'
    );
  });

  it('propaga erro genérico de rede', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network request failed'));

    await expect(login({ email: 'a@a.com', senha: '123' })).rejects.toThrow(
      'Network request failed'
    );
  });
});
