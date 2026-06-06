import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/login';
import { GUEST_USER } from '@/src/context/AuthContext';

const mockLogin = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text testID="redirect">{href}</Text>;
  },
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

jest.mock('@/src/context/AuthContext', () => ({
  useAuth: jest.fn(),
  GUEST_USER: { id_usuario: 1, nome: 'Lucas Silva', email: 'lucas.silva@email.com' },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import { useAuth } from '@/src/context/AuthContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: GUEST_USER,
      loading: false,
      login: mockLogin,
      logout: jest.fn(),
      updateUser: jest.fn(),
    });
  });

  it('renderiza formulário de login', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    expect(getByText('Finly')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
  });

  it('exibe erro quando campos estão vazios', async () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Entrar'));
    await waitFor(() => {
      expect(getByText('Preencha email e senha.')).toBeTruthy();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('redireciona usuário autenticado para tabs', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id_usuario: 2,
        nome: 'Maria',
        email: 'maria@email.com',
        id_carteira_pessoal: 5,
      },
      loading: false,
      login: mockLogin,
      logout: jest.fn(),
      updateUser: jest.fn(),
    });

    const { getByTestId } = render(<LoginScreen />);
    expect(getByTestId('redirect').props.children).toBe('/(tabs)');
  });

  it('chama login e navega para tabs após sucesso', async () => {
    mockLogin.mockResolvedValue({
      id_usuario: 2,
      nome: 'Maria',
      email: 'maria@email.com',
      id_carteira_pessoal: 5,
    });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'maria@email.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), '123456');
    fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('maria@email.com', '123456');
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });
});
