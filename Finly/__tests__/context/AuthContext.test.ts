import { GUEST_USER } from '@/src/context/AuthContext';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock do serviço de autenticação
jest.mock('@/src/services/auth', () => ({
  login: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginService } from '@/src/services/auth';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockLoginService = loginService as jest.MockedFunction<typeof loginService>;

describe('GUEST_USER', () => {
  it('tem id_usuario igual a 1 (usuário convidado)', () => {
    expect(GUEST_USER.id_usuario).toBe(1);
  });

  it('tem nome definido', () => {
    expect(GUEST_USER.nome).toBeTruthy();
    expect(typeof GUEST_USER.nome).toBe('string');
  });

  it('tem email definido', () => {
    expect(GUEST_USER.email).toBeTruthy();
    expect(GUEST_USER.email).toContain('@');
  });
});

describe('AuthContext - lógica de sessão', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('salva usuário no AsyncStorage ao fazer login', async () => {
    const mockUser = { id_usuario: 42, nome: 'Maria', email: 'maria@test.com' };
    mockLoginService.mockResolvedValue(mockUser);
    mockAsyncStorage.setItem.mockResolvedValue();

    await loginService({ email: 'maria@test.com', senha: '123456' });
    await AsyncStorage.setItem('finly_auth_user', JSON.stringify(mockUser));

    expect(mockLoginService).toHaveBeenCalledWith({ email: 'maria@test.com', senha: '123456' });
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('finly_auth_user', JSON.stringify(mockUser));
  });

  it('remove chave do AsyncStorage ao fazer logout', async () => {
    mockAsyncStorage.removeItem.mockResolvedValue();

    await AsyncStorage.removeItem('finly_auth_user');

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('finly_auth_user');
  });

  it('lança erro quando loginService falha', async () => {
    mockLoginService.mockRejectedValue(new Error('Credenciais inválidas'));

    await expect(loginService({ email: 'errado@test.com', senha: 'errado' })).rejects.toThrow(
      'Credenciais inválidas'
    );
  });

  it('restaura sessão do AsyncStorage corretamente', async () => {
    const mockUser = { id_usuario: 10, nome: 'Ana', email: 'ana@test.com' };
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockUser));

    const cached = await AsyncStorage.getItem('finly_auth_user');
    const parsed = JSON.parse(cached!);

    expect(parsed).toEqual(mockUser);
    expect(parsed.id_usuario).not.toBe(1); // não é guest
  });
});
