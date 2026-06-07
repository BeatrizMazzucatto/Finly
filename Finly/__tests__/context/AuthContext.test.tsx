import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth, GUEST_USER } from '@/src/context/AuthContext';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/src/services/auth', () => ({
  login: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginService } from '@/src/services/auth';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockLoginService = loginService as jest.MockedFunction<typeof loginService>;

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('GUEST_USER', () => {
  it('tem id_usuario igual a 1', () => {
    expect(GUEST_USER.id_usuario).toBe(1);
  });

  it('tem nome definido', () => {
    expect(typeof GUEST_USER.nome).toBe('string');
    expect(GUEST_USER.nome.length).toBeGreaterThan(0);
  });

  it('tem email com "@"', () => {
    expect(GUEST_USER.email).toContain('@');
  });
});

describe('AuthProvider - estado inicial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  it('começa com loading = true', () => {
    mockAsyncStorage.getItem.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('termina com loading = false após restaurar sessão', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('usa GUEST_USER quando não há sessão salva', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(GUEST_USER);
  });
});

describe('AuthProvider - restoreSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  it('restaura usuário do AsyncStorage quando há sessão', async () => {
    const savedUser = {
      id_usuario: 10,
      nome: 'Ana',
      email: 'ana@test.com',
    };

    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(savedUser);
  });

  it('lê a chave correta do AsyncStorage', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        'finly_auth_user'
      );
    });
  });

  it('mantém loading = false mesmo quando AsyncStorage lança erro', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockAsyncStorage.getItem.mockRejectedValueOnce('Storage error');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    consoleSpy.mockRestore();
  });
});

describe('AuthProvider - login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  it('atualiza o usuário após login bem-sucedido', async () => {
    const authUser = {
      id_usuario: 5,
      nome: 'Carlos',
      email: 'carlos@test.com',
    };

    mockLoginService.mockResolvedValue(authUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('carlos@test.com', '12345');
    });

    expect(result.current.user).toEqual(authUser);
  });

  it('persiste o usuário no AsyncStorage após login', async () => {
    const authUser = {
      id_usuario: 5,
      nome: 'Carlos',
      email: 'carlos@test.com',
    };

    mockLoginService.mockResolvedValue(authUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('carlos@test.com', '12345');
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'finly_auth_user',
      JSON.stringify(authUser)
    );
  });

  it('retorna o usuário autenticado', async () => {
    const authUser = {
      id_usuario: 7,
      nome: 'Pedro',
      email: 'pedro@test.com',
    };

    mockLoginService.mockResolvedValue(authUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let returnedUser: any;

    await act(async () => {
      returnedUser = await result.current.login(
        'pedro@test.com',
        'pass'
      );
    });

    expect(returnedUser).toEqual(authUser);
  });

  it('propaga erro quando loginService falha', async () => {
    mockLoginService.mockRejectedValue(
      new Error('Credenciais inválidas')
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.login('errado@test.com', 'errado')
    ).rejects.toThrow('Credenciais inválidas');
  });
});

describe('AuthProvider - logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  it('retorna ao GUEST_USER após logout', async () => {
    const authUser = {
      id_usuario: 5,
      nome: 'Carlos',
      email: 'carlos@test.com',
    };

    mockLoginService.mockResolvedValue(authUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('carlos@test.com', '12345');
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toEqual(GUEST_USER);
  });

  it('remove a chave do AsyncStorage ao fazer logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
      'finly_auth_user'
    );
  });
});

describe('AuthProvider - updateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  it('atualiza o usuário no estado', async () => {
    const newUser = {
      id_usuario: 9,
      nome: 'Nova',
      email: 'nova@test.com',
    };

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateUser(newUser);
    });

    expect(result.current.user).toEqual(newUser);
  });

  it('persiste o novo usuário no AsyncStorage', async () => {
    const newUser = {
      id_usuario: 9,
      nome: 'Nova',
      email: 'nova@test.com',
    };

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateUser(newUser);
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'finly_auth_user',
      JSON.stringify(newUser)
    );
  });
});

describe('useAuth fora do AuthProvider', () => {
  it('lança erro ao usar useAuth sem AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth deve ser usado dentro de AuthProvider'
    );

    spy.mockRestore();
  });
});