import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '@/app/register';
import { GUEST_USER } from '@/src/context/AuthContext';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text testID="redirect">{href}</Text>;
  },
  router: { replace: jest.fn() },
}));

jest.mock('@/src/context/AuthContext', () => ({
  useAuth: jest.fn(),
  GUEST_USER: { id_usuario: 1, nome: 'Lucas Silva', email: 'lucas.silva@email.com' },
}));

jest.mock('@/src/services/api', () => ({
  apiRequest: jest.fn(),
}));

import { useAuth } from '@/src/context/AuthContext';
import { apiRequest } from '@/src/services/api';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: GUEST_USER,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renderiza formulário de cadastro', () => {
    const { getAllByText, getByPlaceholderText, getByText } = render(<RegisterScreen />);
    expect(getAllByText('Criar Conta').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Abra seu acesso e comece a organizar suas finanças.')).toBeTruthy();
    expect(getByPlaceholderText('Nome')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
  });

  it('exibe erro quando senhas não coincidem', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome'), 'João');
    fireEvent.changeText(getByPlaceholderText('Email'), 'joao@email.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), '123456');
    fireEvent.changeText(getByPlaceholderText('Confirme a senha'), '654321');
    fireEvent.press(getAllByText('Criar Conta')[1]);

    await waitFor(() => {
      expect(getByText('As senhas não coincidem.')).toBeTruthy();
    });
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it('cria conta via API com sucesso', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Usuário criado com sucesso' });

    const { getByPlaceholderText, getAllByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome'), 'João');
    fireEvent.changeText(getByPlaceholderText('Email'), 'joao@email.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), '123456');
    fireEvent.changeText(getByPlaceholderText('Confirme a senha'), '123456');
    fireEvent.press(getAllByText('Criar Conta')[1]);

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/usuarios', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          nome: 'João',
          email: 'joao@email.com',
          senha: '123456',
        }),
      }));
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
});
