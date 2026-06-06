import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';

jest.mock('@/src/services/auth', () => ({
  login: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

import { login as loginService } from '@/src/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockLoginService = loginService as jest.MockedFunction<typeof loginService>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function LoginProbe() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <Text testID="loading">loading</Text>;

  return (
    <>
      <Text testID="user-id">{user.id_usuario}</Text>
      <Pressable
        testID="login-btn"
        onPress={() => login('maria@email.com', '123456')}
      >
        <Text>Login</Text>
      </Pressable>
      <Pressable testID="logout-btn" onPress={() => logout()}>
        <Text>Logout</Text>
      </Pressable>
    </>
  );
}

describe('Integração: fluxo de autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  it('restaura sessão do AsyncStorage e mantém usuário logado', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        id_usuario: 5,
        nome: 'Maria',
        email: 'maria@email.com',
        id_carteira_pessoal: 2,
      })
    );

    const { getByTestId } = render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('user-id').props.children).toBe(5);
    });
  });

  it('login integra serviço de auth + persistência + estado do contexto', async () => {
    mockLoginService.mockResolvedValue({
      id_usuario: 9,
      nome: 'João',
      email: 'joao@email.com',
      id_carteira_pessoal: 3,
    });

    const { getByTestId } = render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(getByTestId('user-id').props.children).toBe(1));

    fireEvent.press(getByTestId('login-btn'));

    await waitFor(() => {
      expect(mockLoginService).toHaveBeenCalledWith({
        email: 'maria@email.com',
        senha: '123456',
      });
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      expect(getByTestId('user-id').props.children).toBe(9);
    });
  });

  it('logout limpa sessão e volta ao usuário convidado', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({ id_usuario: 5, nome: 'Maria', email: 'maria@email.com' })
    );

    const { getByTestId } = render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(getByTestId('user-id').props.children).toBe(5));

    fireEvent.press(getByTestId('logout-btn'));

    await waitFor(() => {
      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
      expect(getByTestId('user-id').props.children).toBe(1);
    });
  });
});
